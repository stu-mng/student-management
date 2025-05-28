import { ErrorResponse, User } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users/me
 * 
 * 獲取當前登入用戶的資料
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 獲取當前用戶的認證資料
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 從資料庫獲取用戶的完整資料，並 join roles 表
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        region,
        created_at,
        updated_at,
        avatar_url,
        last_active,
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
      if (userError.code === 'PGRST116') {
        // 用戶在資料庫中不存在
        return NextResponse.json<ErrorResponse>({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 格式化回傳資料
    const formattedUser: User = {
      ...userData,
      role: Array.isArray(userData.role) ? userData.role[0] : userData.role
    };

    return NextResponse.json<User>(formattedUser);
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to get current user' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/me
 * 
 * 創建當前用戶的資料（首次登入時使用）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 獲取當前用戶的認證資料
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 檢查用戶是否已存在
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('id', user.id);

    if (countError) {
      return NextResponse.json<ErrorResponse>({ error: countError.message }, { status: 500 });
    }

    if (count && count > 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // 從請求體獲取角色，其他信息直接從 auth 用戶獲取
    const { role = 'teacher' } = await request.json();

    // 從用戶元數據獲取名稱和頭像
    const name = user.user_metadata?.name || user.user_metadata?.full_name;
    const avatar_url = user.user_metadata?.picture || user.user_metadata?.avatar_url;

    // 獲取角色 ID
    const { data: roleInfo, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (roleError || !roleInfo) {
      return NextResponse.json<ErrorResponse>(
        { error: '錯誤：無效的角色' },
        { status: 400 }
      );
    }

    // 創建新用戶
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: user.email,
        name,
        avatar_url,
        role_id: roleInfo.id
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

    return NextResponse.json<User>(formattedUser, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/me
 * 
 * 更新當前用戶的資料
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 獲取當前用戶的認證資料
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 從用戶元數據獲取名稱和頭像
    const id = user.id;
    const name = user.user_metadata?.name || user.user_metadata?.full_name;
    const avatar_url = user.user_metadata?.picture || user.user_metadata?.avatar_url;
    const now = new Date().toISOString();

    // 更新用戶資料
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        id,
        name,
        avatar_url,
        updated_at: now,
        last_active: now
      })
      .eq('id', user.id)
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
      ...updatedUser,
      role: Array.isArray(updatedUser.role) ? updatedUser.role[0] : updatedUser.role
    };

    return NextResponse.json<User>(formattedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 