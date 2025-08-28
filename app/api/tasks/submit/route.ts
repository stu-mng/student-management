import { createClient } from '@/database/supabase/server';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface TaskSubmissionRequest {
  task_id: string;
  responses: Record<string, string>;
  submission_status: 'draft' | 'submitted';
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

    const body: TaskSubmissionRequest = await request.json();
    const { task_id, responses, submission_status } = body;

    // Validate required fields
    if (!task_id) {
      return NextResponse.json(
        { error: '缺少必要欄位：task_id' },
        { status: 400 }
      );
    }

    // Verify user has access to this task
    const { data: access, error: accessError } = await supabase
      .from('user_form_access')
      .select('id')
      .eq('form_id', task_id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (accessError || !access) {
      return NextResponse.json({ error: '找不到任務或訪問被拒絕' }, { status: 403 });
    }

    // Get task details to validate requirements
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .select(`
        id,
        title,
        status,
        form_sections(
          form_fields(
            id,
            field_label,
            field_type,
            is_required
          )
        )
      `)
      .eq('id', task_id)
      .eq('form_type', 'task')
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    // Check if task is still active
    if (task.status !== 'active') {
      return NextResponse.json({ error: '任務未啟用' }, { status: 400 });
    }

    // Validate required fields if submitting (not draft)
    if (submission_status === 'submitted') {
      const requiredFields = task.form_sections
        ?.flatMap((section: { form_fields: any[] }) => section.form_fields || [])
        .filter((field: any) => field.is_required)
        .map((field: any) => field.id) || [];

      const missingFields = requiredFields.filter(fieldId => !responses[fieldId]?.trim());
      
      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: '提交前請完成所有必填欄位' },
          { status: 400 }
        );
      }
    }

    // Check if user already has a response for this task
    const { data: existingResponse, error: existingError } = await supabase
      .from('form_responses')
      .select('id')
      .eq('form_id', task_id)
      .eq('respondent_id', userId)
      .single();

    let responseId: string;

    if (existingResponse) {
      // Update existing response
      const updateData: Record<string, string | null> = {
        submission_status,
        updated_at: new Date().toISOString()
      };

      if (submission_status === 'submitted') {
        updateData.submitted_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('form_responses')
        .update(updateData)
        .eq('id', existingResponse.id);

      if (updateError) {
        console.error('更新表單回應錯誤:', updateError);
        return NextResponse.json({ error: '更新回應失敗' }, { status: 500 });
      }

      responseId = existingResponse.id;
    } else {
      // Create new response
      const { data: newResponse, error: createError } = await supabase
        .from('form_responses')
        .insert({
          form_id: task_id,
          respondent_id: userId,
          respondent_type: 'user',
          submission_status,
          submitted_at: submission_status === 'submitted' ? new Date().toISOString() : null,
        })
        .select('id')
        .single();

      if (createError || !newResponse) {
        console.error('建立表單回應錯誤:', createError);
        return NextResponse.json({ error: '建立回應失敗' }, { status: 500 });
      }

      responseId = newResponse.id;
    }

    // Delete existing field responses for this response
    await supabase
      .from('form_field_responses')
      .delete()
      .eq('response_id', responseId);

    // Insert new field responses
    const fieldResponses = Object.entries(responses)
      .filter(([_, value]) => value?.trim())
      .map(([fieldId, value]) => ({
        response_id: responseId,
        field_id: fieldId,
        field_value: value,
      }));

    if (fieldResponses.length > 0) {
      const { error: fieldError } = await supabase
        .from('form_field_responses')
        .insert(fieldResponses);

      if (fieldError) {
        console.error('插入欄位回應錯誤:', fieldError);
        return NextResponse.json({ error: '儲存回應失敗' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: submission_status === 'submitted' ? '任務提交成功' : '草稿儲存成功',
      response_id: responseId
    });

  } catch (error) {
    console.error('任務提交錯誤:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
}
