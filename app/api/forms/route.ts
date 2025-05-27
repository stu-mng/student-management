import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { 
  FormCreateRequest, 
  FormsListResponse, 
  FormDetailResponse, 
  ErrorResponse 
} from '@/app/api/types';

export async function POST(request: NextRequest) {
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

    // 只有管理員和計畫主持可以創建表單
    if (!['admin', 'root', 'manager'].includes(userData.role)) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    const body: FormCreateRequest = await request.json();
    const {
      title,
      description,
      form_type,
      target_role,
      status = 'draft',
      is_required = false,
      allow_multiple_submissions = false,
      submission_deadline,
      fields = []
    } = body;

    // 驗證必要欄位
    if (!title || !form_type || !target_role) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Missing required fields: title, form_type, target_role' },
        { status: 400 }
      );
    }

    // 創建表單
    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert({
        title,
        description,
        form_type,
        target_role,
        status,
        is_required,
        allow_multiple_submissions,
        submission_deadline,
        created_by: user.id,
      })
      .select()
      .single();

    if (formError) {
      console.error('Error creating form:', formError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to create form' },
        { status: 500 }
      );
    }

    // 如果有欄位定義，創建表單欄位
    if (fields.length > 0) {
      const formFields = fields.map((field, index) => ({
        form_id: form.id,
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
        // 如果欄位創建失敗，刪除已創建的表單
        await supabase.from('forms').delete().eq('id', form.id);
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

    // 創建基於角色的存取權限
    const accessPermissions = [
      { form_id: form.id, role: 'admin', access_type: 'edit' },
      { form_id: form.id, role: 'manager', access_type: 'edit' },
    ];

    // 如果目標角色是 student，給予讀取權限
    if (target_role === 'student') {
      accessPermissions.push({ form_id: form.id, role: 'student', access_type: 'read' });
    }

    const { error: accessError } = await supabase
      .from('user_form_access')
      .insert(accessPermissions);

    if (accessError) {
      console.error('Error creating form access permissions:', accessError);
    }

    return NextResponse.json<FormDetailResponse>({
      success: true,
      data: form,
    });

  } catch (error) {
    console.error('Error in POST /api/forms:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const form_type = searchParams.get('form_type');
    const target_role = searchParams.get('target_role');

    let query = supabase
      .from('forms')
      .select('*', { count: 'exact' });

    // 根據用戶角色過濾表單
    if (!['admin', 'root', 'manager'].includes(userData.role)) {
      // 一般用戶只能看到針對其角色的表單
      query = query.eq('target_role', userData.role);
    }

    // 應用篩選條件
    if (status) {
      query = query.eq('status', status);
    }
    if (form_type) {
      query = query.eq('form_type', form_type);
    }
    if (target_role) {
      query = query.eq('target_role', target_role);
    }

    // 應用分頁
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 按創建時間排序
    query = query.order('created_at', { ascending: false });

    const { data: forms, error, count } = await query;

    if (error) {
      console.error('Error fetching forms:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch forms' },
        { status: 500 }
      );
    }

    // 為每個表單檢查 canSubmit 狀態
    const formsWithSubmitStatus = await Promise.all(
      (forms || []).map(async (form) => {
        let canSubmit = false;
        let accessType: 'read' | 'edit' | null = null;

        // 檢查用戶的存取權限
        // 1. 如果是表單創建者，給予編輯權限
        if (form.created_by === user.id) {
          accessType = 'edit';
        }
        // 2. 如果是 admin 或 root，給予編輯權限
        else if (['admin', 'root'].includes(userData.role)) {
          accessType = 'edit';
        }
        // 3. 檢查 user_form_access 表
        else {
          const { data: userAccess, error: accessError } = await supabase
            .from('user_form_access')
            .select('access_type')
            .eq('form_id', form.id)
            .eq('role', userData.role)
            .single();

          if (!accessError && userAccess) {
            accessType = userAccess.access_type as 'read' | 'edit';
          }
          // 4. 如果目標角色匹配，給予讀取權限
          else if (form.target_role === userData.role) {
            accessType = 'read';
          }
        }

        // 只有啟用的表單才能提交
        if (form.status === 'active' && accessType) {
          // 檢查用戶是否已經提交過回應
          const { data: existingResponse, error: responseError } = await supabase
            .from('form_responses')
            .select('id')
            .eq('form_id', form.id)
            .eq('respondent_id', user.id)
            .single();

          if (responseError && responseError.code !== 'PGRST116') {
            console.error('Error checking form response:', responseError);
          }

          // 如果沒有提交過，或者表單允許多次提交，則可以提交
          if (!existingResponse || form.allow_multiple_submissions) {
            canSubmit = true;
          }
        }

        return {
          ...form,
          canSubmit,
          access_type: accessType
        };
      })
    );

    return NextResponse.json<FormsListResponse>({
      success: true,
      data: formsWithSubmitStatus,
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error in GET /api/forms:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 