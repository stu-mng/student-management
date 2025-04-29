import { ErrorResponse, Student, StudentsListResponse, SuccessResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/students
 * 
 * 根據教師權限或管理員身份返回學生列表
 */
export async function GET() {
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
      console.error('Get user role error:', userError);
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    const isAdmin = userData.role === 'admin' || userData.role === 'root';
    
    let query = supabase.from('students').select('*', { count: 'exact' });
    
    // 如果不是管理員，則只獲取教師有權查看的學生
    if (!isAdmin) {
      const { data: accessibleStudentIds } = await supabase
        .from('teacher_student_access')
        .select('student_id')
        .eq('teacher_id', user.id);
      
      if (accessibleStudentIds && accessibleStudentIds.length > 0) {
        const studentIds = accessibleStudentIds.map(item => item.student_id);
        query = query.in('id', studentIds);
      } else {
        // 如果教師沒有權限查看任何學生，返回空數組
        return NextResponse.json<StudentsListResponse>({
          total: 0,
          data: []
        });
      }
    }
    
    // 進行分頁
    const { data, count, error } = await query
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json<StudentsListResponse>({
      total: count || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to get students' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * 
 * 新增一位學生資料到系統
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

    // 只有管理員可以新增學生
    if (userData.role === 'teacher') {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 獲取請求體
    const studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'> = await request.json();
    
    // 檢查必填欄位
    if (!studentData.name) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // 檢查學號是否已存在
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('email', studentData.email)
      .single();

    if (existingStudent) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Student email already exists' },
        { status: 409 }
      );
    }

    // 插入新的學生資料
    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select('*')
      .single();

    if (error) {
      console.log(error.message)
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<SuccessResponse & { data: Student }>({
      success: true,
      data
    });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
} 