"use client"

import type { TaskUnassignResponse } from "@/app/api/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient, apiClientSilent } from "@/lib/api-utils"
import { cn } from "@/lib/utils"
import { ArrowLeft, Search, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

interface User {
  id: string
  name: string | null
  email: string
  region: string | null
  last_active: string | null
  role: {
    id: number
    name: string
    display_name: string
    color: string | null
    order: number
  }
}

interface TaskDetail {
  id: string
  title: string
  description: string | null
  status: string
}

interface AssignedUser {
  user_id: string
  granted_at: string
  user: {
    name: string | null
    email: string
    role: {
      display_name: string
    }
  }
}

const ROLE_COLORS = {
  'root': 'bg-red-100 text-red-800',
  'admin': 'bg-purple-100 text-purple-800',
  'manager': 'bg-blue-100 text-blue-800',
  'class-teacher': 'bg-green-100 text-green-800',
  'teacher': 'bg-yellow-100 text-yellow-800',
  'candidate': 'bg-gray-100 text-gray-800',
  'new-registrant': 'bg-orange-100 text-orange-800'
}

export default function TaskAssignPage() {
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [showAssigned, setShowAssigned] = useState(true)
  const [showUnassigned, setShowUnassigned] = useState(true)

  const [totalUsers, setTotalUsers] = useState(0)

  // Confirmation dialog states
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [userToRemove, setUserToRemove] = useState<string | null>(null)

  // Notification settings
  const [sendNotification, setSendNotification] = useState(true)

  const fetchTaskDetails = useCallback(async () => {
    try {
      const response = await apiClientSilent.get<{ task: TaskDetail }>(`/api/tasks/${taskId}`)
      const data = response.data
      setTask(data.task)
    } catch (error) {
      console.error('Failed to fetch task details:', error)
    }
  }, [taskId])

  const fetchAssignedUsers = useCallback(async () => {
    try {
      const response = await apiClientSilent.get<{ assignments: AssignedUser[] }>(`/api/tasks/${taskId}/assignments`)
      const data = response.data
      setAssignedUsers(data.assignments || [])
    } catch (error) {
      console.error('Failed to fetch assigned users:', error)
    }
  }, [taskId])

  const fetchUsers = useCallback(async () => {
    try {
      console.log('🔍 Fetching users from /api/users')
      const response = await apiClientSilent.get<{ data: User[] }>('/api/users')
      const data = response.data
      console.log('📊 Users API response:', data)
      
      // Filter to show only teachers and relevant roles (same as create task page)
      const availableUsers = data.data?.filter((u: User) => 
        ['teacher', 'candidate', 'class-teacher'].includes(u.role.name)
      ) || []
      
      console.log('👥 Filtered available users:', availableUsers.length)
      setUsers(availableUsers)
      setTotalUsers(availableUsers.length)
    } catch (error) {
      console.error('❌ Failed to fetch users:', error)
      // Set empty arrays on error to prevent infinite loading
      setUsers([])
      setTotalUsers(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails()
      fetchAssignedUsers()
      fetchUsers()
    }
  }, [taskId, fetchTaskDetails, fetchAssignedUsers, fetchUsers])

  // Filter users based on search and filter criteria (same as create task page)
  useEffect(() => {
    const assignedUserIds = new Set(assignedUsers.map(a => a.user_id))
    let filtered = users

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        (user.name?.toLowerCase().includes(search)) ||
        user.email.toLowerCase().includes(search)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role.name === roleFilter)
    }

    // Region filter
    if (regionFilter !== 'all') {
      filtered = filtered.filter(user => user.region === regionFilter)
    }

    // Assignment status filter
    filtered = filtered.filter(user => {
      const isAssigned = assignedUserIds.has(user.id)
      if (!showAssigned && isAssigned) return false
      if (!showUnassigned && !isAssigned) return false
      return true
    })

    // Sort by assignment status: assigned users first, then unassigned users
    filtered.sort((a, b) => {
      const aAssigned = assignedUserIds.has(a.id)
      const bAssigned = assignedUserIds.has(b.id)
      
      if (aAssigned && !bAssigned) return -1  // a is assigned, b is not -> a comes first
      if (!aAssigned && bAssigned) return 1   // a is not assigned, b is -> b comes first
      return 0  // both have same status, maintain original order
    })

    console.log('🔍 Client-side filtering and sorting:', {
      totalUsers: users.length,
      afterSearch: searchTerm ? filtered.length : users.length,
      afterRole: roleFilter !== 'all' ? filtered.length : 'not applied',
      afterRegion: regionFilter !== 'all' ? filtered.length : 'not applied',
      afterAssignment: filtered.length,
      showAssigned,
      showUnassigned,
      sortedByAssignment: true
    })

    setFilteredUsers(filtered)
  }, [users, assignedUsers, searchTerm, roleFilter, regionFilter, showAssigned, showUnassigned])

  // Fetch regions for filter
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await apiClientSilent.get<{ data: string[] }>('/api/regions')
        const data = response.data
        setRegions(data.data || [])
      } catch (error) {
        console.error('Failed to fetch regions:', error)
      }
    }

    fetchRegions()
  }, [])

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  // 檢查選中的用戶中是否有已分配的用戶
  const hasAssignedUsersSelected = Array.from(selectedUsers).some(userId => 
    assignedUsers.some(a => a.user_id === userId)
  )

  // 檢查選中的用戶中是否有未分配的用戶
  const hasUnassignedUsersSelected = Array.from(selectedUsers).some(userId => 
    !assignedUsers.some(a => a.user_id === userId)
  )

  const handleSelectAll = () => {
    const allFilteredIds = new Set(filteredUsers.map(u => u.id))
    const hasAllSelected = filteredUsers.every(u => selectedUsers.has(u.id))
    
    if (hasAllSelected) {
      // Deselect all filtered users
      const newSelected = new Set(selectedUsers)
      filteredUsers.forEach(u => newSelected.delete(u.id))
      setSelectedUsers(newSelected)
    } else {
      // Select all filtered users
      setSelectedUsers(new Set([...Array.from(selectedUsers), ...Array.from(allFilteredIds)]))
    }
  }

  const handleAssignUsers = async () => {
    if (selectedUsers.size === 0) {
      toast.error('請選擇要分配的用戶')
      return
    }

    // 只分配未分配的用戶
    const unassignedUserIds = Array.from(selectedUsers).filter(userId => 
      !assignedUsers.some(a => a.user_id === userId)
    )

    if (unassignedUserIds.length === 0) {
      toast.error('選中的用戶都已經分配了任務')
      return
    }

    setSaving(true)
    try {
      await apiClient.post(`/api/tasks/${taskId}/assign`, {
        user_ids: unassignedUserIds,
        send_notification: sendNotification
      })
      
      await fetchAssignedUsers()
      setSelectedUsers(new Set())
    } catch (error) {
      console.error('Error assigning task:', error)
      // Error handling is now managed by apiClient with toast notifications
    } finally {
      setSaving(false)
    }
  }

  const handleUnassignUsers = async () => {
    if (selectedUsers.size === 0) {
      toast.error('請選擇要取消分配的用戶')
      return
    }

    setShowUnassignConfirm(true)
  }

  const confirmUnassignUsers = async () => {
    setSaving(true)
    try {
      await apiClient.delete<TaskUnassignResponse>(`/api/tasks/${taskId}/assign`, {
        data: { user_ids: Array.from(selectedUsers) }
      })
      
      await fetchAssignedUsers()
      setSelectedUsers(new Set())
      setShowUnassignConfirm(false)
    } catch (error) {
      console.error('Error unassigning task:', error)
      toast.error('取消分配失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    setUserToRemove(userId)
    setShowRemoveConfirm(true)
  }

  const confirmRemoveUser = async () => {
    if (!userToRemove) return

    try {
      await apiClient.delete(`/api/tasks/${taskId}/assign`, {
        data: {
          user_ids: [userToRemove]
        }
      })
      
      await fetchAssignedUsers()
      setShowRemoveConfirm(false)
      setUserToRemove(null)
    } catch (error) {
      console.error('Error removing assignment:', error)
      // Error handling is now managed by apiClient with toast notifications
    }
  }

  const isUserAssigned = (userId: string) => {
    return assignedUsers.some(a => a.user_id === userId)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">任務不存在</h1>
        <Link href="/dashboard/admin/tasks">
          <Button>返回任務列表</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/admin/tasks/${taskId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回任務詳情
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">任務分配</h1>
        <p className="text-muted-foreground">為「{task.title}」分配執行人員</p>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">用戶列表</CardTitle>
              <CardDescription>
                共 {totalUsers} 位可分配用戶，目前顯示 {filteredUsers.length} 位 • 已分配: {assignedUsers.length} 人 • 已選擇: {selectedUsers.size} 人
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filters and Actions Row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋用戶（姓名或電子郵件）"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="角色篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="teacher">大學伴</SelectItem>
                <SelectItem value="candidate">儲備大學伴</SelectItem>
                <SelectItem value="class-teacher">帶班老師</SelectItem>
                <SelectItem value="manager">學校負責人</SelectItem>
              </SelectContent>
            </Select>

            {/* Region Filter */}
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="地區篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部地區</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Assignment Status Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-assigned"
                  checked={showAssigned}
                  onCheckedChange={(checked) => setShowAssigned(checked === true)}
                />
                <Label htmlFor="show-assigned" className="text-sm">已分配</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-unassigned"
                  checked={showUnassigned}
                  onCheckedChange={(checked) => setShowUnassigned(checked === true)}
                />
                <Label htmlFor="show-unassigned" className="text-sm">未分配</Label>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-3 mr-4">
              <Switch
                id="send-notification"
                checked={sendNotification}
                onCheckedChange={setSendNotification}
              />
              <Label htmlFor="send-notification" className="text-sm font-medium">
                分配時發送通知郵件
              </Label>
            </div>
            
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              disabled={filteredUsers.length === 0}
            >
              {filteredUsers.every(u => selectedUsers.has(u.id)) ? '取消全選' : '全選當前頁'}
            </Button>
            
            <Button
              onClick={handleAssignUsers}
              size="sm"
              disabled={!hasUnassignedUsersSelected || saving}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              分配任務 ({Array.from(selectedUsers).filter(userId => 
                !assignedUsers.some(a => a.user_id === userId)
              ).length})
            </Button>

            <Button
              onClick={handleUnassignUsers}
              variant="destructive"
              size="sm"
              disabled={!hasAssignedUsersSelected || saving}
            >
              取消分配 ({Array.from(selectedUsers).filter(userId => 
                assignedUsers.some(a => a.user_id === userId)
              ).length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('all')
                setRegionFilter('all')
                setShowAssigned(true)
                setShowUnassigned(true)
              }}
            >
              清除篩選
            </Button>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u.id))}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-20">分配狀態</TableHead>
                <TableHead>用戶</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>地區</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const assigned = isUserAssigned(user.id)
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {assigned ? (
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full" title="已分配"></div>
                        ) : (
                          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" title="未分配"></div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs hover:no-underline", ROLE_COLORS[user.role.name as keyof typeof ROLE_COLORS] || "bg-gray-100 text-gray-800")}>
                        {user.role.display_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.region || '未設定'}</span>
                    </TableCell>
                    <TableCell>
                      {assigned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          取消分配
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={async () => {
                            setSaving(true)
                            try {
                              await apiClient.post(`/api/tasks/${taskId}/assign`, {
                                user_ids: [user.id],
                                send_notification: sendNotification
                              })
                              await fetchAssignedUsers()
                            } catch (error) {
                              console.error('Error assigning task:', error)
                              // Error handling is now managed by apiClient with toast notifications
                            } finally {
                              setSaving(false)
                            }
                          }}
                          disabled={saving}
                        >
                          立即分配
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">沒有符合條件的用戶</h3>
              <p className="text-muted-foreground">
                請調整篩選條件以查看更多用戶
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showUnassignConfirm}
        title="取消任務分配"
        description={`確定要取消 ${selectedUsers.size} 位用戶的任務分配嗎？`}
        confirmText="取消分配"
        cancelText="保留分配"
        variant="destructive"
        onConfirm={confirmUnassignUsers}
        onCancel={() => setShowUnassignConfirm(false)}
        loading={saving}
      />

      <ConfirmDialog
        open={showRemoveConfirm}
        title="取消任務分配"
        description="確定要取消此用戶的任務分配嗎？"
        confirmText="取消分配"
        cancelText="保留分配"
        variant="destructive"
        onConfirm={confirmRemoveUser}
        onCancel={() => {
          setShowRemoveConfirm(false)
          setUserToRemove(null)
        }}
        loading={saving}
      />
    </div>
  )
}
