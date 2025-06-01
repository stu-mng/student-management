import { createClient } from '@/database/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        role:roles(name, order)
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Check if user has admin or root role
    const userRole = (userData.role as any);
    const allowedRoles = ['root', 'admin', 'manager'];
    if (!userRole || !allowedRoles.includes(userRole.name)) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }
    
    // Actual database queries to populate analytics data
    
    // Get students by grade with a raw query since group by isn't directly supported in the type
    const { data: studentsByGradeData, error: gradeError } = await supabase
      .from('students')
      .select('grade')
      .not('grade', 'is', null);
    
    if (gradeError) {
      return NextResponse.json({ error: gradeError.message }, { status: 500 });
    }
    
    // Count occurrences of each grade
    const studentsByGrade: Record<string, number> = {};
    studentsByGradeData.forEach((student) => {
      const grade = student.grade as string;
      studentsByGrade[grade] = (studentsByGrade[grade] || 0) + 1;
    });
    
    // Get students by type
    const { data: studentsByTypeData, error: typeError } = await supabase
      .from('students')
      .select('student_type')
      .not('student_type', 'is', null);
    
    if (typeError) {
      return NextResponse.json({ error: typeError.message }, { status: 500 });
    }
    
    // Count occurrences of each student type
    const studentsByType: Record<string, number> = {};
    studentsByTypeData.forEach((student) => {
      const type = student.student_type as string || '新生';
      studentsByType[type] = (studentsByType[type] || 0) + 1;
    });
    
    // Add a default type if none exists
    if (Object.keys(studentsByType).length === 0) {
      studentsByType['新生'] = 0;
    }
    
    // Get disadvantaged students count
    const { count: disadvantagedCount, error: disadvantagedError } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('is_disadvantaged', '是');
    
    if (disadvantagedError) {
      return NextResponse.json({ error: disadvantagedError.message }, { status: 500 });
    }
    
    // Get total students count
    const { count: totalStudents, error: totalError } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true });
    
    if (totalError) {
      return NextResponse.json({ error: totalError.message }, { status: 500 });
    }
    
    // Get teachers and their assigned students
    const { data: teachersData, error: teachersError } = await supabase
      .from('users')
      .select(`
        id, 
        name, 
        email,
        last_active,
        role:roles(name, order),
        teacher_student_access(count)
      `)
      .not('last_active', 'is', null)
      .order('last_active', { ascending: false })
      .limit(5);
    
    if (teachersError) {
      return NextResponse.json({ error: teachersError.message }, { status: 500 });
    }
    
    // Transform teachers data into the required format
    const teachersByActivity = teachersData.map(teacher => ({
      name: teacher.name || (teacher.email?.split('@')[0] || 'Unknown'),
      studentsCount: teacher.teacher_student_access[0]?.count || 0,
      lastActive: teacher.last_active,
    }));
    
    // Get all teachers with student counts for bar chart
    const { data: allTeachersData, error: allTeachersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role:roles(name, order),
        teacher_student_access(count)
      `)
    
    if (allTeachersError) {
      return NextResponse.json({ error: allTeachersError.message }, { status: 500 });
    }
    
    // Transform all teachers data for bar chart
    const teachersStudentCounts = allTeachersData
      .map(teacher => ({
        name: teacher.name || (teacher.email?.split('@')[0] || 'Unknown'),
        studentCount: teacher.teacher_student_access[0]?.count || 0
      }))
      .sort((a, b) => b.studentCount - a.studentCount); // Sort by student count descending
    
    // Get students created/updated over time (past 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: studentsTimeData, error: studentsTimeError } = await supabase
      .from('students')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString());
    
    if (studentsTimeError) {
      return NextResponse.json({ error: studentsTimeError.message }, { status: 500 });
    }
    
    // Group students by month
    const studentsByMonth: Record<string, number> = {};
    
    // Initialize all months in the last 6 months
    for (let i = 0; i <= 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      studentsByMonth[monthKey] = 0;
    }
    
    // Count students per month
    studentsTimeData.forEach(student => {
      if (student.created_at) {
        const date = new Date(student.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        studentsByMonth[monthKey] = (studentsByMonth[monthKey] || 0) + 1;
      }
    });
    
    // Convert to array and sort by date
    const studentsOverTime = Object.entries(studentsByMonth)
      .map(([month, count]) => ({
        month,
        studentCount: count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Get users count by role
    const { data: userRoleCounts, error: roleCountError } = await supabase
      .from('users')
      .select(`
        role:roles(name, order)
      `);

    if (roleCountError) {
      return NextResponse.json({ error: roleCountError.message }, { status: 500 });
    }
    
    // Calculate counts for each role based on the updated RBAC system
    const totalRoot = userRoleCounts.filter(user => (user.role as any)?.order === 0).length;           // 系統管理員
    const totalAdmins = userRoleCounts.filter(user => (user.role as any)?.order === 1).length;         // 計畫主持人
    const totalManagers = userRoleCounts.filter(user => (user.role as any)?.order === 2).length;       // 學校負責人
    const totalTeachers = userRoleCounts.filter(user => (user.role as any)?.order === 4).length;       // 大學伴
    const totalCandidates = userRoleCounts.filter(user => (user.role as any)?.order === 5).length;     // 儲備大學伴
    
    return NextResponse.json({
      studentsByGrade,
      studentsByType,
      disadvantagedCount: disadvantagedCount || 0,
      totalStudents: totalStudents || 0,
      totalRoot,
      totalAdmins,
      totalManagers,
      totalTeachers,
      totalCandidates,
      teachersByActivity,
      teachersStudentCounts,
      studentsOverTime
    });
    
  } catch (error) {
    console.error('Analytics API error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: '取得分析資料失敗' },
      { status: 500 }
    );
  }
} 