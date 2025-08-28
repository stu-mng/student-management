"use client"

import { bulkAssignStudentsToTeacher, fetchAssignedStudents, fetchStudents, fetchTeachers } from "@/app/api/students/assign/service"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Student, User } from "@/lib/types"
import { toTraditionalChinese } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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
        
        console.log(`已載入 ${teachersData.length} 位大學伴和 ${studentsData.length} 位小學伴`)
      } catch (error) {
        console.error("獲取初始數據錯誤:", error)
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
  const handleSelectAll = (visibleStudents: Student[]) => {
    const visibleStudentIds = visibleStudents.map(student => student.id)
    
    if (visibleStudentIds.every(id => selectedStudents.includes(id))) {
      // 如果所有可見學生都已選取，則取消選取它們
      setSelectedStudents(prev => prev.filter(id => !visibleStudentIds.includes(id)))
    } else {
      // 如果有部分或全部可見學生未選取，則選取所有可見學生
      const newSelected = [...selectedStudents]
      visibleStudentIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id)
        }
      })
      setSelectedStudents(newSelected)
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
      await bulkAssignStudentsToTeacher(selectedTeacher, selectedStudents)
      
      let message = `小學伴分配已成功更新：`;
      if (studentsToBeAssigned.length > 0) {
        message = message.concat(`新增 ${studentsToBeAssigned.length} 位`);
      }
      if (studentsToBeAssigned.length > 0 && studentsToBeUnassigned.length > 0) {
        message = message.concat(`、`);
      }
      if (studentsToBeUnassigned.length > 0) {
        message = message.concat(`移除 ${studentsToBeUnassigned.length} 位`);
      }
      toast("成功", {
        description: message
      })

      // 更新已分配學生列表
      setAssignedStudents([...selectedStudents])
    } catch (error: unknown) {
      toast("錯誤", {
        description: error instanceof Error ? error.message : "更新小學伴分配時發生錯誤",
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
      header: ({ table }) => (
        <div
          className="w-full flex items-center justify-center cursor-pointer"
        >
          <Checkbox
            id="select-all"
            checked={
              table.getFilteredRowModel().rows.length > 0 &&
              table.getFilteredRowModel().rows.every(row => 
                selectedStudents.includes(row.original.id)
              )
            }
            onCheckedChange={() => 
              handleSelectAll(table.getFilteredRowModel().rows.map(row => row.original))
            }
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
    ]
  }, [students])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">分配小學伴</h1>
        <p className="text-muted-foreground">為大學伴分配可查看的小學伴</p>
      </div>

      {/* 步驟 1: 選擇教師 */}
      <Card className="border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-foreground">選擇大學伴</CardTitle>
          <CardDescription>選擇要分配小學伴的大學伴</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingInitial ? (
            <Skeleton className="h-10 w-full max-w-sm" />
          ) : (
            <Select value={selectedTeacher || ""} onValueChange={handleTeacherChange}>
              <SelectTrigger className="w-full max-w-sm border focus-visible:ring-ring">
                <SelectValue placeholder="選擇大學伴" />
              </SelectTrigger>
              <SelectContent>
                {teachers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    沒有可用的教師
                  </SelectItem>
                ) : (
                  teachers.filter(teacher => teacher.role?.name === "teacher").map((teacher) => (
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
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-amber-600">
                      請檢查變更並點擊「保存分配」按鈕確認。
                    </div>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting} 
                      className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-3 text-sm"
                    >
                      {isSubmitting ? "保存中..." : "保存分配"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 已分配學生區塊 */}
          <Card className="border">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-foreground">已分配小學伴</CardTitle>
              <CardDescription>該大學伴可以管理表格中的小學伴</CardDescription>
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
                      已分配 {selectedStudents.length} / {students.length} 名小學伴
                    </div>
                  </div>
                  <DataTable
                    columns={columns}
                    data={students.filter((student) => selectedStudents.includes(student.id))}
                    initialState={{ columnVisibility: initialColumnVisibility }}
                  />
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
                    filterableColumns={filterableColumns}
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
