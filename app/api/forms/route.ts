import type {
  ErrorResponse,
  FormCreateRequest,
  FormDetailResponse,
  FormsListResponse,
  Role,
  RolePermission
} from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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

    // 只有管理員和計畫主持可以創建表單
    const currentUserRole = (userData.role as unknown as Role)?.name;
    if (!['admin', 'root', 'class-teacher', 'manager'].includes(currentUserRole)) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    const body: FormCreateRequest = await request.json();
    const {
      title,
      description,
      form_type,
      status = 'draft',
      is_required = false,
      allow_multiple_submissions = false,
      submission_deadline,
      sections = []
    } = body;

    // 驗證必要欄位
    if (!title || !form_type) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Missing required fields: title, form_type' },
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

    // 創建表單分段和欄位
    if (sections.length > 0) {
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const section = sections[sectionIndex];
        
        // 創建分段
        const { data: createdSection, error: sectionError } = await supabase
          .from('form_sections')
          .insert({
            form_id: form.id,
            title: section.title || `區段 ${sectionIndex + 1}`,
            description: section.description,
            order: section.order || sectionIndex + 1,
          })
          .select()
          .single();

        if (sectionError) {
          console.error('Error creating form section:', sectionError);
          // 如果分段創建失敗，刪除已創建的表單
          await supabase.from('forms').delete().eq('id', form.id);
          return NextResponse.json<ErrorResponse>(
            { error: 'Failed to create form sections' },
            { status: 500 }
          );
        }

        // 如果該分段有欄位，創建欄位
        if (section.fields && section.fields.length > 0) {
          // 驗證欄位資料
          for (const field of section.fields) {
            if (!field.field_name || !field.field_label || !field.field_type) {
              console.error('Invalid field data:', field);
              await supabase.from('forms').delete().eq('id', form.id);
              return NextResponse.json<ErrorResponse>(
                { error: 'Missing required field properties: field_name, field_label, field_type' },
                { status: 400 }
              );
            }
          }

          const formFields = section.fields.map((field, fieldIndex) => ({
            form_id: form.id,
            form_section_id: createdSection.id,
            field_name: field.field_name,
            field_label: field.field_label,
            field_type: field.field_type,
            display_order: field.display_order || fieldIndex,
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
          for (const field of section.fields) {
            const fieldData = createdFields?.find(f => f.field_name === field.field_name);
            if (!fieldData) continue;

            // 處理一般選項（select, radio, checkbox）
            if (field.options && field.options.length > 0) {
              const options = field.options.map((option, index) => ({
                field_id: fieldData.id,
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
                field.grid_options.rows.forEach((row, index) => {
                  gridOptions.push({
                    field_id: fieldData.id,
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
                field.grid_options.columns.forEach((column, index) => {
                  gridOptions.push({
                    field_id: fieldData.id,
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
        }
      }
    } else {
      // 如果沒有提供 sections，創建一個預設分段
      const { error: defaultSectionError } = await supabase
        .from('form_sections')
        .insert({
          form_id: form.id,
          title: '預設區段',
          description: '此區段包含所有表單欄位',
          order: 1,
        });

      if (defaultSectionError) {
        console.error('Error creating default section:', defaultSectionError);
        await supabase.from('forms').delete().eq('id', form.id);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to create default section' },
          { status: 500 }
        );
      }
    }

    // 創建基於角色的存取權限 - 預設給予 admin 和 manager 編輯權限
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, order')
      .in('name', ['root', 'admin', 'manager']);

    if (rolesError) {
      console.error('Error fetching roles for permissions:', rolesError);
    } else if (rolesData) {
      const accessPermissions = [];
      
      accessPermissions.push({ form_id: form.id, role_id: 0, access_type: 'edit' });
      accessPermissions.push({ form_id: form.id, role_id: 1, access_type: 'edit' });
      accessPermissions.push({ form_id: form.id, role_id: 2, access_type: 'edit' });
      accessPermissions.push({ form_id: form.id, role_id: 3, access_type: 'edit' });
      accessPermissions.push({ form_id: form.id, role_id: 4, access_type: 'read' });
      accessPermissions.push({ form_id: form.id, role_id: 5, access_type: 'read' });
      accessPermissions.push({ form_id: form.id, role_id: 6, access_type: 'read' });

      if (accessPermissions.length > 0) {
        const { error: accessError } = await supabase
          .from('user_form_access')
          .insert(accessPermissions);

        if (accessError) {
          console.error('Error creating form access permissions:', accessError);
        }
      }
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const form_type = searchParams.get('form_type');

    let query = supabase
      .from('forms')
      .select(`
        *,
        owner:users!forms_created_by_fkey(
          id,
          name,
          email,
          avatar_url
        )
      `, { count: 'exact' });

    // 根據用戶角色過濾表單
    const currentUserRole = (userData.role as unknown as Role)?.name;
    const currentUserRoleId = (userData.role as unknown as Role)?.id;
    
    if (!['admin', 'root', 'manager'].includes(currentUserRole)) {
      // 一般用戶需要檢查權限設定
      const { data: userAccessForms } = await supabase
        .from('user_form_access')
        .select('form_id')
        .eq('role_id', currentUserRoleId)
        .not('access_type', 'is', null);

      const accessibleFormIds = userAccessForms?.map(access => access.form_id) || [];

      if (accessibleFormIds.length > 0) {
        query = query.in('id', accessibleFormIds);
      } else {
        // 如果沒有任何權限，返回空結果
        query = query.eq('id', 'non-existent-id');
      }
    }

    // 應用篩選條件
    if (status) {
      query = query.eq('status', status);
    }
    if (form_type) {
      query = query.eq('form_type', form_type);
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

    // 為每個表單檢查 submitted 狀態
    const formsWithSubmitStatus = await Promise.all(
      (forms || []).map(async (form) => {
        let submitted = false;
        let accessType: 'read' | 'edit' | null = null;

        // 檢查用戶的存取權限
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

        // 檢查用戶是否已經提交過回應
        if (accessType) {
          const { data: existingResponse, error: responseError } = await supabase
            .from('form_responses')
            .select('id, submission_status')
            .eq('form_id', form.id)
            .eq('respondent_id', user.id)
            .eq('submission_status', 'submitted')
            .single();

          if (responseError && responseError.code !== 'PGRST116') {
            console.error('Error checking form response:', responseError);
          }

          // 如果已經提交過，則 submitted = true
          if (existingResponse) {
            submitted = true;
          }
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
            .eq('form_id', form.id)
            .not('role_id', 'is', null);

          if (!permissionsError && permissionsData) {
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

        return {
          ...form,
          submitted,
          access_type: accessType,
          permissions: permissions
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