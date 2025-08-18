import type { ErrorResponse, SuccessResponse, User, UserUpdateRequest } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { hasEqualOrHigherPermission, hasUserManagePermission } from '@/lib/utils';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/users/{id}
 * 
 * 根據ID獲取用戶資料
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取當前用戶的角色
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

    if (userError || !userData) {
      return NextResponse.json<ErrorResponse>({ error: 'Failed to get user role' }, { status: 500 });
    }

    // 驗證：只有管理員或者查詢自己的資料才允許
    const currentUserRole = Array.isArray(userData.role) ? userData.role[0] : userData.role;
    if (!hasUserManagePermission(currentUserRole) && id !== user.id) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 獲取用戶資料，包含 role 資料
    const { data, error } = await supabase
      .from('users')
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
      .eq('id', id)
      .single();

    if (!data) {
      return NextResponse.json<ErrorResponse>({ error: 'User not found' }, { status: 404 });
    }

    // 格式化回傳資料
    const formattedUser: User = {
      ...data,
      role: Array.isArray(data.role) ? data.role[0] : data.role
    };

    return NextResponse.json<User>(formattedUser);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/{id}
 * 
 * 根據ID更新用戶的資料（僅限管理員）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色
    const { data: userData } = await supabase
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

    if (!userData) {
      return NextResponse.json<ErrorResponse>({ error: 'Failed to get user role' }, { status: 500 });
    }

    // 檢查要更新的欄位
    const updateData: Record<string, any> = {};
    
    try {
      // 從 request body 獲取參數
      const requestData: UserUpdateRequest = await request.json();
      
      // 處理來自前端的請求
      if (requestData) {
        if (requestData.email !== undefined) {
          updateData.email = requestData.email;
        }
        
        if (requestData.name !== undefined) {
          updateData.name = requestData.name;
        }

        if (requestData.picture !== undefined) {
          updateData.avatar_url = requestData.picture;
        }

        if (requestData.region !== undefined) {
          updateData.region = requestData.region;
        }

        // 獲取目標用戶的當前角色
        const { data: targetUser, error: targetUserError } = await supabase
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
        .eq('id', id)
        .single();

        if (targetUserError || !targetUser) {
          return NextResponse.json<ErrorResponse>({ error: 'Failed to get target user role' }, { status: 500 });
        }

        const currentUserRole = Array.isArray(userData.role) ? userData.role[0] : userData.role;
        const targetUserRole = Array.isArray(targetUser.role) ? targetUser.role[0] : targetUser.role;

        if (!hasEqualOrHigherPermission(currentUserRole, targetUserRole)) {
          return NextResponse.json<ErrorResponse>({ error: '你不能更新比自己角色權限高的用戶' }, { status: 403 });
        }
        
        // 處理角色更新
        if (requestData.role !== undefined) {
          // 獲取角色資訊
          const { data: roleInfo, error: roleError } = await supabase
            .from('roles')
            .select('id, name, order')
            .eq('name', requestData.role)
            .single();

          if (roleError || !roleInfo) {
            return NextResponse.json<ErrorResponse>(
              { error: '錯誤：無效的角色' },
              { status: 400 }
            );
          }

          if (!hasEqualOrHigherPermission(currentUserRole, roleInfo)) {
            return NextResponse.json<ErrorResponse>({ 
              error: '你不能賦予用戶比自己更高的權限' 
            }, { status: 403 });
          }

          updateData.role_id = roleInfo.id;
        }
      }
    } catch (e) {
      return NextResponse.json<ErrorResponse>({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const result = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
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

    if (result.error) {
      return NextResponse.json<ErrorResponse>({ error: result.error.message }, { status: 400 });
    }

    // 格式化回傳資料
    const formattedUser: User = {
      ...result.data,
      role: Array.isArray(result.data.role) ? result.data.role[0] : result.data.role
    };

    return NextResponse.json<User & SuccessResponse>({
      ...formattedUser,
      success: true
    });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      { error: '更新用戶資料失敗' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/{id}
 * 
 * 根據ID刪除用戶（僅限管理員）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    if (userError || !userData) {
      return NextResponse.json<ErrorResponse>({ error: 'Failed to get user role' }, { status: 500 });
    }

    const { data: targetUser, error: targetUserError } = await supabase
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
      .eq('id', id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json<ErrorResponse>({ error: 'Failed to get target user role' }, { status: 500 });
    }

    const currentUserRole = Array.isArray(userData.role) ? userData.role[0] : userData.role;
    const targetUserRole = Array.isArray(targetUser.role) ? targetUser.role[0] : targetUser.role;

    if (!hasEqualOrHigherPermission(currentUserRole, targetUserRole)) {
      return NextResponse.json<ErrorResponse>({ error: '你不能刪除比自己角色權限高的用戶' }, { status: 403 });
    }

    // 不能刪除自己
    if (id === user.id) {
      return NextResponse.json<ErrorResponse>(
        { error: '你不能刪除自己的帳號' },
        { status: 400 }
      );
    }

    // 確認用戶是否存在
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('id', id);

    if (countError) {
      return NextResponse.json<ErrorResponse>({ error: countError.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json<ErrorResponse>({ error: 'User not found' }, { status: 404 });
    }

    // 刪除與用戶相關的權限記錄
    const { error: accessError } = await supabase
      .from('teacher_student_access')
      .delete()
      .eq('teacher_id', id);

    if (accessError) {
      return NextResponse.json<ErrorResponse>({ error: accessError.message }, { status: 500 });
    }

    // 刪除用戶
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('刪除用戶失敗:', error);
    return NextResponse.json<ErrorResponse>(
      { error: '刪除用戶失敗' },
      { status: 500 }
    );
  }
} 