import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { ErrorResponse } from '@/app/api/types';

interface FormResponsesResponse {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  limit: number;
}

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
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    const { id } = await params;

    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (formError) {
      if (formError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch form' },
        { status: 500 }
      );
    }

    // 檢查權限：只有表單創建者、管理員或 root 可以查看回應
    const hasPermission = form.created_by === user.id || ['admin', 'root'].includes(userData.role);
    
    if (!hasPermission) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 獲取表單回應
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: responses, error: responsesError, count } = await supabase
      .from('form_responses')
      .select(`
        *,
        respondent:users!form_responses_respondent_id_fkey(id, name, email),
        field_responses:form_field_responses(
          *,
          field:form_fields(id, field_label, field_type)
        )
      `, { count: 'exact' })
      .eq('form_id', id)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.error('Error fetching form responses:', responsesError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    return NextResponse.json<FormResponsesResponse>({
      success: true,
      data: responses || [],
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error in GET /api/forms/[id]/responses:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 