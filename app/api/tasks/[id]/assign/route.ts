import { createClient } from '@/database/supabase/server';
import { sendBatchEmails } from '@/lib/email/send-batch';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import { getComputedDomain } from '@/lib/utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface AssignTaskRequest {
  user_ids: string[];
  send_notification?: boolean; // 是否發送通知郵件
}

interface RemoveAssignmentRequest {
  user_ids: string[];
}

export async function POST(
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
    // Check if user has permission to assign this task
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .select('created_by, status')
      .eq('id', id)
      .eq('form_type', 'task')
      .single();

    if (taskError) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Allow assignment if user is creator or admin
    const canAssign = task.created_by === userId || 
                     ['admin', 'root'].includes(userRoleName);

    if (!canAssign) {
      return NextResponse.json({ error: '禁止訪問' }, { status: 403 });
    }

    const body: AssignTaskRequest = await request.json();
    const { user_ids, send_notification = true } = body;

    // Validate request
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: '缺少或無效的用戶ID陣列' },
        { status: 400 }
      );
    }

    // Validate that all user IDs exist
    const { data: validUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('id', user_ids);

    if (usersError) {
      return NextResponse.json({ error: '驗證用戶失敗' }, { status: 500 });
    }

    const validUserIds = (validUsers || []).map(u => u.id);
    const invalidUserIds = user_ids.filter(id => !validUserIds.includes(id));

    if (invalidUserIds.length > 0) {
      return NextResponse.json(
        { error: `無效的用戶ID：${invalidUserIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for existing assignments
    const { data: existingAssignments } = await supabase
      .from('user_form_access')
      .select('user_id')
      .eq('form_id', id)
      .in('user_id', user_ids);

    const existingUserIds = (existingAssignments || []).map(a => a.user_id);
    const newUserIds = user_ids.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return NextResponse.json(
        { error: '所有選中的用戶都已經分配給此任務' },
        { status: 400 }
      );
    }

    // Create new assignments
    const assignmentRecords = newUserIds.map(userId => ({
      form_id: id,
      user_id: userId,
      access_type: 'edit',
      is_active: true,
      granted_by: userInfo.userId,
      granted_at: new Date().toISOString(),
    }));

    const { error: assignError } = await supabase
      .from('user_form_access')
      .insert(assignmentRecords);

    if (assignError) {
      console.error('Error creating assignments:', assignError);
      return NextResponse.json({ error: '分配任務失敗' }, { status: 500 });
    }

    // Send notification emails if requested
    let notificationResult = null;
    if (send_notification && newUserIds.length > 0) {
      try {
        // Get task details for email content
        const { data: taskDetails } = await supabase
          .from('forms')
          .select('title, description, submission_deadline')
          .eq('id', id)
          .single();

        // Get newly assigned users' email information
        const { data: newAssignedUsers } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', newUserIds);

        if (taskDetails && newAssignedUsers && newAssignedUsers.length > 0) {
          const domain = getComputedDomain();
          const taskLink = `${domain}/dashboard/tasks/${id}`;
          const deadlineText = taskDetails.submission_deadline 
            ? `截止時間：${new Date(taskDetails.submission_deadline).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}`
            : '無截止時間限制';

          const emailTitle = `[任務分配] ${taskDetails.title}`;
          const emailBody = `您已被分配一個新任務：

任務標題：${taskDetails.title}
${taskDetails.description ? `任務描述：${taskDetails.description}` : ''}
${deadlineText}

請點擊以下連結查看任務詳情：
${taskLink}

請及時完成任務，謝謝！`;

          const recipients = newAssignedUsers.map(user => ({
            email: user.email,
            username: user.name || user.email
          }));

          notificationResult = await sendBatchEmails({
            title: emailTitle,
            body: emailBody,
            recipients
          });

          console.log(`Task assignment notification sent for task ${id}`, {
            sent_count: notificationResult.summary.succeeded,
            failed_count: notificationResult.summary.failed
          });
        }
      } catch (emailError) {
        console.error('Error sending assignment notification:', emailError);
        // Don't fail the assignment if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `成功將任務分配給 ${newUserIds.length} 位用戶${send_notification && notificationResult?.summary.succeeded ? `，並發送通知給 ${notificationResult.summary.succeeded} 位用戶` : ''}`,
      assigned_count: newUserIds.length,
      already_assigned_count: existingUserIds.length,
      notification_sent: send_notification ? notificationResult?.summary.succeeded || 0 : 0,
      notification_failed: send_notification ? notificationResult?.summary.failed || 0 : 0
    });

  } catch (error) {
    console.error('Error in task assignment:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}

export async function DELETE(
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

    const body: RemoveAssignmentRequest = await request.json();
    const { user_ids } = body;

    // Validate request
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: '缺少或無效的用戶ID陣列' },
        { status: 400 }
      );
    }

    // Validate that all user IDs exist
    const { data: validUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('id', user_ids);

    if (usersError) {
      return NextResponse.json({ error: '驗證用戶失敗' }, { status: 500 });
    }

    const validUserIds = (validUsers || []).map(u => u.id);
    const invalidUserIds = user_ids.filter(id => !validUserIds.includes(id));

    if (invalidUserIds.length > 0) {
      return NextResponse.json(
        { error: `無效的用戶ID：${invalidUserIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for existing assignments
    const { data: existingAssignments, error: assignmentError } = await supabase
      .from('user_form_access')
      .select('id, user_id')
      .eq('form_id', id)
      .in('user_id', user_ids);

    if (assignmentError) {
      console.error('Error checking existing assignments:', assignmentError);
      return NextResponse.json({ error: '檢查分配記錄失敗' }, { status: 500 });
    }

    const existingAssignmentIds = (existingAssignments || []).map(a => a.id);

    if (existingAssignmentIds.length === 0) {
      return NextResponse.json(
        { error: '找不到任何分配記錄' },
        { status: 404 }
      );
    }

    // Remove the assignments
    const { error: deleteError } = await supabase
      .from('user_form_access')
      .delete()
      .in('id', existingAssignmentIds);

    if (deleteError) {
      console.error('Error removing assignment:', deleteError);
      return NextResponse.json({ error: '移除分配記錄失敗' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `成功移除 ${existingAssignmentIds.length} 位用戶的任務分配`,
      removed_count: existingAssignmentIds.length,
      total_requested: user_ids.length
    });

  } catch (error) {
    console.error('Error in assignment removal:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}
