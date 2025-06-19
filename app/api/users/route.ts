  import type { ErrorResponse, SuccessResponse, User, UserCreateRequest, UsersListResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { hasEqualOrHigherPermission } from '@/lib/utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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

    // 獲取用戶角色（包含 role）
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

    // 解析查詢參數
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const search = url.searchParams.get('search') || '';
    const roleFilter = url.searchParams.get('role');
    
    // 計算分頁的起始位置
    const offset = (page - 1) * limit;
    
    // 查詢用戶列表，包含 role 資料
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        region,
        created_at,
        updated_at,
        avatar_url,
        name,
        last_active,
        role:roles(
          id,
          name,
          display_name,
          color,
          order
        )
      `, { count: 'exact' });
    
    // 應用查詢過濾條件
    if (search) {
      query = query.or(`name.ilike.%${search}%, email.ilike.%${search}%`);
    }
    
    if (roleFilter) {
      // 通過 roles 表的 name 來過濾
      query = query.eq('role.name', roleFilter);
    }
    
    // 進行分頁
    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 500 });
    }
    
    // 格式化回傳資料
    const formattedUsers: User[] = (data || []).map(userData => ({
      ...userData,
      role: Array.isArray(userData.role) ? userData.role[0] : userData.role
    }));
    
    return NextResponse.json<UsersListResponse>({
      total: count || 0,
      page,
      limit,
      data: formattedUsers
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
      .select(`
        role:roles(name)
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 獲取請求體
    const requestBody: UserCreateRequest = await request.json();
    const { email, name, role, region } = requestBody;

    // 獲取目標角色資訊
    const { data: targetRoleInfo, error: targetRoleError } = await supabase
      .from('roles')
      .select('id, name, order')
      .eq('name', role)
      .single();

    if (targetRoleError || !targetRoleInfo) {
      return NextResponse.json<ErrorResponse>(
        { error: '錯誤：無效的角色' },
        { status: 400 }
      );
    }

    // 只能新增比自己角色權限低或相等的用戶
    const currentUserRole = Array.isArray(userData.role) ? userData.role[0] : userData.role;
    
    if (!hasEqualOrHigherPermission(currentUserRole, targetRoleInfo)) {
      return NextResponse.json<ErrorResponse>({ error: '錯誤：你沒有權限新增此角色的用戶' }, { status: 403 });
    }

    // 檢查必填欄位
    if (!email || !role) {
      return NextResponse.json<ErrorResponse>(
        { error: '錯誤：電子郵件和角色是必填欄位' },
        { status: 400 }
      );
    }

    // 獲取所有有效角色
    const { data: validRoles, error: rolesError } = await supabase
      .from('roles')
      .select('name');

    if (rolesError) {
      return NextResponse.json<ErrorResponse>({ error: rolesError.message }, { status: 500 });
    }

    const validRoleNames = validRoles?.map(r => r.name) || [];

    // 檢查角色是否有效
    if (!validRoleNames.includes(role)) {
      return NextResponse.json<ErrorResponse>(
        { error: `錯誤：角色必須是有效的角色名稱` },
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
        role_id: targetRoleInfo.id,
        region
      })
      .select(`
        *,
        role:roles(
          id,
          name,
          display_name,
          color,
          order
        )
      `)
      .single();

    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 400 });
    }

    // 格式化回傳資料
    const formattedUser: User = {
      ...newUser,
      role: Array.isArray(newUser.role) ? newUser.role[0] : newUser.role
    };

    return NextResponse.json<{ data: User } & SuccessResponse>({
      data: formattedUser,
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