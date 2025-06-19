import type {
  ErrorResponse,
  FormResponsesListResponse
} from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
    const currentUserRole = (userData.role as any)?.name;
    if (!['admin', 'root', 'project_manager'].includes(currentUserRole)) {
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