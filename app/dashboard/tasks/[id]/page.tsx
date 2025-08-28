"use client"

import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, apiClientSilent } from "@/lib/api-utils"
import { cn } from "@/lib/utils"
import { AlertTriangle, Calendar, CheckCircle, Edit, Plus, Upload } from "lucide-react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface MyTask {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'active' | 'inactive' | 'archived'
  submission_deadline: string | null
  created_at: string
  creator: {
    name: string | null
    email: string
  }
  requirements: {
    id: string
    name: string
    type: 'file' | 'text' | 'textarea'
    required: boolean
    description?: string
    upload_folder_id?: string | null
    help_image_url?: string | null
  }[]
  my_response?: {
    id: string
    submission_status: 'draft' | 'submitted' | 'reviewed' | 'approved'
    submitted_at: string | null
    responses: Record<string, string | null>
  }
}

const statusColors = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-800",
  reviewed: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800"
}

const statusLabels = {
  draft: "草稿",
  submitted: "已提交",
  reviewed: "已審核",
  approved: "已核准"
}

export default function TaskDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<MyTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { id: string; name: string }>>({})
  const [editingResponse, setEditingResponse] = useState(false)
  const [showResubmitOptions, setShowResubmitOptions] = useState(false)

  const handleEditResponse = () => {
    setEditingResponse(true)
    setShowResubmitOptions(false)
    // 載入現有的回應數據
    if (task?.my_response?.responses) {
      // 轉換 null 值為空字符串以匹配 responses 狀態類型
      const responsesData: Record<string, string> = {}
      Object.entries(task.my_response.responses).forEach(([fieldId, value]) => {
        responsesData[fieldId] = value || ''
      })
      setResponses(responsesData)
      
      // 載入已上傳的文件信息
      const files: Record<string, { id: string; name: string }> = {}
      Object.entries(task.my_response.responses).forEach(([fieldId, value]) => {
        if (value) {
          // 這裡需要根據 fieldId 找到對應的 requirement 來判斷是否為文件類型
          const requirement = task.requirements.find(req => req.id === fieldId)
          if (requirement?.type === 'file' && value) {
            // 從 Google Drive 獲取文件信息
            // 暫時使用一個簡單的映射，實際實現中可能需要調用 API
            files[fieldId] = { id: value, name: `文件 ${value.substring(0, 8)}...` }
          }
        }
      })
      setUploadedFiles(files)
    }
  }

  const handleNewResponse = () => {
    setEditingResponse(true)
    setShowResubmitOptions(false)
    // 清空所有回應和文件
    setResponses({})
    setUploadedFiles({})
  }

  const handleCancelEdit = () => {
    setEditingResponse(false)
    // 恢復原始回應數據
    if (task?.my_response?.responses) {
      // 轉換 null 值為空字符串以匹配 responses 狀態類型
      const responsesData: Record<string, string> = {}
      Object.entries(task.my_response.responses).forEach(([fieldId, value]) => {
        responsesData[fieldId] = value || ''
      })
      setResponses(responsesData)
      
      // 恢復已上傳的文件信息
      const files: Record<string, { id: string; name: string }> = {}
      Object.entries(task.my_response.responses).forEach(([fieldId, value]) => {
        if (value) {
          const requirement = task.requirements.find(req => req.id === fieldId)
          if (requirement?.type === 'file' && value) {
            files[fieldId] = { id: value, name: `文件 ${value.substring(0, 8)}...` }
          }
        }
      })
      setUploadedFiles(files)
    }
  }

  // Fetch task detail
  const fetchTaskDetail = useCallback(async () => {
    try {
      const response = await apiClientSilent.get<{ task: MyTask }>(`/api/tasks/${taskId}`)
      const data = response.data
      setTask(data.task)
      
      // 如果有現有回應，載入到狀態中
      if (data.task.my_response?.responses) {
        const responsesData: Record<string, string> = {}
        Object.entries(data.task.my_response.responses).forEach(([fieldId, value]) => {
          responsesData[fieldId] = value || ''
        })
        setResponses(responsesData)
        
        // 載入已上傳的文件信息
        const files: Record<string, { id: string; name: string }> = {}
        Object.entries(data.task.my_response.responses).forEach(([fieldId, value]) => {
          if (value) {
            const requirement = data.task.requirements.find(req => req.id === fieldId)
            if (requirement?.type === 'file' && value) {
              files[fieldId] = { id: value, name: `文件 ${value.substring(0, 8)}...` }
            }
          }
        })
        setUploadedFiles(files)
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    if (taskId) {
      fetchTaskDetail()
    }
  }, [taskId, fetchTaskDetail])

  const handleResponseChange = (requirementId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [requirementId]: value
    }))
  }

  const handleFileUpload = async (requirementId: string, file: File, uploadFolderId: string) => {
    setUploading(prev => ({ ...prev, [requirementId]: true }))
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('parentFolderId', uploadFolderId)
      if (user?.name) {
        formData.append('username', user.name)
      }

      const response = await apiClient.post<{ success: boolean; file?: { id: string } }>('/api/drive/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const result = response.data
      if (result.success && result.file) {
        // Store the file ID in responses
        handleResponseChange(requirementId, result.file.id)
        setUploadedFiles(prev => ({ ...prev, [requirementId]: { id: result.file!.id, name: file.name } }))
      }
    } catch (error) {
      console.error('File upload error:', error)
      // Error handling is now managed by apiClient with toast notifications
    } finally {
      setUploading(prev => ({ ...prev, [requirementId]: false }))
    }
  }

  const handleSubmit = async () => {
    if (!task) return

    setSubmitting(true)
    try {
      const payload = {
        task_id: task.id,
        responses: responses,
        submission_status: 'submitted'
      }

      await apiClient.post('/api/tasks/submit', payload)
      
      // Refresh task data
      await fetchTaskDetail()
      
      setEditingResponse(false)
    } catch (error) {
      console.error('Error submitting task:', error)
      // Error handling is now managed by apiClient with toast notifications
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "無截止期限"
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false
    return new Date(dateString) < new Date()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
        
        {/* Task Form Skeleton */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">找不到任務</h3>
            <p className="text-muted-foreground mb-4">此任務不存在或您沒有權限查看</p>
            <Button onClick={() => router.push('/dashboard/tasks')}>
              返回任務列表
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const responseStatus = task?.my_response?.submission_status || 'draft'
  const isSubmitted = responseStatus === 'submitted'
  const isOverdueTask = task?.submission_deadline ? isOverdue(task.submission_deadline) : false

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard/tasks')}
            className="mb-2"
          >
            ← 返回
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <Badge className={cn("shrink-0", statusColors[responseStatus])}>
              {statusLabels[responseStatus]}
            </Badge>
          </div>
          {task.description && (
            <p className="text-muted-foreground mt-1">{task.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">截止時間</p>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <p className={cn(
              "font-medium",
              isOverdueTask ? "text-red-600" : ""
            )}>
              {formatDate(task.submission_deadline)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            由 {task.creator.name || task.creator.email} 指派
          </p>
        </div>
      </div>

      {/* 已提交狀態顯示 */}
      {isSubmitted && !editingResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-5 w-5 text-green-500" />
              任務已完成
            </CardTitle>
            <CardDescription className="text-base">
              您已成功提交此任務
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">任務提交成功！</h3>
              <p className="text-muted-foreground mb-6">
                您的任務回應已成功記錄，我們會盡快處理。
              </p>
              
              {isOverdueTask ? (
                <div className="flex items-center justify-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 mb-6">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 font-medium">
                    任務截止時間已過，無法進行編輯或重新提交
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* 編輯回應按鈕 */}
                  <Button
                    variant="outline"
                    onClick={handleEditResponse}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    編輯回應
                  </Button>
                  
                  {/* 重新填寫按鈕 */}
                  <Button
                    onClick={handleNewResponse}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    重新填寫
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Form - 只在編輯模式或未提交時顯示 */}
      {(editingResponse || !isSubmitted) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingResponse ? '編輯任務回應' : '任務要求'}
            </CardTitle>
            <CardDescription>
              {editingResponse ? '請修改以下項目' : '請完成以下項目'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {task.requirements.map((requirement) => (
              <div key={requirement.id} className="space-y-2">
                <Label htmlFor={requirement.id} className="flex items-center space-x-2">
                  <span>{requirement.name}</span>
                  {requirement.required && (
                    <Badge variant="destructive" className="text-xs">必填</Badge>
                  )}
                </Label>
                
                {requirement.description && (
                  <p className="text-sm text-muted-foreground">{requirement.description}</p>
                )}
                
                {/* Help Image */}
                {requirement.help_image_url && (
                  <div className="mt-2">
                    <div className="relative min-w-48 h-48 rounded-lg border shadow-sm bg-muted/10 overflow-hidden">
                      <Image
                        src={requirement.help_image_url}
                        alt={`${requirement.name} 提示圖片`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
                
                {requirement.type === 'file' ? (
                  <div className="space-y-4">
                    {/* Uploaded file display */}
                    {uploadedFiles[requirement.id] && (
                      <Card className="p-4">
                        <CardContent className="p-0">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-foreground bg-muted/20 px-2 py-1 rounded">
                              檔案名稱: {uploadedFiles[requirement.id]?.name}
                            </div>
                            <div className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded">
                              檔案 ID: {uploadedFiles[requirement.id]?.id}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Upload section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">拖拽檔案到此處或點擊上傳</p>
                      <Input 
                        type="file" 
                        className="hidden" 
                        id={requirement.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file && requirement.upload_folder_id) {
                            handleFileUpload(requirement.id, file, requirement.upload_folder_id)
                          } else if (!requirement.upload_folder_id) {
                            // Error handling is now managed by apiClient with toast notifications
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.getElementById(requirement.id)?.click()}
                        disabled={uploading[requirement.id] || !requirement.upload_folder_id}
                      >
                        {uploading[requirement.id] ? '上傳中...' : '選擇檔案'}
                      </Button>
                      {!requirement.upload_folder_id && (
                        <p className="text-sm text-red-600 mt-2">上傳資料夾未設定</p>
                      )}
                    </div>
                  </div>
                ) : requirement.type === 'textarea' ? (
                  <Textarea
                    id={requirement.id}
                    value={responses[requirement.id] || ''}
                    onChange={(e) => handleResponseChange(requirement.id, e.target.value)}
                    placeholder="請輸入回應..."
                    rows={4}
                  />
                ) : (
                  <Input
                    id={requirement.id}
                    value={responses[requirement.id] || ''}
                    onChange={(e) => handleResponseChange(requirement.id, e.target.value)}
                    placeholder="請輸入回應..."
                  />
                )}
              </div>
            ))}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || Object.values(uploading).some(isUploading => isUploading)}
              >
                {submitting || Object.values(uploading).some(isUploading => isUploading) ? '處理中...' : '儲存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
