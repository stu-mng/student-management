"use client"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, apiClientSilent } from "@/lib/api-utils"
import { cn } from "@/lib/utils"
import { ArrowLeft, ImageIcon, Plus, Save, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface TaskRequirement {
  id: string
  name: string
  type: 'file' | 'text' | 'textarea'
  required: boolean
  description?: string
  help_image_url?: string
  upload_folder_id?: string | null
}

interface TaskDetail {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'active' | 'inactive' | 'archived'
  submission_deadline: string | null
  created_at: string
  help_image_folder_id?: string
  requirements: TaskRequirement[]
}

interface TaskFormData {
  title: string
  description: string
  submission_deadline: Date | undefined
  requirements: TaskRequirement[]
}

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    submission_deadline: undefined,
    requirements: []
  })

  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await apiClientSilent.get<{ task: TaskDetail }>(`/api/tasks/${taskId}`)
        const taskData = response.data.task
        setTask(taskData)
        
        // Populate form data
        setFormData({
          title: taskData.title,
          description: taskData.description || '',
          submission_deadline: taskData.submission_deadline ? new Date(taskData.submission_deadline) : undefined,
          requirements: taskData.requirements || []
        })
      } catch (error) {
        console.error('Failed to fetch task:', error)
        toast.error('無法載入任務資料')
        router.push('/dashboard/admin/tasks')
      } finally {
        setLoading(false)
      }
    }

    if (taskId) {
      fetchTask()
    }
  }, [taskId, router])

  const addRequirement = () => {
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

  const handleImageUpload = async (requirementId: string, file: File) => {
    setUploadingImages(prev => ({ ...prev, [requirementId]: true }))

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      // Use the existing help image folder
      if (!task?.help_image_folder_id) {
        throw new Error('找不到提示圖片資料夾')
      }
      
      uploadFormData.append('parentFolderId', task.help_image_folder_id)
      
      const response = await apiClient.post<{ success: boolean; file: { id: string } }>('/api/drive/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const result = response.data
      const uploadedFile = result.file
      const imageUrl = `/api/drive/image/${uploadedFile.id}`
      
      updateRequirement(requirementId, { help_image_url: imageUrl })
    } catch (error) {
      console.error('Image upload error:', error)
      // Error handling is now managed by apiClient with toast notifications
    } finally {
      setUploadingImages(prev => ({ ...prev, [requirementId]: false }))
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('請輸入任務標題')
      return
    }

    setSaving(true)
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        submission_deadline: formData.submission_deadline?.toISOString(),
        requirements: formData.requirements.filter(req => req.name.trim())
      }

      // 使用 PATCH 方法更新任务，不改变任务状态
      await apiClient.patch(`/api/tasks/${taskId}`, payload)
      
      toast.success('任務更新成功')
      router.push('/dashboard/admin/tasks')
    } catch (error) {
      console.error('Error updating task:', error)
      // Error handling is now managed by apiClient with toast notifications
    } finally {
      setSaving(false)
    }
  }

  // 移除 handlePublish 函數

  // Delete task function
  const handleDeleteTask = async () => {
    setIsDeleting(true)
    try {
      await apiClientSilent.delete(`/api/tasks/${taskId}`)
      
      toast.success('任務刪除成功')
      router.push('/dashboard/admin/tasks')
    } catch (error: unknown) {
      console.error('Failed to delete task:', error)
      
      // Handle specific error messages
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } }
        if (apiError.response?.data?.error) {
          toast.error(apiError.response.data.error)
        } else {
          toast.error('刪除任務失敗')
        }
      } else {
        toast.error('刪除任務失敗')
      }
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        
        {/* Content Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">找不到任務</h3>
            <p className="text-muted-foreground mb-4">請檢查任務 ID 是否正確</p>
            <Link href="/dashboard/admin/tasks">
              <Button variant="outline">返回任務列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
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
            <h1 className="text-2xl font-bold tracking-tight">編輯任務</h1>
            <p className="text-muted-foreground text-sm mt-1">
              修改任務內容和要求
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/admin/tasks/${taskId}`)}
          >
            取消
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '儲存中...' : '儲存變更'}
          </Button>
          {/* Delete button - only show for draft tasks */}
          {task.status === 'draft' && (
            <Button 
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={saving || isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              刪除
            </Button>
          )}
        </div>
      </div>

      {/* Task Status Info */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge className={cn(
                task.status === 'draft' && "bg-gray-100 text-gray-800",
                task.status === 'active' && "bg-green-100 text-green-800",
                task.status === 'inactive' && "bg-yellow-100 text-yellow-800",
                task.status === 'archived' && "bg-gray-100 text-gray-600"
              )}>
                {task.status === 'draft' && '草稿'}
                {task.status === 'active' && '進行中'}
                {task.status === 'inactive' && '關閉'}
                {task.status === 'archived' && '已封存'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                創建於 {new Date(task.created_at).toLocaleDateString('zh-TW')}
              </span>
            </div>
            {task.status === 'active' && (
              <span className="text-sm text-amber-600 font-medium">
                ⚠️ 此任務正在進行中，修改可能影響已提交的回應
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>基本資訊</CardTitle>
          <CardDescription>修改任務的基本資訊和截止時間</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title">任務標題 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="例如：期末教學檔案上傳"
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="description">任務描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="詳細說明任務內容和要求..."
              className="mt-2"
              rows={4}
            />
          </div>
          
          <div>
            <Label>截止時間</Label>
            <DatePicker
              value={formData.submission_deadline}
              onChange={(date) => setFormData(prev => ({ ...prev, submission_deadline: date }))}
              className="mt-2"
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
              <CardDescription>修改完成任務需要提交的項目</CardDescription>
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
            <div className="space-y-6">
              {formData.requirements.map((requirement, index) => (
                <div key={requirement.id} className="border rounded-lg p-6 space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm">要求 {index + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRequirement(requirement.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">項目名稱</Label>
                      <Input
                        value={requirement.name}
                        onChange={(e) => updateRequirement(requirement.id, { name: e.target.value })}
                        placeholder="例如：教學計畫"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">類型</Label>
                      <Select
                        value={requirement.type}
                        onValueChange={(value: 'file' | 'text' | 'textarea') => 
                          updateRequirement(requirement.id, { type: value })
                        }
                      >
                        <SelectTrigger className="mt-2">
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
                    <Label className="text-sm font-medium">說明</Label>
                    <Textarea
                      value={requirement.description || ''}
                      onChange={(e) => updateRequirement(requirement.id, { description: e.target.value })}
                      placeholder="請說明這個項目的具體要求..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Help Image Upload */}
                  <div>
                    <Label className="text-sm font-medium">提示圖片</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={requirement.help_image_url || ''}
                        onChange={(e) => updateRequirement(requirement.id, { help_image_url: e.target.value })}
                        placeholder="或貼上圖片 URL"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingImages[requirement.id]}
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                              await handleImageUpload(requirement.id, file)
                            }
                          }
                          input.click()
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        {uploadingImages[requirement.id] ? '上傳中...' : '上傳圖片'}
                      </Button>
                    </div>
                    {requirement.help_image_url && (
                      <div className="mt-3">
                        <Image
                          src={requirement.help_image_url}
                          alt="提示圖片"
                          width={200}
                          height={100}
                          className="h-auto max-h-32 w-auto rounded border shadow-sm"
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
                    <Label htmlFor={`required-${requirement.id}`} className="text-sm font-medium">
                      必填項目
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? '儲存中...' : '儲存變更'}
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="確認刪除任務"
        description={`確定要刪除任務「${task.title}」嗎？\n\n⚠️ 此操作無法撤銷！\n• 任務及其所有相關資料將被永久刪除\n• 所有用戶的回覆和提交記錄也將被刪除\n• 包括草稿、已提交和已審核的回覆`}
        confirmText="刪除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteTask}
        onCancel={() => setIsDeleteDialogOpen(false)}
        loading={isDeleting}
      />
    </div>
  )
}
