import { createClient } from '@/database/supabase/server';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { userId, userRoleName } = userInfo;
    // Verify task exists and user has permission
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .select('created_by')
      .eq('id', id)
      .eq('form_type', 'task')
      .single();

    if (taskError) {
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    // Check permission: creator, admin, or assigned user
    const isCreator = task.created_by === userId;
    const isAdmin = ['admin', 'root'].includes(userRoleName);
    
    if (!isCreator && !isAdmin) {
      // Check if user is assigned to this task
      const { data: access } = await supabase
        .from('user_form_access')
        .select('id')
        .eq('form_id', id)
        .eq('user_id', userId)
        .single();

      if (!access) {
        return NextResponse.json({ error: '禁止訪問' }, { status: 403 });
      }
    }

    // Get task responses with user and field details
    const { data: responses, error: responsesError } = await supabase
      .from('form_responses')
      .select(`
        id,
        submission_status,
        submitted_at,
        respondent_id,
        form_field_responses(
          field_id,
          field_value,
          field_values
        )
      `)
      .eq('form_id', id)
      .order('submitted_at', { ascending: false });

    if (responsesError) {
      console.error('Error fetching task responses:', responsesError);
      return NextResponse.json({ error: '獲取任務回應失敗' }, { status: 500 });
    }

    // Get user details for all responses
    const userIds = (responses || []).map(r => r.respondent_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        roles(display_name)
      `)
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: '獲取用戶詳情失敗' }, { status: 500 });
    }

    // Get field details for all field responses
    const fieldIds = (responses || []).flatMap(r => 
      (r.form_field_responses || []).map(fr => fr.field_id)
    );
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select(`
        id,
        field_label,
        field_type
      `)
      .in('id', fieldIds);

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError);
      return NextResponse.json({ error: '獲取欄位詳情失敗' }, { status: 500 });
    }

    // Create maps for quick lookup
    const userMap = new Map((users || []).map(user => [user.id, user]));
    const fieldMap = new Map((fields || []).map(field => [field.id, field]));

    // Transform response data
    const transformedResponses = (responses || []).map(response => {
      const user = userMap.get(response.respondent_id);
      return {
        id: response.id,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.roles
        } : null,
        submission_status: response.submission_status,
        submitted_at: response.submitted_at,
        responses: (response.form_field_responses || []).map(fieldResponse => {
          const field = fieldMap.get(fieldResponse.field_id);
          return {
            requirement_id: fieldResponse.field_id,
            requirement_name: field?.field_label || '未知欄位',
            value: fieldResponse.field_value,
            field_values: fieldResponse.field_values,
            // 对于文件类型字段，获取实际的文件信息
            file_url: field?.field_type === 'file_upload' && fieldResponse.field_value
              ? `/api/drive/content/${fieldResponse.field_value}`
              : undefined,
            file_id: field?.field_type === 'file_upload' ? fieldResponse.field_value : undefined
          };
        })
      };
    }).filter(response => response.user !== null);

    return NextResponse.json({
      responses: transformedResponses
    });

  } catch (error) {
    console.error('Error in task responses API:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}
