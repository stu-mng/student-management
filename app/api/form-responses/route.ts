import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { 
  FormResponseCreateRequest, 
  FormResponsesListResponse, 
  FormResponseDetailResponse, 
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

    const body: FormResponseCreateRequest = await request.json();
    const {
      form_id,
      respondent_id,
      respondent_type = 'user',
      submission_status = 'draft',
      field_responses = [],
      metadata
    } = body;

    // 驗證必要欄位
    if (!form_id) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Missing required field: form_id' },
        { status: 400 }
      );
    }

    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, status, allow_multiple_submissions')
      .eq('id', form_id)
      .single();

    if (formError) {
      if (formError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      console.error('Error checking form:', formError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to check form' },
        { status: 500 }
      );
    }

    // 檢查表單狀態
    if (form.status !== 'active') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Form is not active' },
        { status: 400 }
      );
    }

    // 如果不允許多次提交，檢查是否已有回應
    if (!form.allow_multiple_submissions && respondent_id) {
      const { data: existingResponse, error: checkError } = await supabase
        .from('form_responses')
        .select('id')
        .eq('form_id', form_id)
        .eq('respondent_id', respondent_id)
        .eq('respondent_type', respondent_type)
        .single();

      if (existingResponse) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Multiple submissions not allowed for this form' },
          { status: 400 }
        );
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing response:', checkError);
      }
    }

    // 創建表單回應
    const responseData: any = {
      form_id,
      respondent_type,
      submission_status,
      metadata
    };

    if (respondent_id) {
      responseData.respondent_id = respondent_id;
    }

    if (submission_status === 'submitted') {
      responseData.submitted_at = new Date().toISOString();
    }

    const { data: formResponse, error: responseError } = await supabase
      .from('form_responses')
      .insert(responseData)
      .select()
      .single();

    if (responseError) {
      console.error('Error creating form response:', responseError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to create form response' },
        { status: 500 }
      );
    }

    // 創建欄位回應
    if (field_responses.length > 0) {
      const fieldResponsesData = field_responses.map((fieldResponse) => ({
        response_id: formResponse.id,
        field_id: fieldResponse.field_id,
        field_value: fieldResponse.field_value,
        field_values: fieldResponse.field_values,
      }));

      const { error: fieldResponsesError } = await supabase
        .from('form_field_responses')
        .insert(fieldResponsesData);

      if (fieldResponsesError) {
        console.error('Error creating field responses:', fieldResponsesError);
        // 如果欄位回應創建失敗，刪除已創建的表單回應
        await supabase.from('form_responses').delete().eq('id', formResponse.id);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to create field responses' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json<FormResponseDetailResponse>({
      success: true,
      data: formResponse,
    });

  } catch (error) {
    console.error('Error in POST /api/form-responses:', error);
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
    const form_id = searchParams.get('form_id');
    const respondent_id = searchParams.get('respondent_id');
    const respondent_type = searchParams.get('respondent_type');
    const submission_status = searchParams.get('submission_status');

    let query = supabase
      .from('form_responses')
      .select(`
        *,
        forms (
          id,
          title,
          form_type
        )
      `, { count: 'exact' });

    // 根據用戶角色過濾回應
    if (!['admin', 'root', 'project_manager'].includes(userData.role)) {
      // 一般用戶只能看到自己的回應
      query = query.eq('respondent_id', user.id);
    }

    // 應用篩選條件
    if (form_id) {
      query = query.eq('form_id', form_id);
    }
    if (respondent_id) {
      query = query.eq('respondent_id', respondent_id);
    }
    if (respondent_type) {
      query = query.eq('respondent_type', respondent_type);
    }
    if (submission_status) {
      query = query.eq('submission_status', submission_status);
    }

    // 應用分頁
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 按創建時間排序
    query = query.order('created_at', { ascending: false });

    const { data: responses, error, count } = await query;

    if (error) {
      console.error('Error fetching form responses:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch form responses' },
        { status: 500 }
      );
    }

    return NextResponse.json<FormResponsesListResponse>({
      success: true,
      data: responses || [],
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error in GET /api/form-responses:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 