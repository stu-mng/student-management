"use client"

import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, apiClientSilent } from "@/lib/api-utils"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, CheckCircle, Filter, Plus, Search, Send, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface User {
  id: string
  name: string | null
  email: string
  region: string | null
  role: {
    id: number
    name: string
    display_name: string
    color: string | null
    order: number
  }
}

interface TaskRequirement {
  id: string
  name: string
  type: 'file' | 'text' | 'textarea'
  required: boolean
  description?: string
  help_image_url?: string
}

interface TaskFormData {
  title: string
  description: string
  submission_deadline: Date | undefined
  assignees: string[]
  requirements: TaskRequirement[]
}

export default function NewTaskPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [draftTaskId, setDraftTaskId] = useState<string | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    submission_deadline: undefined,
    assignees: [],
    requirements: []
  })

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClientSilent.get<{ data: User[] }>('/api/users')
        const data = response.data
        // Filter to show only teachers and relevant roles  
        const availableUsers = data.data?.filter((u: User) => 
          ['teacher', 'candidate', 'class-teacher'].includes(u.role.name)
        ) || []
        setUsers(availableUsers)
        setFilteredUsers(availableUsers)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }

    if (currentStep === 2) {
      fetchUsers()
    }
  }, [currentStep])

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

    if (currentStep === 2) {
      fetchRegions()
    }
  }, [currentStep])

  // Filter users based on search and filter criteria
  useEffect(() => {
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

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, regionFilter])

  const addRequirement = () => {
    console.log('addRequirement called')
    const newRequirement: TaskRequirement = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
      required: false,
      description: '',
      help_image_url: ''
    }
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, newRequirement]
    }))
  }

  const updateRequirement = (id: string, updates: Partial<TaskRequirement>) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map(req => 
        req.id === id ? { ...req, ...updates } : req
      )
    }))
  }

  const removeRequirement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req.id !== id)
    }))
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(userId)) {
        newSelected.delete(userId)
      } else {
        newSelected.add(userId)
      }
      return newSelected
    })
  }

  const selectAllUsers = () => {
    setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
  }

  const clearUserSelection = () => {
    setSelectedUsers(new Set())
  }

  // Step 1: Save draft and proceed to step 2
  const handleStep1Next = async () => {
    if (!formData.title.trim()) {
      toast.error('請輸入任務標題')
      return
    }

    setLoading(true)
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        submission_deadline: formData.submission_deadline?.toISOString(),
        assignees: [], // No assignees at this step
        requirements: formData.requirements.filter(req => req.name.trim())
      }

      const response = await apiClient.post<{ task: { id: string } }>('/api/tasks', payload)
      const data = response.data
      setDraftTaskId(data.task.id)
      setCurrentStep(2)
    } catch (error) {
      console.error('Error creating task:', error)
      // Error handling is now managed by apiClient with toast notifications
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Assign users and publish
  const handleAssignAndPublish = async () => {
    if (!draftTaskId) {
      // Error handling is now managed by apiClient with toast notifications
      return
    }

    setLoading(true)

    try {
      // Assign users to task
      if (selectedUsers.size > 0) {
        await apiClient.post(`/api/tasks/${draftTaskId}/assign`, {
          user_ids: Array.from(selectedUsers)
        })
      }

      // Publish the task
      await apiClient.patch(`/api/tasks/${draftTaskId}`, { status: 'active' })
      router.push('/dashboard/admin/tasks')
    } catch (error) {
      console.error('Error publishing task:', error)
      // Error handling is now managed by apiClient with toast notifications
    } finally {
      setLoading(false)
    }
  }

  const requirementTypeLabels = {
    text: '單行文字',
    textarea: '多行文字',
    file: '檔案上傳'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/admin/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回任務列表
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">新增任務</h1>
            <p className="text-muted-foreground">
              {currentStep === 1 ? '建立任務內容和要求' : '分配執行人員並發布'}
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Step 1 */}
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              )}>
                {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : "1"}
              </div>
              <span className={cn(
                "text-sm font-medium",
                currentStep === 1 ? "text-blue-600" : currentStep > 1 ? "text-green-600" : "text-gray-400"
              )}>
                設定任務內容
              </span>
            </div>

            {/* Separator */}
            <div className={cn(
              "w-12 h-0.5",
              currentStep > 1 ? "bg-green-600" : "bg-gray-200"
            )} />

            {/* Step 2 */}
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              )}>
                2
              </div>
              <span className={cn(
                "text-sm font-medium",
                currentStep === 2 ? "text-blue-600" : "text-gray-400"
              )}>
                分配用戶並發布
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentStep === 1 ? (
        <>
          {/* Step 1: Task Configuration */}
          <div className="space-y-6">
            {/* Main Form */}
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>基本資訊</CardTitle>
                  <CardDescription>設定任務的基本資訊和截止時間</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">任務標題 *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="例如：期末教學檔案上傳"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">任務描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="詳細說明任務內容和要求..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label>截止時間</Label>
                    <DatePicker
                      value={formData.submission_deadline}
                      onChange={(date) => setFormData(prev => ({ ...prev, submission_deadline: date }))}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Task Requirements */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>任務要求</CardTitle>
                      <CardDescription>定義完成任務需要提交的項目</CardDescription>
                    </div>
                    <Button type="button" onClick={addRequirement} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      新增要求
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {formData.requirements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>還沒有任務要求</p>
                      <p className="text-sm">點擊「新增要求」來添加第一個要求項目</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.requirements.map((requirement, index) => (
                        <div key={requirement.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">要求 {index + 1}</Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRequirement(requirement.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>項目名稱</Label>
                              <Input
                                value={requirement.name}
                                onChange={(e) => updateRequirement(requirement.id, { name: e.target.value })}
                                placeholder="例如：教學計畫"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label>類型</Label>
                              <Select
                                value={requirement.type}
                                onValueChange={(value: 'file' | 'text' | 'textarea') => 
                                  updateRequirement(requirement.id, { type: value })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">單行文字</SelectItem>
                                  <SelectItem value="textarea">多行文字</SelectItem>
                                  <SelectItem value="file">檔案上傳</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Label>說明</Label>
                            <Textarea
                              value={requirement.description || ''}
                              onChange={(e) => updateRequirement(requirement.id, { description: e.target.value })}
                              placeholder="請說明這個項目的具體要求..."
                              className="mt-1"
                              rows={2}
                            />
                          </div>

                          {/* Help Image Upload */}
                          <div>
                            <Label>提示圖片</Label>
                            <div className="mt-1">
                              <p className="text-sm text-muted-foreground mb-2">
                                創建任務後，您可以在編輯頁面上傳提示圖片來幫助用戶更好地理解任務要求。
                              </p>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={requirement.help_image_url || ''}
                                  onChange={(e) => updateRequirement(requirement.id, { help_image_url: e.target.value })}
                                  placeholder="或貼上圖片 URL"
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            {requirement.help_image_url && (
                              <div className="mt-2">
                                <Image
                                  src={requirement.help_image_url}
                                  alt="提示圖片"
                                  width={200}
                                  height={100}
                                  className="h-auto max-h-24 w-auto rounded border"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${requirement.id}`}
                              checked={requirement.required}
                              onCheckedChange={(checked) => 
                                updateRequirement(requirement.id, { required: checked as boolean })
                              }
                            />
                            <Label htmlFor={`required-${requirement.id}`}>必填項目</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Next Step Button */}
          <div className="pt-6">
            <Button
              type="button"
              onClick={handleStep1Next}
              className="w-full"
              disabled={loading}
              size="lg"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              {loading ? '準備中...' : '下一步：分配用戶並發布'}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              下一步將進入用戶分配和發布流程
            </p>
          </div>
        </>
      ) : (
        /* Step 2: User Assignment and Publishing */
        <div className="space-y-6">
          {/* Task Summary */}
          <Card>
            <CardHeader>
              <CardTitle>任務概要</CardTitle>
              <CardDescription>確認任務資訊後進行用戶分配</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">任務標題：</span>
                  <span className="text-muted-foreground ml-2">{formData.title}</span>
                </div>
                <div>
                  <span className="font-medium">截止時間：</span>
                  <span className="text-muted-foreground ml-2">
                    {formData.submission_deadline ? 
                      formData.submission_deadline.toLocaleDateString('zh-TW') : 
                      '未設定'
                    }
                  </span>
                </div>
                <div>
                  <span className="font-medium">要求項目：</span>
                  <span className="text-muted-foreground ml-2">{formData.requirements.length} 個</span>
                </div>
                <div>
                  <span className="font-medium">已選擇人員：</span>
                  <span className="text-muted-foreground ml-2">{selectedUsers.size} 人</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Filter className="h-4 w-4 mr-2" />
                  篩選條件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <Label htmlFor="search">搜尋用戶</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="姓名或電子郵件"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <div>
                  <Label>角色篩選</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部角色</SelectItem>
                      <SelectItem value="teacher">大學伴</SelectItem>
                      <SelectItem value="candidate">儲備大學伴</SelectItem>
                      <SelectItem value="class-teacher">帶班老師</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Region Filter */}
                <div>
                  <Label>地區篩選</Label>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
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
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setRoleFilter('all')
                    setRegionFilter('all')
                  }}
                  className="w-full"
                >
                  清除篩選
                </Button>
              </CardContent>
            </Card>

            {/* User Table */}
            <div className="lg:col-span-3 space-y-4">
              {/* Selection Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">
                        已選擇 {selectedUsers.size} / {filteredUsers.length} 人
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllUsers}
                          disabled={filteredUsers.length === 0}
                        >
                          全選
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearUserSelection}
                          disabled={selectedUsers.size === 0}
                        >
                          清除選擇
                        </Button>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        返回編輯
                      </Button>
                      <Button
                        onClick={handleAssignAndPublish}
                        disabled={loading}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {loading ? '發布中...' : '分配並發布'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">選擇</TableHead>
                        <TableHead>姓名</TableHead>
                        <TableHead>電子郵件</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>地區</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            沒有符合條件的用戶
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.has(user.id)}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {user.name || '-'}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {user.role.display_name}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.region || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}