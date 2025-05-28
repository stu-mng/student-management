import { ErrorResponse, Student, StudentUpdateRequest, SuccessResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { hasUserManagePermission } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/students/[id]
 * 
 * 獲取指定ID的學生資料
 */
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

    const currentUserRole = (userData?.role as any)?.name;
    const userRoleObj = Array.isArray(userData?.role) ? userData.role[0] : userData.role;
    const hasManagePermission = hasUserManagePermission(userRoleObj);
    
    // 創建查詢
    let query = supabase
      .from('students')
      .select('*')
      .eq('id', (await params).id)
      .single();
    
    // 如果不是管理員，檢查是否有權訪問該學生
    if (!hasManagePermission) {
      // 檢查老師是否有權訪問該學生
      const { data: accessCheck, error: accessError } = await supabase
        .from('teacher_student_access')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('student_id', (await params).id)
        .maybeSingle();
      
      if (accessError) {
        return NextResponse.json<ErrorResponse>({ error: accessError.message }, { status: 500 });
      }
      
      if (!accessCheck) {
        return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
      }
    }
    
    // 獲取學生資料
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json<ErrorResponse>({ error: 'Student not found' }, { status: 404 });
    }
    
    return NextResponse.json<Student>(data);
  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to get student' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/students/[id]
 * 
 * 更新指定ID的學生資料
 */
export async function PUT(
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

    // 只有管理員可以更新學生資料
    const currentUserRole = (userData?.role as any)?.name;
    const userRoleObj = Array.isArray(userData?.role) ? userData.role[0] : userData.role;
    const hasManagePermission = hasUserManagePermission(userRoleObj);
    if (!hasManagePermission) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 獲取請求體
    const studentData = await request.json();
    
    // 更新學生資料
    const { data, error } = await supabase
      .from('students')
      .update(studentData)
      .eq('id', (await params).id)
      .select()
      .single();

    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<Student>(data);
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students/[id]
 * 
 * 刪除指定ID的學生資料
 */
export async function DELETE(
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

    // 只有管理員可以刪除學生
    const currentUserRole = (userData?.role as any)?.name;
    const userRoleObj = Array.isArray(userData?.role) ? userData.role[0] : userData.role;
    const hasManagePermission = hasUserManagePermission(userRoleObj);
    if (!hasManagePermission) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 刪除學生資料
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', (await params).id);

    if (deleteError) {
      return NextResponse.json<ErrorResponse>({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json<SuccessResponse>({
      success: true
    });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
} 