import { ErrorResponse, Student, StudentsListResponse, SuccessResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { hasUserManagePermission, isManager } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/students
 * 
 * 根據教師權限或管理員身份返回學生列表
 * 
 * 注意：需要执行數據庫遷移添加 region 欄位到 students 表:
 * ALTER TABLE students ADD COLUMN IF NOT EXISTS region VARCHAR(255);
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色和區域
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        region,
        role:roles(name)
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Get user role error:', userError);
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    const userRole = (userData.role as any)?.name;
    const userRoleObj = Array.isArray(userData.role) ? userData.role[0] : userData.role;
    const hasManagePermission = hasUserManagePermission(userRoleObj);
    const isManagerRole = isManager(userRoleObj);
    
    let query = supabase.from('students').select('*', { count: 'exact' });
    
    // 如果是區域管理員
    if (isManager(userRoleObj)) {
      // 如果區域管理員的region為null，返回空陣列
      if (!userData.region) {
        return NextResponse.json<StudentsListResponse>({
          total: 0,
          data: []
        });
      }
      
      // 只獲取相同region的學生
      query = query.eq('region', userData.region);
    }
    // 如果不是管理員，則只獲取教師有權查看的學生
    else if (!hasManagePermission) {
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

    // 獲取用戶角色和區域
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        region,
        role:roles(name)
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 只有管理員可以新增學生
    const userRole = (userData.role as any)?.name;
    const userRoleObj = Array.isArray(userData.role) ? userData.role[0] : userData.role;
    if (!hasUserManagePermission(userRoleObj)) {
      return NextResponse.json<ErrorResponse>({ error: '你的權限不足' }, { status: 403 });
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

    // 如果為區域管理員，只能新增自己區域的學生
    if (isManager(userRoleObj) && !userData.region) {
      return NextResponse.json<ErrorResponse>({ error: '區域管理員必須設定區域' }, { status: 403 });
    }
    if (isManager(userRoleObj) && userData.region) {
      studentData.region = userData.region;
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