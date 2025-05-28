"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Save, Calendar, Clock, Users, Edit, Plus, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { FormField } from "@/app/api/types"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { useFormContext, FormFieldComponent } from "@/components/forms"

export default function FormDetailPage() {
  const { user } = useAuth()
  const { form, loading, error } = useFormContext()
  
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [userResponses, setUserResponses] = useState<any[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())

  // 載入用戶的回應
  useEffect(() => {
    const fetchUserResponses = async () => {
      if (!form || !user) return

      setLoadingResponses(true)
      try {
        const response = await fetch(`/api/forms/${form.id}/responses/users/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setUserResponses(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching user responses:', err)
      } finally {
        setLoadingResponses(false)
      }
    }

    fetchUserResponses()
  }, [form, user])

  // 載入編輯回應的數據
  useEffect(() => {
    const loadEditingResponse = async () => {
      if (!editingResponseId) return

      try {
        const response = await fetch(`/api/form-responses/${editingResponseId}`)
        if (response.ok) {
          const data = await response.json()
          const responseData = data.data
          
          // 將回應數據轉換為表單數據格式
          const newFormData: Record<string, any> = {}
          responseData.field_responses.forEach((fieldResponse: any) => {
            if (fieldResponse.field_values) {
              newFormData[fieldResponse.field_id] = fieldResponse.field_values
            } else if (fieldResponse.field_value) {
              newFormData[fieldResponse.field_id] = fieldResponse.field_value
            }
          })
          
          setFormData(newFormData)
          setShowForm(true)
        }
      } catch (err) {
        console.error('Error loading response for editing:', err)
        toast.error('載入回應數據失敗')
      }
    }

    loadEditingResponse()
  }, [editingResponseId])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // 如果用戶填寫了有錯誤的字段，清除該字段的錯誤狀態
    if (validationErrors.has(fieldId)) {
      const newErrors = new Set(validationErrors)
      newErrors.delete(fieldId)
      setValidationErrors(newErrors)
    }
  }

  const handleSaveResponse = async () => {
    if (!user) {
      toast.error('請先登入')
      return
    }

    if (!form) {
      toast.error('表單資料載入中')
      return
    }

    // 驗證必填字段
    const missingFields: string[] = []
    const errorFieldIds = new Set<string>()
    
    form.fields?.forEach(field => {
      if (field.is_required) {
        const value = formData[field.id]
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
          missingFields.push(field.field_label)
          errorFieldIds.add(field.id)
        }
      }
    })

    // 更新驗證錯誤狀態
    setValidationErrors(errorFieldIds)

    // 如果有未填寫的必填字段，顯示錯誤並阻止提交
    if (missingFields.length > 0) {
      toast.error(`請填寫以下必填字段：${missingFields.join('、')}`)
      return
    }

    setSaving(true)
    try {
      const fieldResponses = Object.entries(formData).map(([fieldId, value]) => ({
        field_id: fieldId,
        field_value: Array.isArray(value) ? null : value,
        field_values: Array.isArray(value) ? value : null,
      }))

      let response
      if (editingResponseId) {
        // 更新現有回應
        response = await fetch(`/api/form-responses/${editingResponseId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field_responses: fieldResponses,
            submission_status: 'submitted',
          }),
        })
      } else {
        // 創建新回應 - 使用新的 API 端點
        response = await fetch(`/api/forms/${form.id}/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            respondent_id: user.id,
            submission_status: 'submitted',
            field_responses: fieldResponses,
          }),
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save response')
      }

      toast.success(editingResponseId ? '表單回應已成功更新' : '表單回應已成功提交')
      
      // 重新載入用戶回應
      window.location.reload()
    } catch (err) {
      toast.error(editingResponseId ? '更新表單時發生錯誤' : '提交表單時發生錯誤')
      console.error('Error saving response:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEditResponse = (responseId: string) => {
    setEditingResponseId(responseId)
    setFormData({})
    setValidationErrors(new Set())
  }

  const handleNewResponse = () => {
    setEditingResponseId(null)
    setFormData({})
    setShowForm(true)
    setValidationErrors(new Set())
  }

  const handleCancelEdit = () => {
    setEditingResponseId(null)
    setFormData({})
    setShowForm(false)
    setValidationErrors(new Set())
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 hover:bg-green-100 text-green-800">已發布</Badge>
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>
      case 'archived':
        return <Badge variant="outline">已封存</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getFormTypeBadge = (formType: string) => {
    const typeMap: Record<string, string> = {
      'registration': '報名表',
      'profile': '個人資料',
      'survey': '問卷調查',
      'feedback': '意見回饋',
      'application': '申請表',
    }
    return <Badge variant="outline">{typeMap[formType] || formType}</Badge>
  }

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="default" className="bg-green-500">已提交</Badge>
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return null // Layout 會處理載入狀態
  }

  if (error) {
    return null // Layout 會處理錯誤狀態
  }

  if (!form) {
    return null
  }

  // 基於 API 返回的 submitted 字段來決定是否顯示已提交狀態
  // 只有在已提交且不允許多次提交且不在編輯模式時才顯示已提交狀態
  const shouldShowSubmittedState = form.submitted && !form.allow_multiple_submissions && !showForm

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 表單資訊 */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              表單資訊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">建立時間</Label>
              <p className="text-sm">{form.created_at ? formatDate(form.created_at) : '未知'}</p>
            </div>
            
            {form.submission_deadline && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">截止時間</Label>
                <p className="text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDate(form.submission_deadline)}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">設定</Label>
              <div className="flex items-center gap-1">
                  {form.status && getStatusBadge(form.status)}
                  {form.form_type && getFormTypeBadge(form.form_type)}
              </div>
              <div className="space-y-1">
                  <p className="text-sm">
                      • {form.is_required ? '必填表單' : '非必填表單'}
                  </p>
                  <p className="text-sm">
                      • {form.allow_multiple_submissions ? '允許多次提交' : '只允許一次提交'}
                  </p>
              </div>
            </div>

            {/* 用戶回應狀態 */}
            {form.access_type === 'read' && !loadingResponses && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">您的回應</Label>
                {form.submitted ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">已提交</span>
                    </div>
                    {userResponses.length > 1 && (
                      <div className="space-y-2">
                        {userResponses.map((response, index) => (
                          <div key={response.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">回應 #{index + 1}</span>
                              {getSubmissionStatusBadge(response.submission_status)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(response.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">尚未提交回應</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 表單內容 */}
      <div className="lg:col-span-3">
        {shouldShowSubmittedState ? (
          /* 已提交狀態 */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle className="h-5 w-5 text-green-500" />
                表單已提交
              </CardTitle>
              <CardDescription className="text-base">
                您已成功提交此表單
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">感謝您的提交！</h3>
                <p className="text-muted-foreground mb-6">
                  您的回應已成功記錄，我們會盡快處理。
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* 編輯回覆按鈕 */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      // 找到最新的已提交回應
                      const submittedResponse = userResponses.find(r => r.submission_status === 'submitted')
                      if (submittedResponse) {
                        handleEditResponse(submittedResponse.id)
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    編輯回覆
                  </Button>
                  
                  {/* 再次填寫按鈕（只在允許多次提交時顯示） */}
                  {form.allow_multiple_submissions && (
                    <Button
                      onClick={handleNewResponse}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      再次填寫
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* 表單填寫 */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5" />
                {editingResponseId ? '編輯回覆' : '填寫表單'}
              </CardTitle>
              <CardDescription className="text-base whitespace-pre-line text-sm">
                {form.description}
              </CardDescription>
              {editingResponseId && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    取消編輯
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {form.fields && form.fields.length > 0 ? (
                <>
                  {form.fields
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((field) => (
                      <FormFieldComponent
                        key={field.id}
                        field={field}
                        value={formData[field.id]}
                        onChange={handleFieldChange}
                        hasError={validationErrors.has(field.id)}
                      />
                    ))}
                  
                  {/* 只在表單為 active 狀態時顯示提交按鈕 */}
                  {form.status === 'active' && (
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={handleSaveResponse}
                        disabled={saving}
                        className="w-full text-base py-6"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? (editingResponseId ? '更新中...' : '提交中...') : (editingResponseId ? '更新回覆' : '提交表單')}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-lg">此表單尚未設定任何欄位</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 