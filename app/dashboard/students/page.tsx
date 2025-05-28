"use client"

import { useAuth } from "@/components/auth-provider"
import { RestrictedCard } from "@/components/restricted-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { Student } from "@/lib/types"
import { toTraditionalChinese } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ChevronLeft, ChevronRight, Edit, Eye, EyeOff, Plus, Search, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Student Details Dialog Component
function StudentDetailsDialog({ student, open, onOpenChange, students, onStudentChange }: { 
  student: Student | null, 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  students: Student[],
  onStudentChange: (student: Student) => void
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  // 處理鍵盤事件 - 左右方向鍵導航
  useEffect(() => {
    // 如果對話框未打開或沒有學生數據，則不添加事件
    if (!open || !student) return;
    
    // 找到當前學生在列表中的索引
    const currentIndex = students.findIndex(s => s.id === student.id);
    
    // 確定上一個和下一個學生
    const prevStudent = currentIndex > 0 ? students[currentIndex - 1] : null;
    const nextStudent = currentIndex < students.length - 1 ? students[currentIndex + 1] : null;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // 當不在輸入框中時才啟用左右方向鍵導航
      const isInputActive = document.activeElement instanceof HTMLInputElement || 
                           document.activeElement instanceof HTMLTextAreaElement ||
                           document.activeElement instanceof HTMLSelectElement;
                           
      if (!isInputActive) {
        if (e.key === "ArrowLeft" && prevStudent) {
          e.preventDefault(); // 防止頁面滾動
          onStudentChange(prevStudent);
        } else if (e.key === "ArrowRight" && nextStudent) {
          e.preventDefault(); // 防止頁面滾動
          onStudentChange(nextStudent);
        }
      }
    };
  
    // 添加事件監聽器
    window.addEventListener("keydown", handleKeyDown);
    
    // 清理函數 - 移除事件監聽器
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, student, students, onStudentChange]);
  
  if (!student) return null;
  
  // 找到當前學生在列表中的索引
  const currentIndex = students.findIndex(s => s.id === student.id);
  
  // 確定上一個和下一個學生
  const prevStudent = currentIndex > 0 ? students[currentIndex - 1] : null;
  const nextStudent = currentIndex < students.length - 1 ? students[currentIndex + 1] : null;
  
  // 導航到上一個/下一個學生的函數
  const navigateToStudent = (targetStudent: Student) => {
    // 直接更新選中的學生
    onStudentChange(targetStudent);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>學生詳細資料</span>
            <Button 
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              router.push(`/dashboard/students/${student.id}`);
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            編輯資料
          </Button>
          </DialogTitle>
          <DialogDescription>
            學生 {student.name} 的完整資料
          </DialogDescription>
        </DialogHeader>
        
        {/* 導航和編輯按鈕 - 移至頂部 */}
        <div className="flex justify-between mb-2 gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => prevStudent && navigateToStudent(prevStudent)}
            disabled={!prevStudent}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            上一個
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => nextStudent && navigateToStudent(nextStudent)}
            disabled={!nextStudent}
          >
            下一個
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          
        </div>
        
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-3">
            <div className="font-medium">姓名</div>
            <div className="col-span-3">{student.name}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <div className="font-medium">性別</div>
            <div className="col-span-3">{student.gender}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <div className="font-medium">年級</div>
            <div className="col-span-3">{`${toTraditionalChinese(Number.parseInt(student.grade))}年級`}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <div className="font-medium">班級</div>
            <div className="col-span-3">{`${toTraditionalChinese(Number.parseInt(student.class))}班`}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <div className="font-medium">電子郵件</div>
            <div className="col-span-3">{student.email}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <div className="font-medium">學生類型</div>
            <div className="col-span-3">
              <Badge variant="outline">{student.student_type}</Badge>
              {student.is_disadvantaged === '是' && (
                <Badge variant="outline" className="ml-2">弱勢生</Badge>
              )}
            </div>
          </div>
          
          {/* 帳號資訊 */}
          <div className="grid grid-cols-4 items-center gap-3">
            <div className="font-medium">帳號</div>
            <div className="col-span-3">{student.account_username}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <div className="font-medium">密碼</div>
            <div className="col-span-3 flex items-center">
              {showPassword ? student.account_password : '••••••••'}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 ml-2" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* 長文本字段使用摺疊區塊 */}
          <div className="space-y-1">
            <div className="font-medium">家庭背景</div>
            <div className="p-2 rounded-md bg-muted/50 text-sm whitespace-pre-wrap max-h-[80px] overflow-y-auto">{student.family_background}</div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium">文化不利因素</div>
            <div className="p-2 rounded-md bg-muted/50 text-sm whitespace-pre-wrap max-h-[80px] overflow-y-auto">{student.cultural_disadvantage_factors}</div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium">個人背景補充</div>
            <div className="p-2 rounded-md bg-muted/50 text-sm whitespace-pre-wrap max-h-[80px] overflow-y-auto">{student.personal_background_notes}</div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium">報名動機</div>
            <div className="p-2 rounded-md bg-muted/50 text-sm whitespace-pre-wrap max-h-[80px] overflow-y-auto">{student.registration_motivation}</div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 學生詳細資料對話框的狀態
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  
  // 初始列可見性狀態 - 隱藏弱勢生和學生類型欄位
  const initialColumnVisibility = {
    is_disadvantaged: false,
    student_type: false,
    email: false,
    region: user?.role?.name === 'admin' || user?.role?.name === 'root',
  }
  
  // 當對話框關閉時的處理
  const handleDialogOpenChange = (open: boolean) => {
    setOpenDialog(open);
  };

  // 檢查是否為管理員
  const isAdmin = user?.role?.name === "admin" || user?.role?.name === "root" || user?.role?.name === "manager";

  // 查看學生詳細資料
  const viewStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  };

  useEffect(() => {
    // 獲取學生數據
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/students');
        
        const data = await response.json();
        setStudents(data.data || []);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchStudents();
    }
  }, [user])

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("確定要刪除這個學生嗎？此操作無法撤銷。")) {
      return
    }

    try {
      // 真實刪除操作
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      toast("成功", {
        description: "學生已從系統中刪除",
      })

      // 更新學生列表
      setStudents(students.filter((student) => student.id !== id))
    } catch (error) {
      console.error("刪除學生錯誤:", error)
      alert('刪除學生時發生錯誤');
    }
  }

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "gender",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            性別
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center pr-4">{row.getValue("gender") || "-"}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            姓名
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center pr-4">{row.getValue("name") || "-"}</div>,
    },
    {
      accessorKey: "region",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            區域
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center pr-4">{row.getValue("region") || "-"}</div>,
      enableHiding: true,
    },
    {
      accessorKey: "grade",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            年級
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center pr-4">{`${toTraditionalChinese(Number.parseInt(row.getValue("grade")))}年` || "-"}</div>,
      enableHiding: true,
    },
    {
      accessorKey: "class",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            班級
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center pr-4">{`${toTraditionalChinese(Number.parseInt(row.getValue("class")))}班` || "-"}</div>,
      enableHiding: true,
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            電子郵件
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center pr-4">{row.getValue("email") || "-"}</div>,
      enableHiding: true,
    },
    {
      accessorKey: "is_disadvantaged",
      header: "弱勢生狀態",
      enableHiding: true,
    },
    {
      accessorKey: "student_type",
      header: "學生類型",
      enableHiding: true,
    },
    {
      id: "tags",
      header: '',
      cell: ({ row }) => {
        const studentType = row.getValue("student_type") as string;
        const isDisadvantaged = row.getValue("is_disadvantaged") as string;
        return (
          <div className="flex items-center justify-center">
            <div className="w-full flex gap-2">
              <Badge variant="outline">
                {studentType}
              </Badge>
              {isDisadvantaged === '是' && (
                <Badge variant="outline">
                  弱勢生
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original

        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewStudentDetails(student)}
            >
              <Search className="h-4 w-4 mr-1" />
              查看
            </Button>
            {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/students/${student.id}`)}>
              <Edit className="h-4 w-4 mr-1" />
                編輯
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteStudent(student.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                刪除
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  // 使用 useMemo 來避免不必要的重新計算
  const searchableColumns = useMemo(
    () => [
      {
        id: "region",
        title: "區域",
      },
      {
        id: "name",
        title: "姓名",
      },
      {
        id: "email",
        title: "電子郵件",
      },
    ],
    [],
  )

  // 使用 useMemo 來避免不必要的重新計算
  const filterableColumns = useMemo(() => {
    // 獲取唯一的年級列表
    const grades = Array.from(
      new Set(students.filter((student) => student.grade).map((student) => student.grade?.toString() as string)),
    )
      .sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
      .map((grade) => ({
        value: grade,
        label: `${toTraditionalChinese(Number.parseInt(grade))}年級`,
      }))
    
    // 獲取唯一的班級列表
    const classes = (Array.from(
      new Set(students.map((student) => student.class as string)),
    ) as string[])
      .sort((a, b) => (Number.parseInt(a) - Number.parseInt(b)))
      .map((cls) => ({
        value: cls,
        label: `${toTraditionalChinese(Number.parseInt(cls))}班`,
  }));

  const regions = (Array.from(
    new Set(students.map((student) => student.region as string)),
  ) as string[]).map(region => ({
    value: region,
    label: region,
  }))



    return [
      {
        id: "gender",
        title: "性別",
        options: [{ value: "男", label: "男同學" }, { value: "女", label: "女同學" }],
      },
      {
        id: "region",
        title: "區域",
        options: regions,
      },
      {
        id: "grade",
        title: "年級",
        options: grades,
      },
      {
        id: "class",
        title: "班次",
        options: classes,
      },
      {
        id: "is_disadvantaged",
        title: "弱勢生",
        options: [{ value: '是', label: "弱勢生" }, { value: '否', label: "非弱勢生" }],
      },
      {
        id: "student_type",
        title: "新舊生",
        options: [{ value: '新生', label: "新生" }, { value: '舊生', label: "舊生" }],
      },
    ]
  }, [students])

  return (
    <div className="space-y-6">
      {/* 學生詳細資料對話框 */}
      <StudentDetailsDialog
        student={selectedStudent}
        open={openDialog}
        onOpenChange={handleDialogOpenChange}
        students={students}
        onStudentChange={setSelectedStudent}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">學生資料管理</h1>
          <p className="text-muted-foreground">查詢和管理系統中的學生資料</p>
        </div>
        {isAdmin && (
          <Button onClick={() => router.push("/dashboard/students/new")}>
            <Plus className="h-4 w-4 mr-1" />
            新增學生
          </Button>
        )}
      </div>

      <RestrictedCard allowedRoles={["admin", "root", "teacher"]}>
        <CardHeader>
          <CardTitle>學生列表</CardTitle>
          <CardDescription>系統中所有學生的資料</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-sm" />
              <Skeleton className="h-[300px] w-full rounded-md" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={students}
              searchableColumns={searchableColumns}
              filterableColumns={filterableColumns}
              initialState={{
                columnVisibility: initialColumnVisibility
              }}
            />
          )}
        </CardContent>
      </RestrictedCard>
    </div>
  )
}
