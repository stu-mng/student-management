import type { BulkAssignPermissionRequest, BulkAssignPermissionResponse, ErrorResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/permissions/bulk-assign
 * 
 * 批量分配教師對學生的權限（僅限管理員）
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

    // 只有管理員可以批量分配權限
    if (userData.role !== 'admin' && userData.role !== 'root') {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 獲取請求體
    const { teacher_id, student_ids }: BulkAssignPermissionRequest = await request.json();
    
    // 檢查必填欄位
    if (!teacher_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Teacher ID and at least one Student ID are required' },
        { status: 400 }
      );
    }

    // 檢查教師是否存在且是教師角色
    const { count: teacherCount, error: teacherError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('id', teacher_id)
      .eq('role', 'teacher');

    if (teacherError) {
      return NextResponse.json<ErrorResponse>({ error: teacherError.message }, { status: 500 });
    }

    if (teacherCount === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Teacher not found or user is not a teacher' },
        { status: 404 }
      );
    }

    // 檢查所有學生是否存在
    const { data: existingStudents, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .in('id', student_ids);

    if (studentsError) {
      return NextResponse.json<ErrorResponse>({ error: studentsError.message }, { status: 500 });
    }

    const existingStudentIds = existingStudents.map(s => s.id);
    if (existingStudentIds.length !== student_ids.length) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Some student IDs do not exist' },
        { status: 400 }
      );
    }

    // 獲取已存在的關聯
    const { data: existingRelations, error: relationsError } = await supabase
      .from('teacher_student_access')
      .select('student_id')
      .eq('teacher_id', teacher_id)
      .in('student_id', student_ids);

    if (relationsError) {
      return NextResponse.json<ErrorResponse>({ error: relationsError.message }, { status: 500 });
    }

    // 找出需要新增的關聯
    const existingRelationIds = existingRelations.map(r => r.student_id);
    const newRelations = student_ids.filter(id => !existingRelationIds.includes(id));

    // 如果沒有新關聯需要建立
    if (newRelations.length === 0) {
      return NextResponse.json<BulkAssignPermissionResponse>({
        success: true,
        count: 0,
        message: 'All permission relations already exist'
      });
    }

    // 批量建立新的權限關聯
    const relationData = newRelations.map(student_id => ({
      teacher_id,
      student_id
    }));

    const { data, error } = await supabase
      .from('teacher_student_access')
      .insert(relationData);

    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<BulkAssignPermissionResponse>({
      success: true,
      count: newRelations.length
    });
  } catch (error) {
    console.error('Bulk assign permissions error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to bulk assign permissions' },
      { status: 500 }
    );
  }
} 