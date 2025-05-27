import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { 
  FormUpdateRequest, 
  FormDetailResponse, 
  ErrorResponse,
  SuccessResponse 
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    const { id } = await params;

    // 獲取表單基本資訊
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
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

    // 檢查用戶是否有權限查看此表單
    if (!['admin', 'root', 'project_manager'].includes(userData.role)) {
      if (form.target_role !== userData.role) {
        return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
      }
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

    // 整理欄位資料，將選項排序
    const formattedFields = fields?.map(field => ({
      ...field,
      form_field_options: field.form_field_options?.sort((a: any, b: any) => a.display_order - b.display_order)
    })) || [];

    return NextResponse.json<FormDetailResponse>({
      success: true,
      data: {
        ...form,
        fields: formattedFields,
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
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 只有管理員和計畫主持可以更新表單
    if (!['admin', 'root', 'project_manager'].includes(userData.role)) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = await params;
    const body: FormUpdateRequest = await request.json();
    const {
      title,
      description,
      form_type,
      target_role,
      status,
      is_required,
      allow_multiple_submissions,
      submission_deadline,
      fields = []
    } = body;

    // 檢查表單是否存在
    const { data: existingForm, error: checkError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      console.error('Error checking form existence:', checkError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to check form' },
        { status: 500 }
      );
    }

    // 更新表單基本資訊
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (form_type !== undefined) updateData.form_type = form_type;
    if (target_role !== undefined) updateData.target_role = target_role;
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
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 只有管理員和計畫主持可以刪除表單
    if (!['admin', 'root', 'project_manager'].includes(userData.role)) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = await params;

    // 檢查表單是否存在
    const { data: existingForm, error: checkError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      console.error('Error checking form existence:', checkError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to check form' },
        { status: 500 }
      );
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