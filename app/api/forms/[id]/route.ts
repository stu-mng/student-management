import type {
    ErrorResponse,
    ExtendedFormFieldOption,
    FormDetailResponse,
    FormFieldCreateRequest,
    FormFieldOption,
    FormFieldOptionCreateRequest,
    FormUpdateRequest,
    Role,
    RolePermission,
    SuccessResponse
} from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Supabase 客戶端類型
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        role:roles(
          id,
          name,
          display_name,
          color,
          order
        )
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    const { id } = await params;

    // 獲取表單基本資訊
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select(`
        *,
        owner:users!forms_created_by_fkey(
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (formError) {
      if (formError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching form:', formError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch form' },
        { status: 500 }
      );
    }

    // 檢查用戶的存取權限
    let accessType: 'read' | 'edit' | null = null;
    const userRole = userData.role as unknown as Role;
    const currentUserRole = userRole?.name;
    const currentUserRoleId = userRole?.id;

    // 1. 如果是表單創建者，給予編輯權限
    if (form.created_by === user.id) {
      accessType = 'edit';
    }
    // 2. 如果是 admin 或 root，給予編輯權限
    else if (['admin', 'root'].includes(currentUserRole)) {
      accessType = 'edit';
    }
    // 3. 檢查 user_form_access 表
    else if (currentUserRoleId) {
      const { data: userAccess, error: accessError } = await supabase
        .from('user_form_access')
        .select('access_type')
        .eq('form_id', form.id)
        .eq('role_id', currentUserRoleId)
        .single();

      if (!accessError && userAccess) {
        accessType = userAccess.access_type as 'read' | 'edit';
      }
    }

    // 如果沒有任何權限，拒絕存取
    if (!accessType) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 獲取表單欄位
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select(`
        *,
        form_field_options (
          id,
          option_value,
          option_label,
          option_type,
          row_label,
          column_label,
          display_order,
          is_active
        )
      `)
      .eq('form_id', id)
      .eq('is_active', true)
      .order('display_order');

    if (fieldsError) {
      console.error('Error fetching form fields:', fieldsError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch form fields' },
        { status: 500 }
      );
    }

    // 獲取表單權限設定（只有編輯權限的用戶才能看到）
    let permissions: RolePermission[] = [];
    if (accessType === 'edit') {
      // 使用 role_id 來 join roles 表
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_form_access')
        .select(`
          access_type,
          role:roles!user_form_access_role_id_fkey(
          id,
          name,
          display_name,
          color,
          order
        )
        `)
        .eq('form_id', id)
        .not('role_id', 'is', null);

      if (permissionsError) {
        console.error('Error fetching form permissions:', permissionsError);
      } else if (permissionsData) {
        permissions = permissionsData
          .filter(p => p.role) // 確保有角色資料
          .map(p => {
            // 處理可能的數組或對象結構
            const roleData = Array.isArray(p.role) ? p.role[0] : p.role;
            return {
              role: roleData as Role,
              access_type: p.access_type
            };
          });
      }
    }

    // 整理欄位資料，將選項排序並重建 grid_options
    const formattedFields = fields?.map(field => {
      const sortedOptions = field.form_field_options?.sort((a: FormFieldOption, b: FormFieldOption) => a.display_order - b.display_order) || [];
      
      // 如果是 grid 類型欄位，重建 grid_options 結構
      let gridOptions = undefined;
      if (['radio_grid', 'checkbox_grid'].includes(field.field_type)) {
        const rowOptions = sortedOptions.filter((opt: FormFieldOption & { option_type?: string }) => opt.option_type === 'grid_row');
        const columnOptions = sortedOptions.filter((opt: FormFieldOption & { option_type?: string }) => opt.option_type === 'grid_column');
        
        if (rowOptions.length > 0 || columnOptions.length > 0) {
          gridOptions = {
            rows: rowOptions.map((opt: FormFieldOption & { option_value: string; option_label: string }) => ({
              value: opt.option_value,
              label: opt.option_label
            })),
            columns: columnOptions.map((opt: FormFieldOption & { option_value: string; option_label: string }) => ({
              value: opt.option_value,
              label: opt.option_label
            }))
          };
        }
      }

      return {
        ...field,
        form_field_options: sortedOptions.filter((opt: FormFieldOption & { option_type?: string }) => opt.option_type !== 'grid_row' && opt.option_type !== 'grid_column'),
        grid_options: gridOptions
      };
    }) || [];

    // 檢查當前用戶是否已經提交回應
    let submitted = false;
    const { data: existingResponse, error: responseError } = await supabase
      .from('form_responses')
      .select('id, submission_status')
      .eq('form_id', id)
      .eq('respondent_id', user.id)
      .eq('submission_status', 'submitted')
      .single();

    if (!responseError && existingResponse) {
      submitted = true;
    }

    return NextResponse.json<FormDetailResponse>({
      success: true,
      data: {
        ...form,
        fields: formattedFields,
        access_type: accessType,
        permissions: permissions,
        submitted: submitted,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/forms/[id]:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        role:roles(
          id,
          name,
          display_name,
          color,
          order
        )
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 檢查用戶是否有編輯權限
    const userRole = userData.role as unknown as Role;
    const currentUserRole = userRole?.name;
    const currentUserRoleId = userRole?.id;
    let hasEditPermission = false;

    // 1. 如果是表單創建者，給予編輯權限
    const { data: formData, error: formCheckError } = await supabase
      .from('forms')
      .select('created_by')
      .eq('id', id)
      .single();

    if (formCheckError) {
      if (formCheckError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      console.error('Error checking form existence:', formCheckError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to check form' },
        { status: 500 }
      );
    }

    if (formData.created_by === user.id) {
      hasEditPermission = true;
    }
    // 2. 如果是 admin 或 root，給予編輯權限
    else if (['admin', 'root'].includes(currentUserRole)) {
      hasEditPermission = true;
    }
    // 3. 檢查 user_form_access 表中該角色的權限設定
    else if (currentUserRoleId) {
      const { data: userAccess, error: accessError } = await supabase
        .from('user_form_access')
        .select('access_type')
        .eq('form_id', id)
        .eq('role_id', currentUserRoleId)
        .single();

      if (!accessError && userAccess && userAccess.access_type === 'edit') {
        hasEditPermission = true;
      }
    }

    if (!hasEditPermission) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    const body: FormUpdateRequest = await request.json();
    const {
      title,
      description,
      form_type,
      status,
      is_required,
      allow_multiple_submissions,
      submission_deadline,
      fields = []
    } = body;

    // 更新表單基本資訊
    const updateData: Partial<{
      title: string;
      description: string;
      form_type: string;
      status: string;
      is_required: boolean;
      allow_multiple_submissions: boolean;
      submission_deadline: string;
    }> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (form_type !== undefined) updateData.form_type = form_type;
    if (status !== undefined) updateData.status = status;
    if (is_required !== undefined) updateData.is_required = is_required;
    if (allow_multiple_submissions !== undefined) updateData.allow_multiple_submissions = allow_multiple_submissions;
    if (submission_deadline !== undefined) updateData.submission_deadline = submission_deadline;

    const { data: updatedForm, error: updateError } = await supabase
      .from('forms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating form:', updateError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to update form' },
        { status: 500 }
      );
    }

    // 如果提供了欄位資料，更新欄位（使用更新而非刪除重建的方式）
    if (fields.length > 0) {
      // 獲取現有欄位
      const { data: existingFields, error: getFieldsError } = await supabase
        .from('form_fields')
        .select(`
          *,
          form_field_options (
            id,
            option_value,
            option_label,
            option_type,
            row_label,
            column_label,
            display_order,
            is_active
          )
        `)
        .eq('form_id', id);

      if (getFieldsError) {
        console.error('Error getting existing fields:', getFieldsError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to get existing fields' },
          { status: 500 }
        );
      }

      const existingFieldsMap = new Map(existingFields?.map(f => [f.field_name, f]) || []);
      const newFieldNames = new Set(fields.map(f => f.field_name));

      // 1. 處理現有欄位的更新和停用
      for (const existingField of existingFields || []) {
        if (newFieldNames.has(existingField.field_name)) {
          // 欄位仍存在，進行更新
          const newFieldData = fields.find(f => f.field_name === existingField.field_name);
          if (newFieldData) {
            const fieldUpdateData = {
              field_label: newFieldData.field_label,
              field_type: newFieldData.field_type,
              display_order: newFieldData.display_order || 0,
              is_required: newFieldData.is_required || false,
              is_active: newFieldData.is_active !== false,
              placeholder: newFieldData.placeholder,
              help_text: newFieldData.help_text,
              validation_rules: newFieldData.validation_rules,
              conditional_logic: newFieldData.conditional_logic,
              default_value: newFieldData.default_value,
              min_length: newFieldData.min_length,
              max_length: newFieldData.max_length,
              pattern: newFieldData.pattern,
              student_field_mapping: newFieldData.student_field_mapping,
              auto_populate_from: newFieldData.auto_populate_from,
            };

            const { error: updateFieldError } = await supabase
              .from('form_fields')
              .update(fieldUpdateData)
              .eq('id', existingField.id);

            if (updateFieldError) {
              console.error('Error updating field:', updateFieldError);
            }

            // 更新欄位選項
            await updateFieldOptions(supabase, existingField.id, newFieldData, existingField.form_field_options || []);
          }
        } else {
          // 欄位不再存在，標記為停用而不是刪除
          const { error: deactivateFieldError } = await supabase
            .from('form_fields')
            .update({ is_active: false })
            .eq('id', existingField.id);

          if (deactivateFieldError) {
            console.error('Error deactivating field:', deactivateFieldError);
          }
        }
      }

      // 2. 處理新增的欄位
      const newFields = fields.filter(f => !existingFieldsMap.has(f.field_name));
      if (newFields.length > 0) {
        const formFields = newFields.map((field, index) => ({
          form_id: id,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          display_order: field.display_order || index,
          is_required: field.is_required || false,
          is_active: field.is_active !== false,
          placeholder: field.placeholder,
          help_text: field.help_text,
          validation_rules: field.validation_rules,
          conditional_logic: field.conditional_logic,
          default_value: field.default_value,
          min_length: field.min_length,
          max_length: field.max_length,
          pattern: field.pattern,
          student_field_mapping: field.student_field_mapping,
          auto_populate_from: field.auto_populate_from,
        }));

        const { data: createdFields, error: fieldsError } = await supabase
          .from('form_fields')
          .insert(formFields)
          .select();

        if (fieldsError) {
          console.error('Error creating form fields:', fieldsError);
          return NextResponse.json<ErrorResponse>(
            { error: 'Failed to create form fields' },
            { status: 500 }
          );
        }

        // 為新欄位創建選項
        for (const field of newFields) {
          const fieldData = createdFields?.find(f => f.field_name === field.field_name);
          if (!fieldData) continue;

          await createFieldOptions(supabase, fieldData.id, field);
        }
      }
    }

    return NextResponse.json<FormDetailResponse>({
      success: true,
      data: updatedForm,
    });

  } catch (error) {
    console.error('Error in PUT /api/forms/[id]:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 輔助函數：更新欄位選項
async function updateFieldOptions(
  supabase: SupabaseClient,
  fieldId: string,
  newFieldData: FormFieldCreateRequest,
  existingOptions: ExtendedFormFieldOption[]
) {
  // 處理一般選項
  if (newFieldData.options && newFieldData.options.length > 0) {
    const existingOptionsMap = new Map(existingOptions.filter(o => o.option_type === 'standard' || !o.option_type).map(o => [o.option_value, o]));
    const newOptionValues = new Set(newFieldData.options.map((o: FormFieldOptionCreateRequest) => o.option_value));

    // 停用不再存在的選項
    for (const existingOption of existingOptions.filter(o => o.option_type === 'standard' || !o.option_type)) {
      if (!newOptionValues.has(existingOption.option_value)) {
        await supabase
          .from('form_field_options')
          .update({ is_active: false })
          .eq('id', existingOption.id);
      }
    }

    // 更新或創建選項
    for (let index = 0; index < newFieldData.options.length; index++) {
      const option = newFieldData.options[index];
      const existingOption = existingOptionsMap.get(option.option_value);
      if (existingOption) {
        // 更新現有選項
        await supabase
          .from('form_field_options')
          .update({
            option_label: option.option_label,
            display_order: option.display_order || index,
            is_active: option.is_active !== false,
          })
          .eq('id', existingOption.id);
      } else {
        // 創建新選項
        await supabase
          .from('form_field_options')
          .insert({
            field_id: fieldId,
            option_value: option.option_value,
            option_label: option.option_label,
            display_order: option.display_order || index,
            is_active: option.is_active !== false,
            option_type: 'standard'
          });
      }
    }
  } else {
    // 如果沒有提供選項，停用所有現有的一般選項
    await supabase
      .from('form_field_options')
      .update({ is_active: false })
      .eq('field_id', fieldId)
      .in('option_type', ['standard', null]);
  }

  // 處理 grid 選項
  if (newFieldData.grid_options && ['radio_grid', 'checkbox_grid'].includes(newFieldData.field_type)) {
    // 停用所有現有的 grid 選項
    await supabase
      .from('form_field_options')
      .update({ is_active: false })
      .eq('field_id', fieldId)
      .in('option_type', ['grid_row', 'grid_column']);

    const gridOptions: Array<{
      field_id: string;
      option_value: string;
      option_label: string;
      option_type: string;
      row_label?: string;
      column_label?: string;
      display_order: number;
      is_active: boolean;
    }> = [];

    // 添加行選項
    if (newFieldData.grid_options.rows) {
      newFieldData.grid_options.rows.forEach((row: { value: string; label: string }, index: number) => {
        gridOptions.push({
          field_id: fieldId,
          option_value: row.value,
          option_label: row.label,
          option_type: 'grid_row',
          row_label: row.label,
          display_order: index,
          is_active: true
        });
      });
    }

    // 添加列選項
    if (newFieldData.grid_options.columns) {
      newFieldData.grid_options.columns.forEach((column: { value: string; label: string }, index: number) => {
        gridOptions.push({
          field_id: fieldId,
          option_value: column.value,
          option_label: column.label,
          option_type: 'grid_column',
          column_label: column.label,
          display_order: index,
          is_active: true
        });
      });
    }

    if (gridOptions.length > 0) {
      await supabase
        .from('form_field_options')
        .insert(gridOptions);
    }
  }
}

// 輔助函數：為新欄位創建選項
async function createFieldOptions(supabase: SupabaseClient, fieldId: string, field: FormFieldCreateRequest) {
  // 處理一般選項（select, radio, checkbox）
  if (field.options && field.options.length > 0) {
    const options = field.options.map((option: FormFieldOptionCreateRequest, index: number) => ({
      field_id: fieldId,
      option_value: option.option_value,
      option_label: option.option_label,
      display_order: option.display_order || index,
      is_active: option.is_active !== false,
      option_type: 'standard'
    }));

    const { error: optionsError } = await supabase
      .from('form_field_options')
      .insert(options);

    if (optionsError) {
      console.error('Error creating field options:', optionsError);
    }
  }

  // 處理 grid 選項（radio_grid, checkbox_grid）
  if (field.grid_options && ['radio_grid', 'checkbox_grid'].includes(field.field_type)) {
    const gridOptions: Array<{
      field_id: string;
      option_value: string;
      option_label: string;
      option_type: string;
      row_label?: string;
      column_label?: string;
      display_order: number;
      is_active: boolean;
    }> = [];

    // 添加行選項
    if (field.grid_options.rows) {
      field.grid_options.rows.forEach((row: { value: string; label: string }, index: number) => {
        gridOptions.push({
          field_id: fieldId,
          option_value: row.value,
          option_label: row.label,
          option_type: 'grid_row',
          row_label: row.label,
          display_order: index,
          is_active: true
        });
      });
    }

    // 添加列選項
    if (field.grid_options.columns) {
      field.grid_options.columns.forEach((column: { value: string; label: string }, index: number) => {
        gridOptions.push({
          field_id: fieldId,
          option_value: column.value,
          option_label: column.label,
          option_type: 'grid_column',
          column_label: column.label,
          display_order: index,
          is_active: true
        });
      });
    }

    if (gridOptions.length > 0) {
      const { error: gridOptionsError } = await supabase
        .from('form_field_options')
        .insert(gridOptions);

      if (gridOptionsError) {
        console.error('Error creating grid options:', gridOptionsError);
      }
    }
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        role:roles(
          id,
          name,
          display_name,
          color,
          order
        )
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 檢查用戶是否有刪除權限
    const userRole = userData.role as unknown as Role;
    const currentUserRole = userRole?.name;
    const currentUserRoleId = userRole?.id;
    let hasDeletePermission = false;

    // 檢查表單是否存在並獲取創建者資訊
    const { data: formData, error: formCheckError } = await supabase
      .from('forms')
      .select('created_by')
      .eq('id', id)
      .single();

    if (formCheckError) {
      if (formCheckError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      console.error('Error checking form existence:', formCheckError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to check form' },
        { status: 500 }
      );
    }

    // 1. 如果是表單創建者，給予刪除權限
    if (formData.created_by === user.id) {
      hasDeletePermission = true;
    }
    // 2. 如果是 admin 或 root，給予刪除權限
    else if (['admin', 'root'].includes(currentUserRole)) {
      hasDeletePermission = true;
    }
    // 3. 檢查 user_form_access 表中該角色的權限設定
    else if (currentUserRoleId) {
      const { data: userAccess, error: accessError } = await supabase
        .from('user_form_access')
        .select('access_type')
        .eq('form_id', id)
        .eq('role_id', currentUserRoleId)
        .single();

      if (!accessError && userAccess && userAccess.access_type === 'edit') {
        hasDeletePermission = true;
      }
    }

    if (!hasDeletePermission) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 刪除表單（CASCADE 會自動刪除相關的欄位、選項、回應等）
    const { error: deleteError } = await supabase
      .from('forms')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting form:', deleteError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to delete form' },
        { status: 500 }
      );
    }

    return NextResponse.json<SuccessResponse & { message: string }>({
      success: true,
      message: 'Form deleted successfully',
    });

  } catch (error) {
    console.error('Error in DELETE /api/forms/[id]:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 