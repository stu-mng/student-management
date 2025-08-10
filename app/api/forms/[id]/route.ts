import type {
  ErrorResponse,
  ExtendedFormFieldOption,
  FormDetailResponse,
  FormField,
  FormFieldCreateRequest,
  FormFieldOption,
  FormSectionCreateRequest,
  FormUpdateRequest,
  Role,
  RolePermission,
  SuccessResponse
} from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { getRoleOrder } from '@/lib/utils';
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
    const previewRoleName = request.headers.get('x-preview-role') || new URL(request.url).searchParams.get('preview_role');
    let effectiveRole: { id: number | null; name: string; order: number } | null = null;
    const currentRole = userData.role as unknown as Role | null;

    if (previewRoleName) {
      const { data: previewRoleRow, error: previewErr } = await supabase
        .from('roles')
        .select('id, name, order')
        .eq('name', previewRoleName)
        .single();
      if (previewErr || !previewRoleRow) {
        return NextResponse.json<ErrorResponse>({ error: 'Invalid preview role' }, { status: 400 });
      }
      if (!currentRole) {
        return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
      }
      const currentOrder = currentRole.order ?? getRoleOrder({ name: currentRole.name } as { name: string; order?: number });
      const previewOrder = previewRoleRow.order ?? getRoleOrder({ name: previewRoleRow.name } as { name: string; order?: number });
      if (!(currentOrder < previewOrder)) {
        return NextResponse.json<ErrorResponse>({ error: 'Preview role not allowed' }, { status: 403 });
      }
      effectiveRole = { id: previewRoleRow.id, name: previewRoleRow.name, order: previewOrder };
    }

    const effectiveRoleName = (effectiveRole?.name ?? ((userData.role as unknown as Role)?.name || '')) as string;
    const effectiveRoleId = (effectiveRole?.id ?? ((userData.role as unknown as Role)?.id ?? null)) as number | null;

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

    // 1. 若預覽模式，忽略創建者捷徑，避免權限提升
    if (!previewRoleName) {
      if (form.created_by === user.id) {
        accessType = 'edit';
      }
    }
    // 2. 如果有效角色為 admin 或 root 或 class-teacher，給予編輯權限
    if (!accessType && ['admin', 'root', 'class-teacher'].includes(effectiveRoleName)) {
      accessType = 'edit';
    }
    // 3. 檢查 user_form_access 表（依有效角色）
    else if (!accessType && effectiveRoleId) {
      const { data: userAccess, error: accessError } = await supabase
        .from('user_form_access')
        .select('access_type')
        .eq('form_id', form.id)
        .eq('role_id', effectiveRoleId)
        .single();

      if (!accessError && userAccess) {
        accessType = userAccess.access_type as 'read' | 'edit';
      }
    }

    // 如果沒有任何權限，拒絕存取
    if (!accessType) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 獲取表單分段和欄位 - 直接從 sections join fields
    const { data: sections, error: sectionsError } = await supabase
      .from('form_sections')
      .select(`
        *,
        fields:form_fields!form_fields_form_section_id_fkey(
          *,
          form_field_options (
            id,
            option_value,
            option_label,
            option_type,
            row_label,
            column_label,
            display_order,
            is_active,
            jump_to_section_id
          )
        )
      `)
      .eq('form_id', id)
      .eq('fields.is_active', true)
      .order('order')
      .order('display_order', { referencedTable: 'fields' });

    if (sectionsError) {
      console.error('Error fetching form sections:', sectionsError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch form sections' },
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

    // 處理 sections 資料，整理欄位選項
    let sectionsWithFields = sections?.map(section => {
      const formattedFields = section.fields?.map((field: FormField & { form_field_options?: ExtendedFormFieldOption[] }) => {
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

      return {
        ...section,
        fields: formattedFields
      };
    }) || [];

    // 檢查是否有欄位沒有分配到任何 section（orphaned fields）
    const { data: orphanedFields, error: orphanError } = await supabase
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
          is_active,
          jump_to_section_id
        )
      `)
      .eq('form_id', id)
      .eq('is_active', true)
      .is('form_section_id', null);

    if (orphanError) {
      console.error('Error fetching orphaned fields:', orphanError);
    }

    // Handle edge cases for form data integrity
    const hasOrphanedFields = orphanedFields && orphanedFields.length > 0;
    const allFields = sectionsWithFields.flatMap(s => s.fields || []);
    const totalFieldsCount = allFields.length + (orphanedFields?.length || 0);

    // Case 1: Form has fields but no sections - create a default section
    if (totalFieldsCount > 0 && (!sections || sections.length === 0)) {
      const { data: newSection, error: sectionError } = await supabase
        .from('form_sections')
        .insert({
          form_id: id,
          title: '表單內容',
          description: null,
          order: 0
        })
        .select()
        .single();
        
      if (!sectionError && newSection) {
        // Update all orphaned fields to belong to this new section
        if (hasOrphanedFields) {
          const { error: updateFieldsError } = await supabase
            .from('form_fields')
            .update({ form_section_id: newSection.id })
            .in('id', orphanedFields.map(f => f.id));
            
          if (!updateFieldsError) {
            // Format orphaned fields
            const formattedOrphanedFields = orphanedFields.map(field => {
              const sortedOptions = field.form_field_options?.sort((a: FormFieldOption, b: FormFieldOption) => a.display_order - b.display_order) || [];
              
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
                grid_options: gridOptions,
                form_section_id: newSection.id
              };
            });

            sectionsWithFields = [{
              ...newSection,
              fields: formattedOrphanedFields
            }];
          }
        } else {
          sectionsWithFields = [{
            ...newSection,
            fields: []
          }];
        }
      }
    }
    
    // Case 2: Fix orphaned fields by assigning them to the first section
    else if (hasOrphanedFields && sections && sections.length > 0) {
      const firstSectionId = sections[0].id;
      
      const { error: updateError } = await supabase
        .from('form_fields')
        .update({ form_section_id: firstSectionId })
        .in('id', orphanedFields.map(f => f.id));
        
      if (!updateError) {
        // Format orphaned fields and add to first section
        const formattedOrphanedFields = orphanedFields.map(field => {
          const sortedOptions = field.form_field_options?.sort((a: FormFieldOption, b: FormFieldOption) => a.display_order - b.display_order) || [];
          
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
            grid_options: gridOptions,
            form_section_id: firstSectionId
          };
        });

        // Update the first section to include the fixed fields
        sectionsWithFields = sectionsWithFields.map((section, index) => {
          if (index === 0) {
            return {
              ...section,
              fields: [...(section.fields || []), ...formattedOrphanedFields]
            };
          }
          return section;
        });
      }
    }

    // 檢查當前用戶是否已經提交回應
    let submitted = false;
    const { data: existingResponse, error: responseError } = await supabase
      .from('form_responses')
      .select('id, submission_status')
      .eq('form_id', id)
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

    return NextResponse.json<FormDetailResponse>({
      success: true,
      data: {
        ...form,
        sections: sectionsWithFields,
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
      sections = []
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

    // 如果提供了 sections 資料，更新區段和欄位
    if (sections.length > 0) {
      // 獲取現有區段和欄位
      const { data: existingSections, error: getSectionsError } = await supabase
        .from('form_sections')
        .select(`
          *,
          fields:form_fields!form_fields_form_section_id_fkey(
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
          )
        `)
        .eq('form_id', id);

      if (getSectionsError) {
        console.error('Error getting existing sections:', getSectionsError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to get existing sections' },
          { status: 500 }
        );
      }

      // 智能更新策略：保留現有數據，僅更新變更的部分
      const existingSectionMap = new Map(existingSections?.map(s => [s.id, s]) || []);
      const existingFieldMap = new Map();
      const existingFieldByIdMap = new Map();
      const existingFieldByNameMap = new Map();
      
      existingSections?.forEach(section => {
        section.fields?.forEach((field: FormField) => {
          // 建立多種查找方式
          existingFieldByIdMap.set(field.id, field);
          existingFieldByNameMap.set(`${field.form_id}-${field.field_name}`, field);
          existingFieldMap.set(`${section.id}-${field.field_name}`, field);
        });
      });

      // 準備全域欄位追蹤以支援刪除偵測
      const allExistingFieldIds = new Set<string>();
      existingSections?.forEach(s => s.fields?.forEach((f: FormField) => allExistingFieldIds.add(f.id)));
      const activeFieldIds = new Set<string>();

      // 處理區段更新
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const section = sections[sectionIndex] as FormSectionCreateRequest & { id?: string };
        let sectionId: string;
        
        // 如果是現有區段（有 id 或 tempId 對應），更新它
        const existingSection = section.id
          ? existingSectionMap.get(section.id)
          : existingSections?.find(es => es.order === (section.order || sectionIndex + 1));
        
        if (existingSection) {
          // 更新現有區段
          const { data: updatedSection, error: sectionError } = await supabase
            .from('form_sections')
            .update({
              title: section.title || `區段 ${sectionIndex + 1}`,
              description: section.description,
              order: section.order || sectionIndex + 1,
            })
            .eq('id', existingSection.id)
            .select()
            .single();

          if (sectionError) {
            console.error('Error updating form section:', sectionError);
            return NextResponse.json<ErrorResponse>(
              { error: 'Failed to update form sections' },
              { status: 500 }
            );
          }
          sectionId = updatedSection.id;
        } else {
          // 創建新區段
          const { data: createdSection, error: sectionError } = await supabase
            .from('form_sections')
            .insert({
              form_id: id,
              title: section.title || `區段 ${sectionIndex + 1}`,
              description: section.description,
              order: section.order || sectionIndex + 1,
            })
            .select()
            .single();

          if (sectionError) {
            console.error('Error creating form section:', sectionError);
            return NextResponse.json<ErrorResponse>(
              { error: 'Failed to create form sections' },
              { status: 500 }
            );
          }
          sectionId = createdSection.id;
        }

        // 處理欄位更新
        if (section.fields && section.fields.length > 0) {
          for (const field of section.fields as (FormFieldCreateRequest & { id?: string })[]) {
            if (!field.field_name || !field.field_label || !field.field_type) {
              console.error('Invalid field data:', field);
              return NextResponse.json<ErrorResponse>(
                { error: 'Missing required field properties: field_name, field_label, field_type' },
                { status: 400 }
              );
            }

            // 改善欄位識別邏輯 - 優先使用ID，然後使用表單+欄位名稱組合
            let existingField = null;
            
            // 方法1: 使用欄位ID查找（最可靠）
            if (field.id) {
              existingField = existingFieldByIdMap.get(field.id);
            }
            
            // 方法2: 在當前區段中查找同名欄位（優先於全表單名稱匹配，避免跨段誤判）
            if (!existingField) {
              existingField = existingFieldMap.get(`${sectionId}-${field.field_name}`);
            }
            // 方法3: 使用表單ID + 欄位名稱查找（僅當唯一時）
            if (!existingField) {
              const candidate = existingFieldByNameMap.get(`${id}-${field.field_name}`)
              // 僅當該名稱在整個表單內唯一且屬於同一區段時才採用
              if (candidate && candidate.form_section_id === sectionId) {
                existingField = candidate
              }
            }

            if (existingField) {
              console.log(`Updating existing field: ${field.field_name} (ID: ${existingField.id})`);
              
              // 更新現有欄位
              const { error: fieldError } = await supabase
                .from('form_fields')
                .update({
                  form_section_id: sectionId,
                  field_name: field.field_name,
                  field_label: field.field_label,
                  field_type: field.field_type,
                  display_order: field.display_order || 0,
                  is_required: field.is_required || false,
                  is_active: field.is_active !== false,
                  placeholder: field.placeholder,
                  help_text: field.help_text,
                  help_image_url: field.help_image_url,
                  validation_rules: field.validation_rules,
                  min_length: field.min_length,
                  max_length: field.max_length,
                  student_field_mapping: field.student_field_mapping,
                  auto_populate_from: field.auto_populate_from,
                })
                .eq('id', existingField.id);

              if (fieldError) {
                console.error('Error updating form field:', fieldError);
                return NextResponse.json<ErrorResponse>(
                  { error: 'Failed to update form fields' },
                  { status: 500 }
                );
              }

              // 標記此欄位為仍然有效
              activeFieldIds.add(existingField.id);

              // 更新欄位選項
              await updateFieldOptions(supabase, existingField.id, field);
            } else {
              console.log(`Creating new field: ${field.field_name}`);
              
              // 創建新欄位
              const { data: createdField, error: fieldError } = await supabase
                .from('form_fields')
                .insert({
                  form_id: id,
                  form_section_id: sectionId,
                  field_name: field.field_name,
                  field_label: field.field_label,
                  field_type: field.field_type,
                  display_order: field.display_order || 0,
                  is_required: field.is_required || false,
                  is_active: field.is_active !== false,
                  placeholder: field.placeholder,
                  help_text: field.help_text,
                  help_image_url: field.help_image_url,
                  validation_rules: field.validation_rules,
                  min_length: field.min_length,
                  max_length: field.max_length,
                  student_field_mapping: field.student_field_mapping,
                  auto_populate_from: field.auto_populate_from,
                })
                .select()
                .single();

              if (fieldError) {
                console.error('Error creating form field:', fieldError);
                return NextResponse.json<ErrorResponse>(
                  { error: 'Failed to create form fields' },
                  { status: 500 }
                );
              }

              // 標記新建欄位為有效
              activeFieldIds.add(createdField.id);

              // 為新欄位創建選項
              await updateFieldOptions(supabase, createdField.id, field);
            }
          }
        }
      }

      // 標記已刪除的區段和欄位為非活躍狀態（而不是真正刪除）
      const updatedSectionIds = sections.map((section, index) => {
        const s = section as FormSectionCreateRequest & { id?: string }
        const existingSection = s.id
          ? existingSectionMap.get(s.id)
          : existingSections?.find(es => es.order === (s.order || index + 1));
        return existingSection?.id;
      }).filter(Boolean);

      if (existingSections && updatedSectionIds.length > 0) {
        // 將未包含在更新中的區段標記為已刪除
        const sectionsToDeactivate = existingSections.filter(s => !updatedSectionIds.includes(s.id));
        
        for (const section of sectionsToDeactivate) {
          // 將該區段的所有欄位標記為非活躍
          await supabase
            .from('form_fields')
            .update({ is_active: false })
            .eq('form_section_id', section.id);
        }
      }

      // 將被刪除的欄位（存在於資料庫但不在本次 payload 中）標記為非活躍
      const idsToDeactivate = Array.from(allExistingFieldIds).filter(id => !activeFieldIds.has(id));
      if (idsToDeactivate.length > 0) {
        await supabase
          .from('form_fields')
          .update({ is_active: false })
          .in('id', idsToDeactivate);
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

// 輔助函數：智能更新欄位選項
async function updateFieldOptions(supabase: SupabaseClient, fieldId: string, field: FormFieldCreateRequest) {
  // 獲取現有選項
  const { data: existingOptions, error: getOptionsError } = await supabase
    .from('form_field_options')
    .select('*')
    .eq('field_id', fieldId);

  if (getOptionsError) {
    console.error('Error getting existing options:', getOptionsError);
    return;
  }

  // 如果欄位沒有提供新的選項，不做任何更新
  if (!field.options && !field.grid_options) {
    return;
  }

  const existingOptionsMap = new Map(existingOptions?.map(opt => [opt.option_value, opt]) || []);
  
  // 處理一般選項（select, radio, checkbox）
  if (field.options && field.options.length > 0) {
    const newOptionValues = new Set(field.options.map(opt => opt.option_value));
    
    // 更新或創建選項
    for (let index = 0; index < field.options.length; index++) {
      const option = field.options[index];
      const existingOption = existingOptionsMap.get(option.option_value);
      
      if (existingOption) {
        // 更新現有選項
        const { error: updateError } = await supabase
          .from('form_field_options')
          .update({
            option_label: option.option_label,
            display_order: option.display_order || index,
            is_active: option.is_active !== false,
            option_type: 'standard',
            jump_to_section_id: option.jump_to_section_id || null
          })
          .eq('id', existingOption.id);

        if (updateError) {
          console.error('Error updating field option:', updateError);
        }
      } else {
        // 創建新選項
        const { error: insertError } = await supabase
          .from('form_field_options')
          .insert({
            field_id: fieldId,
            option_value: option.option_value,
            option_label: option.option_label,
            display_order: option.display_order || index,
            is_active: option.is_active !== false,
            option_type: 'standard',
            jump_to_section_id: option.jump_to_section_id || null
          });

        if (insertError) {
          console.error('Error creating new field option:', insertError);
        }
      }
    }

    // 標記已刪除的選項為非活躍（不直接刪除以保留回應數據）
    const optionsToDeactivate = existingOptions?.filter(opt => 
      opt.option_type !== 'grid_row' && 
      opt.option_type !== 'grid_column' && 
      !newOptionValues.has(opt.option_value)
    ) || [];

    for (const option of optionsToDeactivate) {
      const { error: deactivateError } = await supabase
        .from('form_field_options')
        .update({ is_active: false })
        .eq('id', option.id);

      if (deactivateError) {
        console.error('Error deactivating field option:', deactivateError);
      }
    }
  }

  // 處理 grid 選項（radio_grid, checkbox_grid）
  if (field.grid_options && ['radio_grid', 'checkbox_grid'].includes(field.field_type)) {
    const newGridValues = new Set();
    
    // 收集所有新的 grid 選項值
    if (field.grid_options.rows) {
      field.grid_options.rows.forEach(row => newGridValues.add(row.value));
    }
    if (field.grid_options.columns) {
      field.grid_options.columns.forEach(col => newGridValues.add(col.value));
    }

    // 處理行選項
    if (field.grid_options.rows) {
      for (let index = 0; index < field.grid_options.rows.length; index++) {
        const row = field.grid_options.rows[index];
        const existingOption = existingOptions?.find(opt => 
          opt.option_type === 'grid_row' && opt.option_value === row.value
        );

        if (existingOption) {
          // 更新現有行選項
          const { error: updateError } = await supabase
            .from('form_field_options')
            .update({
              option_label: row.label,
              row_label: row.label,
              display_order: index,
              is_active: true
            })
            .eq('id', existingOption.id);

          if (updateError) {
            console.error('Error updating grid row option:', updateError);
          }
        } else {
          // 創建新行選項
          const { error: insertError } = await supabase
            .from('form_field_options')
            .insert({
              field_id: fieldId,
              option_value: row.value,
              option_label: row.label,
              option_type: 'grid_row',
              row_label: row.label,
              display_order: index,
              is_active: true
            });

          if (insertError) {
            console.error('Error creating new grid row option:', insertError);
          }
        }
      }
    }

    // 處理列選項
    if (field.grid_options.columns) {
      for (let index = 0; index < field.grid_options.columns.length; index++) {
        const column = field.grid_options.columns[index];
        const existingOption = existingOptions?.find(opt => 
          opt.option_type === 'grid_column' && opt.option_value === column.value
        );

        if (existingOption) {
          // 更新現有列選項
          const { error: updateError } = await supabase
            .from('form_field_options')
            .update({
              option_label: column.label,
              column_label: column.label,
              display_order: index,
              is_active: true
            })
            .eq('id', existingOption.id);

          if (updateError) {
            console.error('Error updating grid column option:', updateError);
          }
        } else {
          // 創建新列選項
          const { error: insertError } = await supabase
            .from('form_field_options')
            .insert({
              field_id: fieldId,
              option_value: column.value,
              option_label: column.label,
              option_type: 'grid_column',
              column_label: column.label,
              display_order: index,
              is_active: true
            });

          if (insertError) {
            console.error('Error creating new grid column option:', insertError);
          }
        }
      }
    }

    // 標記已刪除的 grid 選項為非活躍
    const gridOptionsToDeactivate = existingOptions?.filter(opt => 
      (opt.option_type === 'grid_row' || opt.option_type === 'grid_column') && 
      !newGridValues.has(opt.option_value)
    ) || [];

    for (const option of gridOptionsToDeactivate) {
      const { error: deactivateError } = await supabase
        .from('form_field_options')
        .update({ is_active: false })
        .eq('id', option.id);

      if (deactivateError) {
        console.error('Error deactivating grid option:', deactivateError);
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