import { ErrorResponse, SuccessResponse, User } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
      .select('role')
      .eq('id', user.id)
      .single();

    // 驗證：只有管理員或者查詢自己的資料才允許
    if (userData?.role === 'teacher' && id !== user.id) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 獲取用戶資料
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (!data) {
      return NextResponse.json<ErrorResponse>({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json<User>(data);
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
      .select('role')
      .eq('id', user.id)
      .single();

    // 只有管理員可以更新其他用戶資料
    if (userData?.role === 'teacher' && id !== user.id) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 檢查要更新的欄位
    const updateData: Record<string, any> = {};
    
    try {
      // 嘗試從請求體中獲取數據
      const requestData = await request.json();
      
      // 處理來自前端的請求
      if (requestData) {
        if (requestData.email !== undefined) {
          updateData.email = requestData.email;
        }
        
        if (requestData.name !== undefined) {
          updateData.name = requestData.name;
        }

        if (requestData.avatar_url !== undefined) {
          updateData.avatar_url = requestData.avatar_url;
        }
        
        if (requestData.role !== undefined) {
          if (userData?.role !== 'root') {
            // 獲取目標用戶的當前角色
            const { data: targetUser, error: targetUserError } = await supabase
            .from('users')
            .select('role')
            .eq('id', id)
            .single();
            
            // 如果當前用戶是admin而不是root
            if (userData?.role === 'admin') {
              // 如果目標用戶是admin，且嘗試降級為teacher，拒絕操作
              if (targetUser?.role === 'admin' && requestData.role === 'teacher') {
                return NextResponse.json<ErrorResponse>({ 
                  error: '管理員不能將其他管理員降級為教師，只有最高管理員可以執行此操作' 
                }, { status: 403 });
              }
              
              // 如果嘗試將用戶升級為root，拒絕操作
              if (requestData.role === 'root') {
                return NextResponse.json<ErrorResponse>({ 
                  error: '只有最高管理員可以設置其他用戶為最高管理員' 
                }, { status: 403 });
              }
            } else {
              // 非管理員用戶不能修改任何角色
              return NextResponse.json<ErrorResponse>({ 
                error: '只有管理員或最高管理員可以更改用戶角色' 
              }, { status: 403 });
            }
          }
          
          // 確保角色值有效
          if (!['admin', 'teacher', 'root'].includes(requestData.role)) {
            return NextResponse.json<ErrorResponse>({ 
              error: '無效的角色值。必須是 "teacher"、"admin" 或 "root"' 
            }, { status: 400 });
          }
          
          // 如果當前用戶不是root，且試圖設置root角色，拒絕操作
          if (requestData.role === 'root' && userData?.role !== 'root') {
            return NextResponse.json<ErrorResponse>({ 
              error: '你不能將其他人設為最高管理員！如果需要更多最高管理員，請聯繫維護人員。'
            }, { status: 400 });
          }
          
          updateData.role = requestData.role;
        }

      }
    } catch (e) {
      return NextResponse.json<ErrorResponse>({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // 檢查用戶是否存在
    const { data: userById, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('id', id)
      .maybeSingle();
    
    const existingUser = { count: count || 0, data: userById };

    const result = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return NextResponse.json<User & SuccessResponse>({
      ...result.data,
      success: result.error ? false : true
    });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to update user' },
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 只有管理員可以刪除用戶
    if (userData.role === 'teacher' || user.role === 'admin' && userData.role !== 'teacher') {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 不能刪除自己
    if (id === user.id) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Cannot delete your own account' },
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
    console.error('Delete user error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 