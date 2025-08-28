import type { FormField } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { createRequirementFolder, getTaskFolders } from '@/lib/google-drive';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: 'draft' | 'active' | 'inactive' | 'archived';
  submission_deadline?: string;
  requirements?: Array<{
    id?: string;
    name: string;
    type: 'file' | 'text' | 'textarea';
    required: boolean;
    description?: string;
    help_image_url?: string;
    upload_folder_id?: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    
    // Get user info from middleware headers
    const userInfo = getUserFromHeaders(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = userInfo;

    // Get task details with creator info
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .select(`
        id,
        title,
        description,
        status,
        submission_deadline,
        created_at,
        created_by,
        help_image_folder_id,
        upload_folders_folder_id,
        creator:users!forms_created_by_fkey(
          name,
          email
        ),
        form_sections(
          id,
          title,
          description,
          order,
          form_fields(
            id,
            field_name,
            field_label,
            field_type,
            is_required,
            help_text,
            help_image_url,
            display_order,
            upload_folder_id
          )
        )
      `)
      .eq('id', id)
      .eq('form_type', 'task')
      .single();

    if (taskError) {
      console.error('Error fetching task:', taskError);
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    // Get user's response for this task
    const { data: userResponse, error: responseError } = await supabase
      .from('form_responses')
      .select(`
        id,
        submission_status,
        submitted_at,
        form_field_responses(
          field_id,
          field_value,
          field_values
        )
      `)
      .eq('form_id', id)
      .eq('respondent_id', userId)
      .single();

    // Transform user's responses into a simple object
    let myResponse = undefined;
    if (userResponse && !responseError) {
      const responseData: Record<string, string | null> = {};
      userResponse.form_field_responses?.forEach((fieldResp: {
        field_id: string;
        field_value: string | null;
        field_values: unknown;
      }) => {
        responseData[fieldResp.field_id] = fieldResp.field_value;
      });

      myResponse = {
        id: userResponse.id,
        submission_status: userResponse.submission_status,
        submitted_at: userResponse.submitted_at,
        responses: responseData
      };
    }

    // Transform form fields into requirements format
    const requirements = task.form_sections
      ?.flatMap(section => section.form_fields || [])
      .sort((a, b) => a.display_order - b.display_order)
      .map(field => ({
        id: field.id,
        name: field.field_label,
        type: field.field_type === 'file_upload' ? 'file' : field.field_type, // 正确映射字段类型
        required: field.is_required,
        description: field.help_text,
        help_image_url: field.help_image_url,
        upload_folder_id: field.upload_folder_id
      })) || [];

    const response = {
      task: {
        ...task,
        requirements,
        my_response: myResponse,
        form_sections: undefined // Remove from response
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in task detail API:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    
    // Get user info from middleware headers
    const userInfo = getUserFromHeaders(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, userRoleName } = userInfo;

    // Check if user has permission to update this task
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .select('created_by')
      .eq('id', id)
      .eq('form_type', 'task')
      .single();

    if (taskError) {
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    // Allow update if user is creator or admin
    const canUpdate = task.created_by === userId || 
                     ['admin', 'root'].includes(userRoleName);

    if (!canUpdate) {
      return NextResponse.json({ error: '禁止訪問' }, { status: 403 });
    }

    const body: TaskUpdateRequest = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.submission_deadline !== undefined) {
      updateData.submission_deadline = body.submission_deadline;
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Start a transaction to update task and requirements
    const { data: updatedTask, error: updateError } = await supabase
      .from('forms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json({ error: '更新任務失敗' }, { status: 500 });
    }

    // If requirements are provided, update them while preserving user responses
    if (body.requirements && body.requirements.length > 0) {
      try {
        // Get existing form sections and fields
        const { data: existingSections, error: sectionsError } = await supabase
          .from('form_sections')
          .select(`
            id,
            form_fields (
              id,
              form_id,
              form_section_id,
              field_name,
              field_label,
              field_type,
              is_required,
              is_active,
              help_text,
              help_image_url,
              display_order,
              upload_folder_id
            )
          `)
          .eq('form_id', id);

        if (sectionsError) {
          console.error('Error getting existing sections:', sectionsError);
          return NextResponse.json({ error: '獲取現有區段失敗' }, { status: 500 });
        }

        // Get or create the main section for requirements
        let mainSectionId: string;
        if (existingSections && existingSections.length > 0) {
          mainSectionId = existingSections[0].id;
        } else {
          // Create a new section if none exists
          const { data: newSection, error: createSectionError } = await supabase
            .from('form_sections')
            .insert({
              form_id: id,
              title: '任務要求',
              description: '任務的具體要求項目',
              order: 1
            })
            .select()
            .single();

          if (createSectionError) {
            console.error('Error creating section:', createSectionError);
            return NextResponse.json({ error: '創建區段失敗' }, { status: 500 });
          }
          mainSectionId = newSection.id;
        }

        // Get existing fields to preserve user responses
        const existingFields = existingSections?.[0]?.form_fields || [];
        
        // 创建多种字段匹配策略
        const existingFieldByIdMap = new Map<string, FormField>(); // 通过 ID 匹配（最可靠）
        const existingFieldByLabelMap = new Map<string, FormField>(); // 通过标签匹配
        const existingFieldByOrderMap = new Map<number, FormField>(); // 通过顺序匹配
        
        existingFields.forEach((field, fieldIndex) => {
          existingFieldByIdMap.set(field.id, field);
          existingFieldByLabelMap.set(field.field_label, field);
          existingFieldByOrderMap.set(fieldIndex, field);
        });

        // Process each requirement
        for (let index = 0; index < body.requirements.length; index++) {
          const requirement = body.requirements[index];
          
          // 智能字段匹配策略
          let existingField = null;
          
          if (requirement.id) {
            existingField = existingFieldByIdMap.get(requirement.id);
          }

          if (existingField) {
            // 智能更新：只更新真正改变的部分
            const updateData: Record<string, string | boolean | number | null | undefined> = {};
            
            if (existingField.field_label !== requirement.name) {
              updateData.field_label = requirement.name;
            }
            
            if (existingField.is_required !== requirement.required) {
              updateData.is_required = requirement.required;
            }
            
            if (existingField.help_text !== requirement.description) {
              updateData.help_text = requirement.description;
            }
            
            if (existingField.help_image_url !== requirement.help_image_url) {
              updateData.help_image_url = requirement.help_image_url;
            }
            
            if (existingField.display_order !== (index + 1)) {
              updateData.display_order = index + 1;
            }
            
            if (!existingField.is_active) {
              updateData.is_active = true;
            }
            
            // 只有当字段类型真正需要改变时才更新
            const newFieldType = requirement.type === 'file' ? 'file_upload' : requirement.type;
            if (existingField.field_type !== newFieldType) {
              updateData.field_type = newFieldType;
            }
            
            // 只有当有实际更新时才执行数据库操作
            if (Object.keys(updateData).length > 0) {
              const { error: fieldUpdateError } = await supabase
                .from('form_fields')
                .update(updateData)
                .eq('id', existingField.id);

              if (fieldUpdateError) {
                console.error('Error updating field:', fieldUpdateError);
              }
            }
          } else {
            // Create new field
            let uploadFolderId: string | null = null;
            
            // If this is a file upload field, create Google Drive folder
            if (requirement.type === 'file') {
              try {
                // Get existing task folders
                const existingFolders = await getTaskFolders(supabase, id);
                
                // Create requirement folder
                const folderInfo = await createRequirementFolder(
                  supabase,
                  id,
                  requirement.name,
                  existingFolders
                );
                
                uploadFolderId = folderInfo.uploadFolderId;
              } catch (e) {
                console.error('創建 Google Drive 資料夾失敗:', e);
                // Continue without folder creation
              }
            }

            const { error: fieldCreateError } = await supabase
              .from('form_fields')
              .insert({
                form_id: id,
                form_section_id: mainSectionId,
                field_name: `requirement_${Date.now()}_${index}`,
                field_label: requirement.name,
                field_type: requirement.type === 'file' ? 'file_upload' : requirement.type,
                is_required: requirement.required,
                help_text: requirement.description,
                help_image_url: requirement.help_image_url,
                display_order: index + 1,
                is_active: true,
                upload_folder_id: uploadFolderId
              });

            if (fieldCreateError) {
              console.error('Error creating field:', fieldCreateError);
            }
          }
        }

        // Deactivate fields that are no longer in requirements (but don't delete to preserve responses)
        // 使用位置索引来匹配字段，而不是名称（因为名称可能已经改变）
        const activeFieldIndices = new Set(body.requirements.map((_, index) => index));
        for (let fieldIndex = 0; fieldIndex < existingFields.length; fieldIndex++) {
          const field = existingFields[fieldIndex];
          if (!activeFieldIndices.has(fieldIndex)) {
            const { error: deactivateError } = await supabase
              .from('form_fields')
              .update({ is_active: false })
              .eq('id', field.id);

            if (deactivateError) {
              console.error('Error deactivating field:', deactivateError);
            }
          }
        }
      } catch (error) {
        console.error('Error updating requirements:', error);
        return NextResponse.json({ error: '更新任務要求失敗' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      task: updatedTask 
    });

  } catch (error) {
    console.error('Error in task update API:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { id: taskId } = await params;

    // Get task details to check if it exists
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .select(`
        id,
        title,
        status
      `)
      .eq('id', taskId)
      .eq('form_type', 'task')
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    // Get count of responses for logging purposes
    const { count: responseCount } = await supabase
      .from('form_responses')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', taskId);

    console.log(`刪除任務 ${taskId}，包含 ${responseCount || 0} 個回復`);

    // Delete the main task (form) - other related data will be automatically deleted via CASCADE
    const { error: deleteError } = await supabase
      .from('forms')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      console.error('刪除任務錯誤:', deleteError);
      return NextResponse.json({ error: '刪除任務失敗' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `任務刪除成功，已刪除 ${responseCount || 0} 個回復`
    });

  } catch (error) {
    console.error('刪除任務錯誤:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}
