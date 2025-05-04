"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Check, ChevronsUpDown, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getRoleTextColor, getRoleBgColor, getRoleDisplay, getRoleSortKey, cn, getRoleHoverTextColor } from "@/lib/utils"

type User = {
  id: string
  email: string
  role: string
  created_at: string
  avatar_url: string | null
  name: string | null
  last_active?: string
  region?: string
}

// 檢查用戶是否在線 (15分鐘內有活動)
const isUserOnline = (lastActive?: string) => {
  if (!lastActive) return false;
  const lastActiveTime = new Date(lastActive).getTime();
  const currentTime = Date.now();
  return (currentTime - lastActiveTime) < 15 * 60 * 1000; // 15分鐘閾值
}

// 格式化最後活動時間為相對時間
const formatLastActive = (lastActive?: string) => {
  if (!lastActive) return '從未登入';
  
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffMs = now.getTime() - lastActiveDate.getTime();
  
  // 轉換為秒、分鐘、小時、天
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // 格式化相對時間
  if (diffMins < 5) {
    return `剛剛`;
  } else if (diffMins < 60) {
    return `${diffMins} 分鐘前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小時前`;
  } else if (diffDays < 30) {
    return `${diffDays} 天前`;
  } else {
    // 如果超過30天，顯示日期
    return lastActiveDate.toLocaleDateString('zh-TW');
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
  const [newUserRegion, setNewUserRegion] = useState("")
  const [regions, setRegions] = useState<string[]>([])
  const [newUserRegionPopoverOpen, setNewUserRegionPopoverOpen] = useState(false)

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

  useEffect(() => {
    const fetchRegions = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/regions')
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '獲取區域數據失敗')
        }
        
        const data = await response.json()
        setRegions(data.data)
      } catch (error) {
        console.error("獲取區域數據錯誤:", error)
      }
    }

    if (user) {
      fetchRegions()
    }
  }, [user])

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
          description: "只有系統管理員可以創建其他系統管理員",
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
          role: newUserRole,
          region: newUserRegion
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
      setNewUserRegion("")
    } catch (error: unknown) {
      console.error("添加用戶錯誤:", error)

      toast("錯誤", {
        description: error instanceof Error ? error.message : "添加用戶時發生錯誤",
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
    } catch (error: unknown) {
      console.error("刪除用戶錯誤:", error)

      toast("錯誤", {
        description: error instanceof Error ? error.message : "刪除用戶時發生錯誤",
      })
    }
  }

  const handleUpdateUserRole = async (id: string, newRole: string) => {
    // 檢查目標用戶的當前角色
    const targetUser = users.find(u => u.id === id);
    
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
    } catch (error: unknown) {
      console.error("更新用戶角色錯誤:", error)

      toast("錯誤", {
        description: error instanceof Error ? error.message : "更新用戶角色時發生錯誤",
      })
    }
  }

  const handleUpdateUserRegion = async (id: string, newRegion: string) => {
    // Only admins and root users can change regions
    if (currentUserRole !== 'admin' && currentUserRole !== 'root') {
      toast("錯誤", {
        description: "您沒有權限更改其他用戶的區域",
      });
      return;
    }

    try {
      // 發送請求更新用戶地區
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          region: newRegion
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新用戶地區失敗');
      }

      // 更新用戶列表
      setUsers(users.map((user) => (user.id === id ? { ...user, region: newRegion } : user)));

      // 如果是新區域，更新區域列表
      if (newRegion && !regions.includes(newRegion)) {
        setRegions([...regions, newRegion]);
      }

      toast("成功", {
        description: "用戶地區已成功更新",
      });
    } catch (error: unknown) {
      console.error("更新用戶地區錯誤:", error);

      toast("錯誤", {
        description: error instanceof Error ? error.message : "更新用戶地區時發生錯誤",
      });
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "status",
      header: "",
      cell: ({ row }) => {
        const user = row.original
        const online = isUserOnline(user.last_active)
        return (
          <div className="flex items-center pl-4">
            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          </div>
        )
      }
    },
    {
      accessorKey: "name",
      header: "",
      cell: ({ row }) => {
        const rowUser = row.original
        return (
          <div className="flex items-center gap-4 m-0 p-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={rowUser.avatar_url || ""} alt={rowUser.name || ""} />
              <AvatarFallback className={getRoleBgColor(rowUser.role)}>
                {rowUser.name ? rowUser.name.charAt(0).toUpperCase() : rowUser.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">
              {rowUser.name || rowUser.email.split('@')[0]} { rowUser.id === user?.id && '（你）' }
            </span>
          </div>
        )
      }
    },
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
        const rowUser = row.original
        
        // 如果當前用戶不是管理員或root，或者目標用戶是root且當前用戶不是root，則只顯示文字
        if (
          (currentUserRole === 'admin' && rowUser.role === 'root') || 
          (currentUserRole === 'admin' && rowUser.role === 'admin') || 
          (currentUserRole === 'root' && rowUser.role === 'root') || 
          (currentUserRole === 'teacher' || currentUserRole === 'manager' || rowUser.id === user?.id)
        ) {
          return (
            <div className="text-center pr-4 flex justify-center items-center">
              <Badge 
                variant="outline" 
                className={cn(
                  'shadow-none px-2 py-1 text-xs font-medium rounded-full',
                  getRoleTextColor(rowUser.role), 
                  getRoleBgColor(rowUser.role)
              )}>
                {getRoleDisplay(rowUser.role)}
              </Badge>
            </div>
          )
        }
        
        return (
          <div className="w-full pr-4 flex items-center justify-center">
            <Select 
              value={rowUser.role} 
              onValueChange={(value: string) => handleUpdateUserRole(rowUser.id, value)}
            >
              <SelectTrigger className={`w-[100px] shadow-none border focus-visible:ring-ring ${getRoleTextColor(rowUser.role)} font-medium rounded-full text-xs px-3 py-1 h-auto`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['teacher', 'manager', 'admin', 'root'].map((role) => (
                  <SelectItem 
                    key={role}
                    value={role}
                    className={cn(
                      'my-1 text-xs font-medium px-3 py-1 focus:ring-0', 
                      getRoleTextColor(role),
                      getRoleHoverTextColor(role)
                    )}
                  >
                    {getRoleDisplay(role)}
                  </SelectItem>
                ))}
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
      accessorKey: "email",
      header: "電子郵件",
    },
    {
      accessorKey: "region",
      header: ({ column }) => {
        return (
          <Button className="w-full rounded-none" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            地區
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original;
        const [open, setOpen] = useState(false);
        const [value, setValue] = useState(user.region || "");
        
        // Ensure each row has its own state
        useEffect(() => {
          setValue(user.region || "");
        }, [user.region]);
        
        // If not a manager, show "不適用"
        if (user.role !== 'manager') {
          return <div className="pr-4 text-muted-foreground text-sm w-full text-center">不適用</div>;
        }
        
        // Check if current user can edit this manager's region
        const canEdit = currentUserRole === 'admin' || currentUserRole === 'root';
        
        // If can't edit, just show the region as a badge
        if (!canEdit) {
          return (
            <div className="pr-4 text-center flex justify-center items-center">
              {user.region ? (
                <Badge 
                  variant="outline" 
                  className="shadow-none px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                  {user.region}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">未設定</span>
              )}
            </div>
          );
        }
        
        // For admins and roots, show the popover selector
        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="pr-4 w-[160px] ... truncate h-8 justify-between font-normal"
              >
                {value || "選擇地區"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput 
                  placeholder="搜尋或輸入新區域..." 
                  value={value}
                  onValueChange={setValue}
                />
                <CommandEmpty>
                  <div className="py-2 text-sm text-center text-muted-foreground">
                    沒有找到符合的區域
                  </div>
                  <div className="p-2 border-t">
                    <Button 
                      type="button" 
                      variant="outline"
                      size="sm"
                      className="w-full text-sm font-normal h-8"
                      onClick={() => {
                        setValue(value);
                        handleUpdateUserRegion(user.id, value);
                        setOpen(false);
                      }}
                    >
                      使用「{value || ""}」
                    </Button>
                  </div>``
                </CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-y-auto">
                  {regions.map((region) => (
                    <CommandItem
                      key={region}
                      value={region}
                      onSelect={() => {
                        const newValue = region === value ? "" : region;
                        setValue(newValue);
                        handleUpdateUserRegion(user.id, newValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === region ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {region}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        );
      }
    },
    {
      accessorKey: "last_active",
      header: "最後活動",
      cell: ({ row }) => {
        const user = row.original
        return formatLastActive(user.last_active)
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const currentUser = row.original
        const isCurrentUser = currentUser.id === user?.id
        if (isCurrentUser) {
          return null;
        }

        const isDeletable = getRoleSortKey(currentUser.role) > getRoleSortKey(currentUserRole as string);
        return (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteUser(currentUser.id)}
              disabled={!isDeletable}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">用戶權限管理</h1>
        <p className="flex items-center text-muted-foreground">管理系統中的用戶及其權限
          {
            currentUserRole !== 'teacher' &&
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-1 h-5 w-5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                  <span className="sr-only">系統白名單說明</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">系統白名單說明</h4>
                  <p className="text-sm text-muted-foreground">沒有被管理員加入的電子郵件，即使在系統註冊後也無法訪問任何系統資料。管理員需先將用戶添加至系統中才能授予訪問權限。</p>
                </div>
              </PopoverContent>
            </Popover>
          }
        </p>
        
        <div className="flex mt-1">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs gap-1 h-8"
            onClick={() => router.push('/dashboard/admin/permissions-guide')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
            查看完整權限說明
          </Button>
        </div>
      </div>
      {currentUserRole !== 'teacher' &&
        <Card className="border">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-foreground">添加新用戶</CardTitle>
            <CardDescription>添加新的用戶到系統並設置其角色。</CardDescription> 
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
                  {['teacher', 'admin', 'manager', 'root'].map((role) => {
                    if (getRoleSortKey(role) < getRoleSortKey(currentUserRole as string)) {
                      return null;
                    }
                    return (
                    <SelectItem 
                      key={role}
                      value={role}
                      className={cn(
                        getRoleTextColor(role), getRoleHoverTextColor(role)
                      )}
                    > 
                      {getRoleDisplay(role)}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Popover open={newUserRegionPopoverOpen} onOpenChange={setNewUserRegionPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={newUserRegionPopoverOpen}
                    className="w-[180px] justify-between font-normal"
                  >
                    {newUserRegion || "選擇地區"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="搜尋或輸入新區域..." 
                      value={newUserRegion}
                      onValueChange={setNewUserRegion}
                    />
                    <CommandEmpty>
                      <div className="py-2 text-sm text-center text-muted-foreground">
                        沒有找到符合的區域
                        <br />
                        系統會自動為您新增新選項
                      </div>
                    </CommandEmpty>
                    <div className="p-2 border-t">
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        className="w-full text-sm font-normal h-8"
                        onClick={() => setNewUserRegionPopoverOpen(false)}
                      >
                        使用「{newUserRegion || ""}」
                      </Button>
                    </div>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                      {regions.map((region) => (
                        <CommandItem
                          key={region}
                          value={region}
                          onSelect={() => {
                            setNewUserRegion(region === newUserRegion ? "" : region);
                            setNewUserRegionPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              newUserRegion === region ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {region}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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
                  actions: (currentUserRole !== 'teacher'),
                }
              }}
            />
          )}
        </CardContent>
      </Card>
      
    </div>
  )
}
