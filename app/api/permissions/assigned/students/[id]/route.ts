import { ErrorResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/permissions/assigned/[id]
 * 
 * 回傳所有 userId 為 id 的使用者所被分配到的學生 ID 陣列
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // 獲取當前登入的用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取 URL 中的用戶 ID
    const userId = (await params).id;

    // 如果 userId 不存在
    if (!userId) {
      return NextResponse.json<ErrorResponse>({ error: 'User ID is required' }, { status: 400 });
    }

    // 檢查當前用戶的角色，只有管理員或本人可以檢視分配的學生
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 如果不是管理員並且也不是查詢自己的數據，則拒絕訪問
    if (userData.role !== 'admin' && userData.role !== 'root' && userData.role !== 'manager' && user.id !== userId) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 查詢用戶是否存在
    const { count, error: userExistsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('id', userId);

    if (userExistsError) {
      return NextResponse.json<ErrorResponse>({ error: userExistsError.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json<ErrorResponse>({ error: 'User not found' }, { status: 404 });
    }

    // 只獲取分配給這個用戶的學生 ID
    const { data: assignedStudents, error: assignedError } = await supabase
      .from('teacher_student_access')
      .select('student_id')
      .eq('teacher_id', userId);

    if (assignedError) {
      return NextResponse.json<ErrorResponse>({ error: assignedError.message }, { status: 500 });
    }

    // 提取學生 ID 並返回數組
    const studentIds = assignedStudents.map(item => item.student_id);

    return NextResponse.json(studentIds);
  } catch (error) {
    console.error('Get assigned students error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to get assigned students' },
      { status: 500 }
    );
  }
} 