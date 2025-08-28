import { createClient } from '@/database/supabase/server';
import { sendBatchEmails } from '@/lib/email/send-batch';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import { getComputedDomain } from '@/lib/utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface NotifyTaskRequest {
  user_ids?: string[]; // 選擇性參數，如果不提供則通知所有已分配的用戶
  custom_title?: string; // 自定義標題
  custom_body?: string;  // 自定義內容
  include_unsubmitted_only?: boolean; // 只通知未提交的用戶
}

interface AssignedUser {
  user_id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  }[];
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    const supabase = await createClient();
    
    const userInfo = getUserFromHeaders(request);
    if (!userInfo) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { userId, userRoleName } = userInfo;

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .select(`
        id,
        title,
        description,
        submission_deadline,
        created_by,
        status
      `)
      .eq('id', id)
      .eq('form_type', 'task')
      .single();

    if (taskError) {
      console.error('Error fetching task:', taskError);
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    // Check if user has permission to send notifications for this task
    const canNotify = task.created_by === userId || 
                     ['admin', 'root'].includes(userRoleName);

    if (!canNotify) {
      console.error('Permission denied for user:', userId, 'role:', userRoleName);
      return NextResponse.json({ error: '禁止訪問' }, { status: 403 });
    }

    // Parse request body
    const body: NotifyTaskRequest = await request.json();
    const { 
      user_ids, 
      custom_title, 
      custom_body, 
      include_unsubmitted_only = false 
    } = body;

    // Get assigned users (using separate queries like assignments API)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_form_access')
      .select(`
        user_id,
        granted_at,
        access_type,
        is_active
      `)
      .eq('form_id', id)
      .eq('is_active', true)
      .not('user_id', 'is', null);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json({ error: '獲取分配資料失敗' }, { status: 500 });
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ error: '找不到已分配的用戶' }, { status: 404 });
    }

    // Filter by specific user_ids if provided
    let targetUserIds = assignments.map(a => a.user_id);
    if (user_ids && user_ids.length > 0) {
      targetUserIds = targetUserIds.filter(id => user_ids.includes(id));
    }

    // Get user details for all assignments
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email
      `)
      .in('id', targetUserIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: '獲取用戶資料失敗' }, { status: 500 });
    }

    // Create a map of user details
    const userMap = new Map((users || []).map(user => [user.id, user]));

    // Transform to match expected interface
    const assignedUsers = targetUserIds.map(userId => {
      const user = userMap.get(userId);
      return {
        user_id: userId,
        user: user ? [user] : [] // Wrap in array to match interface
      };
    }).filter(item => item.user.length > 0); // Only include users with data

    if (!assignedUsers || assignedUsers.length === 0) {
      return NextResponse.json({ error: '找不到已分配的用戶' }, { status: 404 });
    }

    // Debug logging
    console.log('Notification request:', {
      taskId: id,
      includeUnsubmittedOnly: include_unsubmitted_only,
      totalAssignedUsers: assignedUsers.length,
      assignedUsers: assignedUsers.map(u => ({ user_id: u.user_id, email: u.user[0]?.email }))
    });

    // If include_unsubmitted_only is true, filter out users who have already submitted
    let targetUsers = assignedUsers;
    if (include_unsubmitted_only) {
      console.log('Filtering for unsubmitted users only...');
      
      // Get form responses to check submission status
      const { data: responses, error: responsesError } = await supabase
        .from('form_responses')
        .select('respondent_id')
        .eq('form_id', id)
        .in('submission_status', ['submitted', 'reviewed', 'approved']);

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
        return NextResponse.json({ error: '檢查提交狀態失敗' }, { status: 500 });
      }

      const submittedUserIds = (responses || []).map(r => r.respondent_id).filter(Boolean);
      console.log('Found submitted users:', submittedUserIds);
      
      targetUsers = assignedUsers.filter(u => !submittedUserIds.includes(u.user_id));
      console.log('Filtered target users:', {
        before: assignedUsers.length,
        after: targetUsers.length,
        filteredOut: assignedUsers.length - targetUsers.length
      });

      if (targetUsers.length === 0) {
        return NextResponse.json({ 
          success: true,
          message: '所有用戶都已提交，無需發送通知',
          sent_count: 0,
          total_assigned: assignedUsers.length
        });
      }
    } else {
      console.log('Notifying all assigned users (no filtering)');
    }

    // Prepare email content
    const domain = getComputedDomain();
    const taskLink = `${domain}/dashboard/tasks/${id}`;
    const deadlineText = task.submission_deadline 
      ? `截止時間：${new Date(task.submission_deadline).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`
      : '無截止時間限制';

    const defaultTitle = custom_title || `[任務通知] ${task.title}`;
    const defaultBody = custom_body || `您有一個新的任務需要完成：

任務標題：${task.title}
${task.description ? `任務描述：${task.description}` : ''}
${deadlineText}

請點擊以下連結查看任務詳情：
${taskLink}

如果已經完成請忽略此信件。`;

    // Debug: Log target users before preparing recipients
    console.log('Target users before preparing recipients:', targetUsers.map(u => ({
      user_id: u.user_id,
      user_data: u.user,
      has_email: !!u.user[0]?.email
    })));

    // Prepare recipients for batch email
    const recipients = targetUsers.map((u: AssignedUser) => ({
      email: u.user[0]?.email || '',
      username: u.user[0]?.name || u.user[0]?.email || ''
    })).filter(r => r.email); // 過濾掉沒有郵箱的用戶

    // Debug: Log recipients after filtering
    console.log('Recipients after filtering:', {
      total_target_users: targetUsers.length,
      recipients_with_email: recipients.length,
      recipients: recipients.map(r => ({ email: r.email, username: r.username }))
    });

    // Send batch emails
    const emailResult = await sendBatchEmails({
      title: defaultTitle,
      body: defaultBody,
      recipients
    });

    if (!emailResult.success) {
      return NextResponse.json({ 
        error: '發送通知失敗',
        details: emailResult
      }, { status: 500 });
    }

    // Log notification activity (optional - could store in database)
    console.log(`Task notification sent for task ${id} by user ${userId}`, {
      sent_count: emailResult.summary.succeeded,
      failed_count: emailResult.summary.failed,
      recipients: recipients.map(r => r.email)
    });

    return NextResponse.json({
      success: true,
      message: `成功發送通知給 ${emailResult.summary.succeeded} 位用戶`,
      sent_count: emailResult.summary.succeeded,
      failed_count: emailResult.summary.failed,
      total_assigned: assignedUsers.length,
      email_result: emailResult
    });

  } catch (error) {
    console.error('Error in task notification:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}
