"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type User = {
  id: string
  email: string
  role: string
  created_at: string
  avatar_url: string | null
  name: string | null
}

// 根據角色獲取背景顏色
const getRoleBgColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-blue-100';
    case 'teacher':
      return 'bg-green-100';
    case 'root':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}

// 根據角色獲取文字顏色
const getRoleTextColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'text-blue-800';
    case 'teacher':
      return 'text-green-800';
    case 'root':
      return 'text-red-800';
    default:
      return 'text-gray-800';
  }
}

// 根據角色顯示中文
const getRoleDisplay = (role: string) => {
  switch (role) {
    case 'admin':
      return '管理員';
    case 'teacher':
      return '教師';
    case 'root':
      return '最高管理員';
    default:
      return role;
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-blue-500';
    case 'teacher':
      return 'bg-green-500';
    case 'root':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

const getRoleSortKey = (role: string) => {
  switch (role) {
    case 'root':
      return 0;
    case 'admin':
      return 1;
    case 'teacher':
      return 2;
    default:
      return 3;
  }
}

export default function PermissionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState("teacher")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          setCurrentUserRole(data.role)
        }
      } catch (error) {
        console.error("Error fetching current user:", error)
      }
    }

    fetchCurrentUser()
  }, [user])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        const response = await fetch('/api/users')
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '獲取用戶數據失敗')
        }
        
        const data = await response.json()
        setUsers(data.data)
      } catch (error) {
        console.error("獲取用戶數據錯誤:", error)
        toast("錯誤", {
          description: error instanceof Error ? error.message : "獲取用戶數據失敗",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchUsers()
    }
  }, [user, router])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newUserEmail) {
      toast("錯誤", {
        description: "電子郵件為必填欄位",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 檢查用戶是否已存在
      const existingUser = users.find((u) => u.email === newUserEmail)

      if (existingUser) {
        toast("錯誤", {
          description: "此電子郵件已存在",
        })
        setIsSubmitting(false)
        return
      }

      // 不允許非root用戶創建root用戶
      if (newUserRole === 'root' && currentUserRole !== 'root') {
        toast("錯誤", {
          description: "只有最高管理員可以創建其他最高管理員",
        })
        setIsSubmitting(false)
        return
      }

      // 發送請求創建新用戶
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '添加用戶失敗')
      }

      const newUser = (await response.json()).data;

      toast("成功", {
        description: "用戶已成功添加",
      })

      // 更新用戶列表
      setUsers([newUser, ...users])

      // 清空表單
      setNewUserEmail("")
      setNewUserRole("teacher")
    } catch (error: any) {
      console.error("添加用戶錯誤:", error)

      toast("錯誤", {
        description: error.message || "添加用戶時發生錯誤",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("確定要刪除這個用戶嗎？此操作無法撤銷。")) {
      return
    }

    try {
      // 發送請求刪除用戶
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '刪除用戶失敗')
      }

      // 更新用戶列表
      setUsers(users.filter((user) => user.id !== id))

      toast("成功", {
        description: "用戶已成功刪除",
      })
    } catch (error: any) {
      console.error("刪除用戶錯誤:", error)

      toast("錯誤", {
        description: error.message || "刪除用戶時發生錯誤",
      })
    }
  }

  const handleUpdateUserRole = async (id: string, newRole: string) => {
    // 檢查目標用戶的當前角色
    const targetUser = users.find(u => u.id === id);
    
    // 如果當前用戶不是管理員或root，或者目標用戶是root且當前用戶不是root，則只顯示文字
    if (
      (currentUserRole !== 'admin' && currentUserRole !== 'root') || 
      (targetUser?.role === 'root' && currentUserRole !== 'root')
    ) {
      toast("錯誤", {
        description: "只有最高管理員可以更新其他最高管理員的角色",
      });
      return;
    }
    
    // 如果當前用戶不是root，且嘗試設置root角色，阻止操作
    if (newRole === 'root' && currentUserRole !== 'root') {
      toast("錯誤", {
        description: "只有最高管理員可以將用戶設置為最高管理員",
      });
      return;
    }

    // 如果當前用戶不是root，且目標用戶是admin，且嘗試降級為teacher，阻止操作
    if (currentUserRole === 'admin' && targetUser?.role === 'admin' && newRole === 'teacher') {
      toast("錯誤", {
        description: "管理員不能將其他管理員降級為教師",
      });
      return;
    }

    try {
      // 發送請求更新用戶角色
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新用戶角色失敗')
      }

      // 更新用戶列表
      setUsers(users.map((user) => (user.id === id ? { ...user, role: newRole } : user)))

      toast("成功", {
        description: "用戶角色已成功更新",
      })
    } catch (error: any) {
      console.error("更新用戶角色錯誤:", error)

      toast("錯誤", {
        description: error.message || "更新用戶角色時發生錯誤",
      })
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "role",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            角色
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original
        
        // 如果當前用戶不是管理員或root，或者目標用戶是root且當前用戶不是root，則只顯示文字
        if (
          (currentUserRole === 'admin' && user.role === 'root') || 
          (currentUserRole === 'admin' && user.role === 'admin') || 
          (currentUserRole === 'root' && user.role === 'root') || 
          (currentUserRole === 'teacher')
        ) {
          return (
            <div className="text-center pr-4 flex justify-center items-center">
              <Badge variant="outline" className={`shadow-none px-2 py-1 text-xs font-medium rounded-full ${getRoleTextColor(user.role)} ${getRoleBgColor(user.role)}`}>
                {getRoleDisplay(user.role)}
              </Badge>
            </div>
          )
        }
        
        return (
          <div className="w-full pr-4 flex items-center justify-center">
            <Select value={user.role} onValueChange={(value: string) => handleUpdateUserRole(user.id, value)}>
              <SelectTrigger className={`w-[80px] shadow-none border focus-visible:ring-ring ${getRoleTextColor(user.role)} font-medium rounded-full text-xs px-3 py-1 h-auto`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  value="teacher" 
                  className={`${getRoleTextColor('teacher')} my-1 text-xs font-medium px-3 py-1 focus:text-green-900 focus:ring-0`}
                >
                  教師
                </SelectItem>
                <SelectItem 
                  value="admin" 
                  className={`${getRoleTextColor('admin')} my-1 text-xs font-medium px-3 py-1 focus:text-blue-900 focus:ring-0`}
                >
                  管理員
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      },
      sortingFn: (a, b) => {
        const aRole = getRoleSortKey(a.getValue("role"))
        const bRole = getRoleSortKey(b.getValue("role"))
        return aRole - bRole
      },
    },
    {
      id: "avatar",
      header: '',
      cell: ({ row }) => {
        const user = row.original
        const userInitial = (user.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()
        
        return (
          <div className="flex justify-center items-center py-2">
            <Avatar className={`h-9 w-9 ${!user.avatar_url ? getRoleColor(user.role) : ''}`}>
              <AvatarImage
                src={user.avatar_url || ''}
                alt={`${user.name || user.email} avatar`}
              />
              <AvatarFallback className={`text-white font-medium ${getRoleColor(user.role)}`}>
                {userInitial}
              </AvatarFallback>
            </Avatar>
          </div>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            帳號名稱
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2 text-center pr-4 truncate" title={row.getValue("name") || "-"}>
          {
            row.getValue("name") ?
              <p>{row.getValue("name")}</p>
            :
              <Badge variant="outline" className="text-red-500 rounded-full">未註冊</Badge>
          }
          {row.getValue('email') === user?.email && <Badge variant="outline" className="rounded-full text-gray-600">你</Badge> }
        </div>
      ),
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
      cell: ({ row }) => (
        <div className="w-full text-center pr-4 truncate" title={row.getValue("email") || "-"}>
          {row.getValue("email") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            創建時間
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center pr-4">{new Date(row.getValue("created_at")).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).replace(/(\d+)([^\d\s]+)|([^\d\s]+)(\d+)/g, '$1 $3 $2 $4') || "-"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const userRow = row.original
        
        if (userRow.id === user?.id) {
          return null;
        }

        return (
          <div className="w-full flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteUser(userRow.id)}
              disabled={currentUserRole === 'admin' && userRow.role !== 'teacher' || currentUserRole === 'teacher'}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              刪除
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">用戶權限管理</h1>
        <p className="text-muted-foreground">管理系統中的用戶及其權限</p>
      </div>
      {currentUserRole !== 'teacher' &&
        <Card className="border">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-foreground">添加新用戶</CardTitle>
            <CardDescription>添加新的用戶到系統並設置其角色</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="電子郵件"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1 border focus-visible:ring-ring"
              />
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger className={`w-[180px] shadow-none border focus-visible:ring-ring ${getRoleTextColor(newUserRole)} font-medium rounded-full text-xs px-3 py-1 h-auto`}>
                  <SelectValue placeholder="選擇角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    value="teacher" 
                    className={`${getRoleTextColor('teacher')} rounded-md my-1 text-xs font-medium px-3 py-1 focus:text-green-900 focus:ring-0`}
                  >
                    教師
                  </SelectItem>
                  <SelectItem 
                    value="admin" 
                    className={`${getRoleTextColor('admin')} rounded-md my-1 text-xs font-medium px-3 py-1 focus:text-blue-900 focus:ring-0`}
                  >
                    管理員
                  </SelectItem>
                  {currentUserRole === 'root' && (
                    <SelectItem 
                      value="root" 
                      className={`${getRoleTextColor('root')} rounded-md my-1 text-xs font-medium px-3 py-1 focus:text-red-900 focus:ring-0`}
                    >
                      最高管理員
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button variant='outline' type="submit" disabled={isSubmitting} size='sm'>
                {isSubmitting ? "添加中..." : "添加用戶"}
              </Button>
            </form>
          </CardContent>
        </Card>
      }
      <Card className="border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-foreground">用戶列表</CardTitle>
          <CardDescription>系統中所有用戶及其權限</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-sm" />
              <Skeleton className="h-[300px] w-full rounded-md" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={users} 
              initialState={{
                sorting: [
                  {
                    id: "role",
                    desc: false
                  }
                ],
                columnVisibility: {
                  actions: currentUserRole !== 'teacher'
                }
              }}
            />
          )}
        </CardContent>
      </Card>
      
    </div>
  )
}
