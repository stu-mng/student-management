"use client"

import type { Form } from "@/app/api/types"
import { useAuth } from "@/components/auth-provider"
import { FormFieldComponent, useFormContext } from "@/components/forms"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/utils"
import { AlertTriangle, Calendar, CheckCircle, Clock, Edit, Plus, Save, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// Types
interface FormData {
  [key: string]: string | number | boolean | string[] | object
}

interface UserResponse {
  id: string
  submission_status: 'submitted' | 'draft'
  created_at: string
  field_responses: Array<{
    field_id: string
    field_value?: string | number | boolean
    field_values?: string[]
  }>
}

interface FieldResponse {
  field_id: string
  field_value?: string | number | boolean
  field_values?: string[]
}

// Component interfaces
interface FormInfoSidebarProps {
  form: Form
  userResponses: UserResponse[]
  loadingResponses: boolean
  getStatusBadge: (status: string) => JSX.Element
  getFormTypeBadge: (formType: string) => JSX.Element
  getSubmissionStatusBadge: (status: string) => JSX.Element
}

interface FormMainContentProps {
  form: Form
  shouldShowSubmittedState: boolean
  userResponses: UserResponse[]
  editingResponseId: string | null
  formData: FormData
  validationErrors: Set<string>
  saving: boolean
  deadlinePassed: boolean
  onEditResponse: (responseId: string) => void
  onNewResponse: () => void
  onCancelEdit: () => void
  onFieldChange: (fieldId: string, value: string | number | boolean | string[] | object) => void
  onSaveResponse: () => void
}

// Form Basic Info Component
function FormBasicInfo({ form }: { form: Form }) {
  return (
    <div>
      <Label className="text-sm font-medium text-muted-foreground">建立時間</Label>
      <p className="text-sm">{form.created_at ? formatDate(form.created_at) : '未知'}</p>
    </div>
  )
}

// Form Deadline Info Component
function FormDeadlineInfo({ form }: { form: Form }) {
  if (!form.submission_deadline) return null
  
  const deadlinePassed = new Date() > new Date(form.submission_deadline)
  
  return (
    <div>
      <Label className="text-sm font-medium text-muted-foreground">截止時間</Label>
      <div className="flex items-center gap-2">
        <p className="text-sm flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {formatDate(form.submission_deadline)}
        </p>
        {deadlinePassed && (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
      </div>
      {deadlinePassed && (
        <p className="text-xs text-red-600 mt-1">
          表單已截止
        </p>
      )}
    </div>
  )
}

// Form Settings Info Component
function FormSettingsInfo({ 
  form, 
  getStatusBadge, 
  getFormTypeBadge 
}: { 
  form: Form
  getStatusBadge: (status: string) => JSX.Element
  getFormTypeBadge: (formType: string) => JSX.Element
}) {
  return (
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
  )
}

// User Response Status Component
function UserResponseStatus({
  form,
  userResponses,
  loadingResponses,
  getSubmissionStatusBadge
}: {
  form: Form
  userResponses: UserResponse[]
  loadingResponses: boolean
  getSubmissionStatusBadge: (status: string) => JSX.Element
}) {
  if (form.access_type !== 'read' || loadingResponses) return null

  return (
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
  )
}

// Form Info Sidebar Component
function FormInfoSidebar({
  form,
  userResponses,
  loadingResponses,
  getStatusBadge,
  getFormTypeBadge,
  getSubmissionStatusBadge
}: FormInfoSidebarProps) {
  return (
    <div className="lg:col-span-1">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            表單資訊
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormBasicInfo form={form} />
          <FormDeadlineInfo form={form} />
          <FormSettingsInfo 
            form={form} 
            getStatusBadge={getStatusBadge}
            getFormTypeBadge={getFormTypeBadge}
          />
          <UserResponseStatus
            form={form}
            userResponses={userResponses}
            loadingResponses={loadingResponses}
            getSubmissionStatusBadge={getSubmissionStatusBadge}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// Submitted State View Component
function SubmittedStateView({
  form,
  userResponses,
  deadlinePassed,
  onEditResponse,
  onNewResponse
}: {
  form: Form
  userResponses: UserResponse[]
  deadlinePassed: boolean
  onEditResponse: (responseId: string) => void
  onNewResponse: () => void
}) {
  return (
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
          
          {deadlinePassed ? (
            <div className="flex items-center justify-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 mb-6">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">
                表單截止時間已過，無法進行編輯或再次提交
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {/* 編輯回覆按鈕 */}
              <Button
                variant="outline"
                onClick={() => {
                  // 找到最新的已提交回應
                  const submittedResponse = userResponses.find(r => r.submission_status === 'submitted')
                  if (submittedResponse) {
                    onEditResponse(submittedResponse.id)
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
                  onClick={onNewResponse}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  再次填寫
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Form Edit View Component
function FormEditView({
  form,
  editingResponseId,
  formData,
  validationErrors,
  saving,
  deadlinePassed,
  onCancelEdit,
  onFieldChange,
  onSaveResponse
}: {
  form: Form
  editingResponseId: string | null
  formData: FormData
  validationErrors: Set<string>
  saving: boolean
  deadlinePassed: boolean
  onCancelEdit: () => void
  onFieldChange: (fieldId: string, value: string | number | boolean | string[] | object) => void
  onSaveResponse: () => void
}) {
  // 檢查是否有任何驗證錯誤
  const hasValidationErrors = () => {
    // 驗證函數
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    const validateTaiwanId = (id: string): boolean => {
      const idRegex = /^[A-Z][0-9]{9}$/
      if (!idRegex.test(id)) {
        return false
      }

      const letterToNumber: { [key: string]: number } = {
        A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18,
        K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27,
        U: 28, V: 29, W: 30, X: 31, Y: 32, Z: 33
      }

      const firstLetter = id.charAt(0)
      const letterNumber = letterToNumber[firstLetter]
      
      const firstDigit = Math.floor(letterNumber / 10)
      const secondDigit = letterNumber % 10

      const digits = id.substring(1).split('').map(Number)

      let sum = firstDigit * 1 + secondDigit * 9
      for (let i = 0; i < 8; i++) {
        sum += digits[i] * (8 - i)
      }

      const remainder = sum % 10
      const checkDigit = remainder === 0 ? 0 : 10 - remainder

      return checkDigit === digits[8]
    }

    const validatePhoneNumber = (phone: string): boolean => {
      const phoneRegex = /^09\d{2}-\d{3}-\d{3}$/
      return phoneRegex.test(phone)
    }

    // 檢查是否有必填字段未填寫或格式錯誤
    if (!form?.fields) return false

    for (const field of form.fields) {
      const value = formData[field.id]
      const stringValue = typeof value === 'string' ? value : String(value || '')
      
      // 檢查必填字段
      if (field.is_required) {
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
          return true
        }
      }

      // 檢查格式驗證（只在有值的情況下）
      if (value && typeof value === 'string' && value.trim() !== '') {
        switch (field.field_type) {
          case 'email':
            if (!validateEmail(stringValue)) {
              return true
            }
            break
          case 'taiwan_id':
            if (!validateTaiwanId(stringValue.toUpperCase())) {
              return true
            }
            break
          case 'phone':
            if (!validatePhoneNumber(stringValue)) {
              return true
            }
            break
          case 'number':
            if (isNaN(Number(stringValue))) {
              return true
            }
            break
        }
      }
    }

    return false
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-lg mt-2 whitespace-pre-line">
                {form.description}
              </CardDescription>
            )}
          </div>
          {editingResponseId && (
            <Button variant="outline" onClick={onCancelEdit}>
              <X className="h-4 w-4 mr-2" />
              取消編輯
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {deadlinePassed && (
          <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">表單已截止</p>
              <p className="text-red-700 text-sm">
                截止時間：{form.submission_deadline ? formatDate(form.submission_deadline) : '未設定'}
              </p>
            </div>
          </div>
        )}
        
        {form.fields && form.fields.length > 0 ? (
          <>
            {form.fields
              .sort((a, b) => a.display_order - b.display_order)
              .map((field) => (
                <FormFieldComponent
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  onChange={onFieldChange}
                  hasError={validationErrors.has(field.id)}
                />
              ))}
            
            {/* 只在表單為 active 狀態且未過期時顯示提交按鈕 */}
            {form.status === 'active' && !deadlinePassed && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={onSaveResponse}
                  disabled={saving || hasValidationErrors()}
                  className="w-full text-base py-6"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? (editingResponseId ? '更新中...' : '提交中...') : (editingResponseId ? '更新回覆' : '提交表單')}
                </Button>
                {hasValidationErrors() && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    請先修正表單中的錯誤再提交
                  </p>
                )}
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
  )
}

// Expired Form View Component
function ExpiredFormView({ form }: { form: Form }) {
  return (
    <div className="lg:col-span-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            表單已截止
          </CardTitle>
          <CardDescription className="text-base">
            此表單的提交期限已過
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-900">
              {form.title}
            </h3>
            
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              很抱歉，此表單的提交截止時間已過，目前無法填寫或提交回應。
            </p>
            
            {form.submission_deadline && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 text-red-700">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">截止時間</span>
                </div>
                <p className="text-red-600 mt-1">
                  {formatDate(form.submission_deadline)}
                </p>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">!</span>
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-blue-900 mb-2">需要協助？</h4>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    如果您認為截止時間設定有誤，或有特殊情況需要延期提交，
                    請聯絡系統管理員或表單負責人員。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Form Main Content Component
function FormMainContent({
  form,
  shouldShowSubmittedState,
  userResponses,
  editingResponseId,
  formData,
  validationErrors,
  saving,
  deadlinePassed,
  onEditResponse,
  onNewResponse,
  onCancelEdit,
  onFieldChange,
  onSaveResponse
}: FormMainContentProps) {
  // If deadline passed and form hasn't been submitted, show expired view
  if (deadlinePassed && !shouldShowSubmittedState) {
    return <ExpiredFormView form={form} />
  }

  return (
    <div className="lg:col-span-3">
      {shouldShowSubmittedState ? (
        <SubmittedStateView
          form={form}
          userResponses={userResponses}
          deadlinePassed={deadlinePassed}
          onEditResponse={onEditResponse}
          onNewResponse={onNewResponse}
        />
      ) : (
        <FormEditView
          form={form}
          editingResponseId={editingResponseId}
          formData={formData}
          validationErrors={validationErrors}
          saving={saving}
          deadlinePassed={deadlinePassed}
          onCancelEdit={onCancelEdit}
          onFieldChange={onFieldChange}
          onSaveResponse={onSaveResponse}
        />
      )}
    </div>
  )
}

export default function FormDetailPage() {
  const { user } = useAuth()
  const { form, loading, error } = useFormContext()
  
  const [formData, setFormData] = useState<FormData>({})
  const [saving, setSaving] = useState(false)
  const [userResponses, setUserResponses] = useState<UserResponse[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())

  // Helper function to check if deadline has passed
  const isDeadlinePassed = () => {
    if (!form?.submission_deadline) return false
    return new Date() > new Date(form.submission_deadline)
  }

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
          const newFormData: FormData = {}
          responseData.field_responses.forEach((fieldResponse: FieldResponse) => {
            if (fieldResponse.field_values) {
              newFormData[fieldResponse.field_id] = fieldResponse.field_values
            } else if (fieldResponse.field_value) {
              let value = fieldResponse.field_value
              
              // 檢查是否是 JSON 字符串（用於 grid 類型欄位）
              if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                try {
                  value = JSON.parse(value)
                } catch (err) {
                  console.log('Not a JSON string, using as is:', value)
                }
              }
              
              newFormData[fieldResponse.field_id] = value
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

  const handleFieldChange = (fieldId: string, value: string | number | boolean | string[] | object) => {
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

    // Check deadline before saving
    if (isDeadlinePassed()) {
      toast.error('表單截止時間已過，無法提交')
      return
    }

    // 驗證函數
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    const validateTaiwanId = (id: string): boolean => {
      const idRegex = /^[A-Z][0-9]{9}$/
      if (!idRegex.test(id)) {
        return false
      }

      const letterToNumber: { [key: string]: number } = {
        A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18,
        K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27,
        U: 28, V: 29, W: 30, X: 31, Y: 32, Z: 33
      }

      const firstLetter = id.charAt(0)
      const letterNumber = letterToNumber[firstLetter]
      
      const firstDigit = Math.floor(letterNumber / 10)
      const secondDigit = letterNumber % 10

      const digits = id.substring(1).split('').map(Number)

      let sum = firstDigit * 1 + secondDigit * 9
      for (let i = 0; i < 8; i++) {
        sum += digits[i] * (8 - i)
      }

      const remainder = sum % 10
      const checkDigit = remainder === 0 ? 0 : 10 - remainder

      return checkDigit === digits[8]
    }

    const validatePhoneNumber = (phone: string): boolean => {
      const phoneRegex = /^09\d{2}-\d{3}-\d{3}$/
      return phoneRegex.test(phone)
    }

    // 驗證必填字段和格式
    const missingFields: string[] = []
    const formatErrors: string[] = []
    const errorFieldIds = new Set<string>()
    
    form.fields?.forEach(field => {
      const value = formData[field.id]
      const stringValue = typeof value === 'string' ? value : String(value || '')
      
      // 檢查必填字段
      if (field.is_required) {
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
          missingFields.push(field.field_label)
          errorFieldIds.add(field.id)
        }
      }

      // 檢查格式驗證（只在有值的情況下）
      if (value && typeof value === 'string' && value.trim() !== '') {
        switch (field.field_type) {
          case 'email':
            if (!validateEmail(stringValue)) {
              formatErrors.push(`「${field.field_label}」的電子郵件格式不正確（必須包含 @ 符號）`)
              errorFieldIds.add(field.id)
            }
            break
          case 'taiwan_id':
            if (!validateTaiwanId(stringValue.toUpperCase())) {
              formatErrors.push(`「${field.field_label}」的身分證字號格式不正確`)
              errorFieldIds.add(field.id)
            }
            break
          case 'phone':
            if (!validatePhoneNumber(stringValue)) {
              formatErrors.push(`「${field.field_label}」的手機號碼格式不正確（應為 09xx-xxx-xxx）`)
              errorFieldIds.add(field.id)
            }
            break
          case 'number':
            if (isNaN(Number(stringValue))) {
              formatErrors.push(`「${field.field_label}」必須是有效的數字`)
              errorFieldIds.add(field.id)
            }
            break
        }
      }
    })

    // 更新驗證錯誤狀態
    setValidationErrors(errorFieldIds)

    // 如果有驗證錯誤，顯示錯誤並阻止提交
    if (missingFields.length > 0) {
      toast.error(`請填寫以下必填字段：${missingFields.join('、')}`)
      return
    }

    if (formatErrors.length > 0) {
      toast.error(`請修正以下格式錯誤：\n${formatErrors.join('\n')}`)
      return
    }

    setSaving(true)
    try {
      const fieldResponses = Object.entries(formData).map(([fieldId, value]) => {
        // 對於對象類型的值（如 grid 數據），需要序列化為 JSON 字符串
        let processedValue = value
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          processedValue = JSON.stringify(value)
        }
        
        return {
          field_id: fieldId,
          field_value: Array.isArray(processedValue) ? null : processedValue,
          field_values: Array.isArray(processedValue) ? processedValue : null,
        }
      })

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
    // Check deadline before allowing edit
    if (isDeadlinePassed()) {
      toast.error('表單截止時間已過，無法編輯回應')
      return
    }
    
    setEditingResponseId(responseId)
    setFormData({})
    setValidationErrors(new Set())
  }

  const handleNewResponse = () => {
    // Check deadline before allowing new response
    if (isDeadlinePassed()) {
      toast.error('表單截止時間已過，無法提交新回應')
      return
    }
    
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

  // Helper functions for badges
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

  // Loading and error states
  if (loading) {
    return null // Layout 會處理載入狀態
  }

  if (error) {
    return null // Layout 會處理錯誤狀態
  }

  if (!form) {
    return null
  }

  // Main render logic
  const deadlinePassed = isDeadlinePassed()
  const shouldShowSubmittedState = Boolean(form.submitted && !form.allow_multiple_submissions && !showForm)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <FormInfoSidebar 
        form={form}
        userResponses={userResponses}
        loadingResponses={loadingResponses}
        getStatusBadge={getStatusBadge}
        getFormTypeBadge={getFormTypeBadge}
        getSubmissionStatusBadge={getSubmissionStatusBadge}
      />
      
      <FormMainContent
        form={form}
        shouldShowSubmittedState={shouldShowSubmittedState}
        userResponses={userResponses}
        editingResponseId={editingResponseId}
        formData={formData}
        validationErrors={validationErrors}
        saving={saving}
        deadlinePassed={deadlinePassed}
        onEditResponse={handleEditResponse}
        onNewResponse={handleNewResponse}
        onCancelEdit={handleCancelEdit}
        onFieldChange={handleFieldChange}
        onSaveResponse={handleSaveResponse}
      />
    </div>
  )
} 