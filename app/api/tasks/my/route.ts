import { createClient } from '@/database/supabase/server';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface MyTaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

interface MyTask {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  submission_deadline: string | null;
  created_at: string;
  creator: {
    name: string | null;
    email: string;
  };
  requirements: {
    id: string;
    name: string;
    type: 'file' | 'text' | 'textarea';
    required: boolean;
    description?: string;
  }[];
  my_response?: {
    id: string;
    submission_status: 'draft' | 'submitted' | 'reviewed' | 'approved';
    submitted_at: string | null;
    responses: Record<string, string | null>;
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user info from middleware headers
    const userInfo = getUserFromHeaders(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = userInfo;

    // Get tasks assigned to the current user - only active tasks
    const { data: assignedTasks, error: tasksError } = await supabase
      .from('user_form_access')
      .select(`
        form_id,
        forms!inner(
          id,
          title,
          description,
          status,
          submission_deadline,
          created_at,
          created_by,
          creator:users!forms_created_by_fkey(
            name,
            email
          ),
          form_sections(
            id,
            form_fields(
              id,
              field_label,
              field_type,
              is_required,
              help_text,
              display_order,
              upload_folder_id
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('forms.form_type', 'task')
      .eq('forms.status', 'active')
      .eq('is_active', true);

    if (tasksError) {
      console.error('Error fetching assigned tasks:', tasksError);
      return NextResponse.json({ error: '獲取已分配任務失敗' }, { status: 500 });
    }

    // Get user's responses for these tasks
    const taskIds = (assignedTasks || []).map(item => item.form_id);
    const userResponses: Record<string, unknown> = {};

    if (taskIds.length > 0) {
      const { data: responses, error: responsesError } = await supabase
        .from('form_responses')
        .select(`
          form_id,
          id,
          submission_status,
          submitted_at,
          form_field_responses(
            field_id,
            field_value,
            field_values
          )
        `)
        .in('form_id', taskIds)
        .eq('respondent_id', userId);

      if (!responsesError && responses) {
        responses.forEach(response => {
          const responseData: Record<string, string | null> = {};
          response.form_field_responses?.forEach((fieldResp: {
            field_id: string;
            field_value: string | null;
            field_values: unknown;
          }) => {
            responseData[fieldResp.field_id] = fieldResp.field_value;
          });

          userResponses[response.form_id] = {
            id: response.id,
            submission_status: response.submission_status,
            submitted_at: response.submitted_at,
            responses: responseData
          };
        });
      }
    }

    // Transform data to the expected format
    const myTasks: MyTask[] = (assignedTasks || []).flatMap(item => {
      const form = (item.forms as any); // forms is a single object, not an array
      if (!form) {
        console.error('Form is undefined for item:', item);
        return []; // Return empty array instead of null
      }
      const formSections = form.form_sections || [];
      const requirements = formSections
        .flatMap((section: { form_fields: unknown[] }) => section.form_fields || [])
        .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
        .map((field: { 
          id: string; 
          field_label: string; 
          field_type: string; 
          is_required: boolean; 
          help_text: string | null;
          upload_folder_id: string | null;
        }) => ({
          id: field.id,
          name: field.field_label,
          type: field.field_type as 'file' | 'text' | 'textarea',
          required: field.is_required,
          description: field.help_text || undefined,
          upload_folder_id: field.upload_folder_id
        })) || [];

      return [{
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
        submission_deadline: form.submission_deadline,
        created_at: form.created_at,
        creator: form.creator,
        requirements,
        my_response: userResponses[form.id] as MyTask['my_response']
      }];
    });

    // Calculate stats
    const now = new Date();
    const stats: MyTaskStats = {
      total: myTasks.length,
      completed: myTasks.filter(task => task.my_response?.submission_status === 'submitted').length,
      pending: myTasks.filter(task => !task.my_response || task.my_response.submission_status === 'draft').length,
      overdue: myTasks.filter(task => 
        task.status === 'active' && 
        task.submission_deadline && 
        new Date(task.submission_deadline) < now &&
        (!task.my_response || task.my_response.submission_status !== 'submitted')
      ).length,
    };

    return NextResponse.json({
      tasks: myTasks,
      stats
    });

  } catch (error) {
    console.error('Error in my tasks API:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}

