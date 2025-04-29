import { ErrorResponse, SuccessResponse, User, UserCreateRequest, UsersListResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users
 * 
 * 返回系統中所有用戶的列表
 */
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

    // 解析查詢參數
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role');
    
    // 計算分頁的起始位置
    const offset = (page - 1) * limit;
    
    // 確保包含 last_active 欄位
    let query = supabase.from('users').select('id, email, role, created_at, updated_at, avatar_url, name, last_active', { count: 'exact' });
    
    // 應用查詢過濾條件
    if (search) {
      query = query.or(`name.ilike.%${search}%, email.ilike.%${search}%`);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    // 進行分頁
    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json<UsersListResponse>({
      total: count || 0,
      page,
      limit,
      data: data || []
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * 
 * 新增一位用戶到系統（僅限管理員）
 */
export async function POST(request: NextRequest) {
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

    // 獲取請求體
    const { email, name, role }: UserCreateRequest = await request.json();

    // 只有管理員可以新增用戶
    if (userData.role === 'teacher' || userData.role === 'admin' && role === 'root') {
      return NextResponse.json<ErrorResponse>({ error: '錯誤：你沒有權限新增用戶' }, { status: 403 });
    }

    // 檢查必填欄位
    if (!email || !role) {
      return NextResponse.json<ErrorResponse>(
        { error: '錯誤：電子郵件和角色是必填欄位' },
        { status: 400 }
      );
    }

    // 檢查角色是否有效
    if (!['teacher', 'admin', 'root'].includes(role)) {
      return NextResponse.json<ErrorResponse>(
        { error: '錯誤：角色必須是 "教師 (teacher)", "管理員 (admin)", 或 "最高管理員 (root)"' },
        { status: 400 }
      );
    }

    // 檢查郵箱是否已存在
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('email', email);

    if (countError) {
      return NextResponse.json<ErrorResponse>({ error: countError.message }, { status: 500 });
    }

    if (count && count > 0) {
      return NextResponse.json<ErrorResponse>(
        { error: '錯誤：電子郵件已存在' },
        { status: 409 }
      );
    }

    // 插入新的用戶資料
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        role
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<{ data: User } & SuccessResponse>({
      data: newUser,
      success: true
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: '錯誤：新增用戶失敗' },
      { status: 500 }
    );
  }
} 