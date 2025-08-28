import { createClient } from '@/database/supabase/server';
import { createTaskFolders } from '@/lib/google-drive';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface TaskCreateRequest {
  title: string;
  description?: string;
  submission_deadline?: string;
  assignees?: string[]; // User IDs to assign the task to
  requirements?: {
    name: string;
    type: 'file' | 'text' | 'textarea';
    required: boolean;
    description?: string;
    help_image_url?: string;
  }[];
}

interface TaskStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

interface TaskListResponse {
  tasks: Task[];
  stats: TaskStats;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  submission_deadline: string | null;
  created_at: string;
  created_by: string;
  responses_count?: number;
  total_assigned?: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user info from middleware headers
    const userInfo = getUserFromHeaders(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, userRoleName } = userInfo;

    // Get tasks (forms with form_type = 'task')
    let tasks;
    
    if (['admin', 'root'].includes(userRoleName)) {
      // Admin users can see all tasks
      const { data, error } = await supabase
        .from('forms')
        .select(`
          id,
          title,
          description,
          status,
          submission_deadline,
          created_at,
          created_by,
          form_responses(count)
        `)
        .eq('form_type', 'task')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: '獲取任務失敗' }, { status: 500 });
      }
      tasks = data;
    } else {
      // Non-admin users: get tasks they created
      const { data: createdTasks, error: createdError } = await supabase
        .from('forms')
        .select(`
          id,
          title,
          description,
          status,
          submission_deadline,
          created_at,
          created_by,
          form_responses(count)
        `)
        .eq('form_type', 'task')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (createdError) {
        console.error('Error fetching created tasks:', createdError);
        return NextResponse.json({ error: '獲取任務失敗' }, { status: 500 });
      }

      // Get tasks they are assigned to
      const { data: assignedTaskIds, error: assignedError } = await supabase
        .from('user_form_access')
        .select('form_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (assignedError) {
        console.error('Error fetching assigned tasks:', assignedError);
        return NextResponse.json({ error: '獲取已分配任務失敗' }, { status: 500 });
      }

      const assignedFormIds = assignedTaskIds?.map(a => a.form_id) || [];
      
      let assignedTasks: any[] = [];
      if (assignedFormIds.length > 0) {
        const { data: assignedTasksData, error: assignedTasksError } = await supabase
          .from('forms')
          .select(`
            id,
            title,
            description,
            status,
            submission_deadline,
            created_at,
            created_by,
            form_responses(count)
          `)
          .eq('form_type', 'task')
          .in('id', assignedFormIds)
          .order('created_at', { ascending: false });

        if (assignedTasksError) {
          console.error('Error fetching assigned task details:', assignedTasksError);
          return NextResponse.json({ error: '獲取已分配任務詳情失敗' }, { status: 500 });
        }
        assignedTasks = assignedTasksData || [];
      }

      // Merge and deduplicate tasks
      const allTasks = [...(createdTasks || []), ...assignedTasks];
      const uniqueTasks = allTasks.filter((task, index, self) => 
        index === self.findIndex(t => t.id === task.id)
      );
      tasks = uniqueTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Get assignment counts for each task
    const tasksWithCounts = await Promise.all(
      (tasks || []).map(async (task) => {
        // Get total assigned count
        const { count: totalAssigned } = await supabase
          .from('user_form_access')
          .select('*', { count: 'exact', head: true })
          .eq('form_id', task.id);

        // Get completed responses count
        const { count: responsesCount } = await supabase
          .from('form_responses')
          .select('*', { count: 'exact', head: true })
          .eq('form_id', task.id)
          .eq('submission_status', 'submitted');

        return {
          ...task,
          total_assigned: totalAssigned || 0,
          responses_count: responsesCount || 0,
        };
      })
    );

    // Calculate stats
    const now = new Date();
    const stats: TaskStats = {
      total: tasksWithCounts.length,
      active: tasksWithCounts.filter(t => t.status === 'active').length,
      completed: tasksWithCounts.filter(t => t.status === 'archived').length,
      overdue: tasksWithCounts.filter(t => 
        t.status === 'active' && 
        t.submission_deadline && 
        new Date(t.submission_deadline) < now
      ).length,
    };

    const response: TaskListResponse = {
      tasks: tasksWithCounts,
      stats,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in tasks API:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user info from middleware headers
    const userInfo = getUserFromHeaders(request);
    if (!userInfo) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { userId } = userInfo;

    const body: TaskCreateRequest = await request.json();
    const {
      title,
      description,
      submission_deadline,
      assignees = [],
      requirements = []
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: '缺少必要欄位：標題' },
        { status: 400 }
      );
    }

    // Create task (form with form_type = 'task')
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .insert({
        title,
        description,
        form_type: 'task',
        status: 'draft',
        is_required: false,
        allow_multiple_submissions: false,
        submission_deadline,
        created_by: userId,
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return NextResponse.json({ error: '創建任務失敗' }, { status: 500 });
    }

    // Create Google Drive folders for task files
    let helpImageFolderId: string | null = null;
    let uploadFoldersFolderId: string | null = null;

    try {
      const folders = await createTaskFolders(supabase, task.id, task.title);
      helpImageFolderId = folders.helpImageFolderId;
      uploadFoldersFolderId = folders.uploadFoldersFolderId;
    } catch (e) {
      console.error('任務的 Google Drive 資料夾創建失敗', task.id, e);
    }

    // Create default section for task requirements
    const { data: section, error: sectionError } = await supabase
      .from('form_sections')
      .insert({
        form_id: task.id,
        title: '任務要求',
        description: '請完成以下項目',
        order: 0,
      })
      .select()
      .single();

    if (sectionError) {
      console.error('Error creating task section:', sectionError);
      return NextResponse.json({ error: '創建任務章節失敗' }, { status: 500 });
    }

    // Create task requirements as form fields
    if (requirements.length > 0) {
      const fieldsToInsert = requirements.map((req, index) => ({
        form_id: task.id,
        form_section_id: section.id,
        field_name: `requirement_${index + 1}`,
        field_label: req.name,
        field_type: req.type,
        is_required: req.required,
        help_text: req.description,
        help_image_url: req.help_image_url || null,
        display_order: index,
        upload_folder_id: req.type === 'file' ? uploadFoldersFolderId : null,
      }));

      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(fieldsToInsert);

      if (fieldsError) {
        console.error('Error creating task fields:', fieldsError);
        return NextResponse.json({ error: '創建任務要求失敗' }, { status: 500 });
      }
    }

    // Assign task to users
    if (assignees.length > 0) {
      const accessRecords = assignees.map(userId => ({
        form_id: task.id,
        user_id: userId,
        access_type: 'edit',
        is_active: true,
      }));

      const { error: accessError } = await supabase
        .from('user_form_access')
        .insert(accessRecords);

      if (accessError) {
        console.error('Error assigning task:', accessError);
        return NextResponse.json({ error: '分配任務失敗' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      task: {
        ...task,
        total_assigned: assignees.length,
        responses_count: 0,
      }
    });

  } catch (error) {
    console.error('Error in task creation:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}
