import { createClient } from '@/database/supabase/server';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 驗證用戶權限
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 檢查用戶是否為管理員
    const { data: userData } = await supabase
      .from("users")
      .select(`
        role:roles(name)
      `)
      .eq("id", user.id)
      .single()

    const userRole = (userData?.role as any)?.name;
    if (!userData || (userRole !== "admin" && userRole !== "root")) {
      return new NextResponse("錯誤：您沒有權限進行此操作", { status: 403 })
    }

    // 獲取上傳的資料
    const students = await request.json()

    if (!Array.isArray(students) || students.length === 0) {
      return new NextResponse("錯誤：無效的資料格式", { status: 400 })
    }

    // 驗證必要欄位
    const requiredFields = ["name", "gender", "grade", "class", "student_type", "is_disadvantaged", "email"]
    const validGenders = ["男", "女"]
    const validStudentTypes = ["新生", "舊生"]
    const validDisadvantaged = ["是", "否"]

    for (const student of students) {
      // 檢查必要欄位是否存在
      for (const field of requiredFields) {
        if (!student[field]) {
          return new NextResponse(`錯誤：缺少必要欄位：${field}`, { status: 400 })
        }
      }

      // 驗證欄位值
      if (!validGenders.includes(student.gender)) {
        return new NextResponse("錯誤：無效的性別值", { status: 400 })
      }
      if (!validStudentTypes.includes(student.student_type)) {
        return new NextResponse("錯誤：無效的學生類型值", { status: 400 })
      }
      if (!validDisadvantaged.includes(student.is_disadvantaged)) {
        return new NextResponse("錯誤：無效的弱勢生值", { status: 400 })
      }
    }

    // 使用 upsert 來新增或更新學生資料
    const { data, error } = await supabase
      .from("students")
      .upsert(
        students.map((student) => ({
          ...student,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "email" }
      )

    if (error) {
      console.error("Database error:", error)
      return new NextResponse("Database error", { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully imported ${students.length} students`,
      data,
    })
  } catch (error) {
    console.error("Import error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 