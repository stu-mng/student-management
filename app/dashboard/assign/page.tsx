"use client"

import { bulkAssignStudentsToTeacher, fetchAssignedStudents, fetchStudents, fetchTeachers } from "@/app/api/permissions/assign/service"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Student, User } from "@/lib/mock-data"
import { toTraditionalChinese } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function AssignStudentsPage() {
  const { user } = useAuth()
  
  // 狀態管理
  const [teachers, setTeachers] = useState<User[]>([])            // 所有教師資料
  const [students, setStudents] = useState<Student[]>([])         // 所有學生資料
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)  // 選中的教師 ID
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])       // 選中的學生 ID 列表
  const [assignedStudents, setAssignedStudents] = useState<string[]>([])       // 已分配學生 ID 列表
  
  // 載入狀態
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)  // 初始資料載入狀態
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false) // 已分配學生載入狀態
  const [isSubmitting, setIsSubmitting] = useState(false)         // 提交狀態

  // 步驟 1: 初次載入時，獲取所有教師和學生資料
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoadingInitial(true)
        
        // 並行請求以提高效率
        const [teachersData, studentsData] = await Promise.all([
          fetchTeachers(),  // 獲取所有教師資料
          fetchStudents()   // 獲取所有學生資料
        ])
        
        setTeachers(teachersData)
        setStudents(studentsData)
        
        console.log(`已載入 ${teachersData.length} 位教師和 ${studentsData.length} 位學生資料`)
      } catch (error) {
        console.error("獲取初始數據錯誤:", error)
        toast("錯誤", {
          description: "獲取教師和學生數據失敗",
        })
      } finally {
        setIsLoadingInitial(false)
      }
    }

    if (user) {
      fetchInitialData()
    }
  }, [user])

  // 步驟 2: 當選擇教師時，獲取該教師已分配的學生 ID
  useEffect(() => {
    if (!selectedTeacher) {
      // 清空已分配學生列表
      setAssignedStudents([])
      setSelectedStudents([])
      return
    }

    const fetchTeacherAssignedStudents = async () => {
      try {
        setIsLoadingAssigned(true)
        
        // 使用 API 獲取教師已分配的學生 ID 數組
        const assignedIds = await fetchAssignedStudents(selectedTeacher)
        
        console.log(`教師 ${selectedTeacher} 已分配 ${assignedIds.length} 位學生`)
        
        // 更新已分配及選中的學生列表
        setAssignedStudents(assignedIds)
        setSelectedStudents(assignedIds)
      } catch (error) {
        console.error("獲取已分配學生錯誤:", error)
        toast("錯誤", {
          description: "獲取教師已分配學生失敗",
        })
      } finally {
        setIsLoadingAssigned(false)
      }
    }

    fetchTeacherAssignedStudents()
  }, [selectedTeacher])

  // 處理教師選擇變更
  const handleTeacherChange = (value: string) => {
    setSelectedTeacher(value)
  }

  // 處理學生勾選
  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  // 處理全選/取消全選
  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map((student) => student.id))
    }
  }

  // 計算將被取消分配的學生數量
  const studentsToBeUnassigned = assignedStudents.filter(id => !selectedStudents.includes(id));
  
  // 計算將被新分配的學生數量
  const studentsToBeAssigned = selectedStudents.filter(id => !assignedStudents.includes(id));

  // 步驟 3: 提交更新的學生分配
  const handleSubmit = async () => {
    if (!selectedTeacher) {
      toast("錯誤", {
        description: "請選擇一位教師",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 使用 API 更新學生分配
      const result = await bulkAssignStudentsToTeacher(selectedTeacher, selectedStudents)
      
      console.log(`已成功更新教師 ${selectedTeacher} 的學生分配`, result)
      
      toast("成功", {
        description: `學生分配已成功更新：新增 ${studentsToBeAssigned.length} 位，移除 ${studentsToBeUnassigned.length} 位`,
      })

      // 更新已分配學生列表
      setAssignedStudents([...selectedStudents])
    } catch (error: unknown) {
      console.error("更新學生分配錯誤:", error)

      toast("錯誤", {
        description: error instanceof Error ? error.message : "更新學生分配時發生錯誤",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 表格配置
  const initialColumnVisibility = {
    class: false,
    grade: false,
  }

  const columns: ColumnDef<Student>[] = [
    {
      id: "select",
      header: ({ column }) => (
        <div
          className="w-full flex items-center justify-center cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Checkbox
            id="select-all"
            checked={selectedStudents.length === students.length}
            onCheckedChange={handleSelectAll}
            />
        </div>
      ),
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="w-full flex items-center justify-center">
            <Checkbox
              checked={selectedStudents.includes(student.id)}
              onCheckedChange={() => handleStudentToggle(student.id)}
              aria-label={`選擇 ${student.name}`}
            />
          </div>
        )
      },
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
      accessorKey: "grade",
      header: "年級",
      enableHiding: true,
    },
    {
      accessorKey: "class",
      header: "班次",
      enableHiding: true,
    },
    {
      id: "grade_n_class",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            年級班次
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const grade = row.getValue("grade");
        const classValue = row.getValue("class");
        if (!grade || !classValue) return <div className="text-center pr-4">-</div>;
        return <div className="text-center pr-4">{`${toTraditionalChinese(Number.parseInt(grade as string))}年${toTraditionalChinese(Number.parseInt(classValue as string))}班`}</div>;
      },
      enableSorting: true,
      sortingFn: (rowA, rowB, _columnId) => {
        // Sort by grade first, then by class
        const gradeA = Number(rowA.getValue("grade") || 0);
        const gradeB = Number(rowB.getValue("grade") || 0);
        if (gradeA !== gradeB) {
          return gradeA - gradeB;
        }
        const classA = Number(rowA.getValue("class") || 0);
        const classB = Number(rowB.getValue("class") || 0);
        return classA - classB;
      },
    },
  ]

  // 是否正在載入任何資料
  const isLoading = isLoadingInitial || isLoadingAssigned;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">分配學生</h1>
        <p className="text-muted-foreground">為教師分配可查看的學生</p>
      </div>

      {/* 步驟 1: 選擇教師 */}
      <Card className="border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-foreground">選擇教師</CardTitle>
          <CardDescription>選擇要分配學生的教師</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingInitial ? (
            <Skeleton className="h-10 w-full max-w-sm" />
          ) : (
            <Select value={selectedTeacher || ""} onValueChange={handleTeacherChange}>
              <SelectTrigger className="w-full max-w-sm border focus-visible:ring-ring">
                <SelectValue placeholder="選擇教師" />
              </SelectTrigger>
              <SelectContent>
                {teachers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    沒有可用的教師
                  </SelectItem>
                ) : (
                  teachers.filter(teacher => teacher.role === "teacher").map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* 步驟 2: 顯示分配區域 (僅在選擇教師後顯示) */}
      {selectedTeacher && 
        <div className="flex flex-col gap-4">
          {/* 變更摘要 */}
          {(studentsToBeAssigned.length > 0 || studentsToBeUnassigned.length > 0) && (
            <Card className="border border-amber-200 bg-amber-50">
              <CardHeader className="bg-amber-100/50 py-2">
                <CardTitle className="text-amber-800 text-sm font-medium">變更摘要</CardTitle>
              </CardHeader>
              <CardContent className="py-2 text-sm text-amber-700">
                <div className="flex flex-col gap-1">
                  {studentsToBeAssigned.length > 0 && (
                    <div className="flex items-center">
                      <span className="text-green-600 font-medium mr-2">+{studentsToBeAssigned.length}</span>
                      <span>位學生將被分配給此教師</span>
                    </div>
                  )}
                  {studentsToBeUnassigned.length > 0 && (
                    <div className="flex items-center">
                      <span className="text-red-600 font-medium mr-2">-{studentsToBeUnassigned.length}</span>
                      <span>位學生將被取消分配</span>
                    </div>
                  )}
                  <div className="text-xs text-amber-600 mt-1">
                    請檢查變更並點擊「保存分配」按鈕確認。
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 已分配學生區塊 */}
          <Card className="border">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-foreground">已分配學生</CardTitle>
              <CardDescription>該教師可以管理表格中的學生</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <Skeleton className="h-[300px] w-full rounded-md" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : selectedStudents.length === 0 ? (
                <div className="text-center p-4 border rounded-md bg-muted/50 text-foreground">沒有可管理的學生</div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      已分配 {selectedStudents.length} / {students.length} 名學生
                    </div>
                  </div>
                  <DataTable
                    columns={columns}
                    data={students.filter((student) => selectedStudents.includes(student.id))}
                    initialState={{ columnVisibility: initialColumnVisibility }}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                      {isSubmitting ? "保存中..." : "保存分配"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 未分配學生區塊 */}
          <Card className="border">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-foreground">分配新學生</CardTitle>
              <CardDescription>選擇該教師可以查看的學生</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <Skeleton className="h-[300px] w-full rounded-md" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center p-4 border rounded-md bg-muted/50 text-foreground">沒有可用的學生</div>
              ) : (
                <div>
                  <DataTable
                    columns={columns}
                    data={students.filter((student) => !selectedStudents.includes(student.id))}
                    initialState={{ columnVisibility: initialColumnVisibility }}
                    searchableColumns={[]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      }
    </div>
  )
}
