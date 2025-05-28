import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { 
  FormUpdateRequest, 
  FormDetailResponse, 
  ErrorResponse,
  SuccessResponse,
  RolePermission,
  Role
} from '@/app/api/types';

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
    const currentUserRole = (userData.role as any)?.name;
    const currentUserRoleId = (userData.role as any)?.id;

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
        console.log('Permissions data structure:', JSON.stringify(permissionsData, null, 2));
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

    // 整理欄位資料，將選項排序
    const formattedFields = fields?.map(field => ({
      ...field,
      form_field_options: field.form_field_options?.sort((a: any, b: any) => a.display_order - b.display_order)
    })) || [];

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
    const currentUserRole = (userData.role as any)?.name;
    const currentUserRoleId = (userData.role as any)?.id;
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
    const updateData: any = {};
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

    // 如果提供了欄位資料，更新欄位
    if (fields.length > 0) {
      // 先獲取現有欄位的 ID
      const { data: existingFields, error: getFieldsError } = await supabase
        .from('form_fields')
        .select('id')
        .eq('form_id', id);

      if (getFieldsError) {
        console.error('Error getting existing fields:', getFieldsError);
      }

      // 刪除現有的欄位選項
      if (existingFields && existingFields.length > 0) {
        const fieldIds = existingFields.map(f => f.id);
        const { error: deleteOptionsError } = await supabase
          .from('form_field_options')
          .delete()
          .in('field_id', fieldIds);

        if (deleteOptionsError) {
          console.error('Error deleting field options:', deleteOptionsError);
        }
      }

      // 刪除現有的欄位
      const { error: deleteFieldsError } = await supabase
        .from('form_fields')
        .delete()
        .eq('form_id', id);

      if (deleteFieldsError) {
        console.error('Error deleting form fields:', deleteFieldsError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to update form fields' },
          { status: 500 }
        );
      }

      // 創建新的欄位
      const formFields = fields.map((field, index) => ({
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

      // 為有選項的欄位創建選項
      for (const field of fields) {
        if (field.options && field.options.length > 0) {
          const fieldData = createdFields?.find(f => f.field_name === field.field_name);
          if (fieldData) {
            const options = field.options.map((option, index) => ({
              field_id: fieldData.id,
              option_value: option.option_value,
              option_label: option.option_label,
              display_order: option.display_order || index,
              is_active: option.is_active !== false,
            }));

            const { error: optionsError } = await supabase
              .from('form_field_options')
              .insert(options);

            if (optionsError) {
              console.error('Error creating field options:', optionsError);
            }
          }
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
    const currentUserRole = (userData.role as any)?.name;
    const currentUserRoleId = (userData.role as any)?.id;
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