"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Edit, Save, Calendar, Clock, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Form, FormField, FormFieldOption } from "@/app/api/types"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

export default function FormDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const formId = params.id as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch form')
        }

        const formData = await response.json()
        setForm(formData.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (formId) {
      fetchForm()
    }
  }, [formId])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSaveResponse = async () => {
    if (!form) return

    setSaving(true)
    try {
      const fieldResponses = Object.entries(formData).map(([fieldId, value]) => ({
        field_id: fieldId,
        field_value: typeof value === 'string' ? value : null,
        field_values: typeof value !== 'string' ? value : null,
      }))

      const response = await fetch('/api/form-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_id: form.id,
          respondent_type: 'user',
          respondent_id: user?.id,
          submission_status: 'submitted',
          field_responses: fieldResponses,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save response')
      }

      toast.success('表單回應已成功提交')
    } catch (err) {
      toast.error('提交表單時發生錯誤')
      console.error('Error saving response:', err)
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id] || field.default_value || ''

    switch (field.field_type) {
      case 'text':
      case 'email':
        return (
          <Input
            type={field.field_type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required || false}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required || false}
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required || false}
            rows={4}
          />
        )

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || '請選擇'} />
            </SelectTrigger>
            <SelectContent>
              {field.form_field_options?.map((option: FormFieldOption) => (
                <SelectItem key={option.id} value={option.option_value}>
                  {option.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          >
            {field.form_field_options?.map((option: FormFieldOption) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.option_value} id={option.id} />
                <Label htmlFor={option.id}>{option.option_label}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {field.form_field_options?.map((option: FormFieldOption) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={checkboxValues.includes(option.option_value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...checkboxValues, option.option_value]
                      : checkboxValues.filter(v => v !== option.option_value)
                    handleFieldChange(field.id, newValues)
                  }}
                />
                <Label htmlFor={option.id}>{option.option_label}</Label>
              </div>
            ))}
          </div>
        )

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required || false}
          />
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">啟用中</Badge>
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>
      case 'inactive':
        return <Badge variant="outline">停用</Badge>
      case 'archived':
        return <Badge variant="destructive">已封存</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getFormTypeBadge = (formType: string) => {
    switch (formType) {
      case 'registration':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">報名表</Badge>
      case 'profile':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">個人資料</Badge>
      case 'survey':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">問卷調查</Badge>
      case 'feedback':
        return <Badge variant="outline" className="text-green-600 border-green-600">意見回饋</Badge>
      case 'application':
        return <Badge variant="outline" className="text-red-600 border-red-600">申請表</Badge>
      default:
        return <Badge variant="outline">{formType}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !form || !form.access_type) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/forms">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">表單詳情</h1>
            <p className="text-muted-foreground mt-2">查看表單詳細資訊</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error || (!form?.access_type ? '您沒有權限查看此表單' : '找不到表單')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/forms">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{form.title}</h1>
            <p className="text-muted-foreground mt-2">填寫表單</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {form.access_type === 'edit' && (
            <>
              <Link href={`/dashboard/forms/${formId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  編輯表單
                </Button>
              </Link>
              <Link href={`/dashboard/forms/${formId}/responses`}>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  查看回應
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 表單資訊 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{form.title}</CardTitle>
              {form.description && (
                <CardDescription className="mt-2 text-base">
                  {form.description}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {getStatusBadge(form.status || 'draft')}
            {getFormTypeBadge(form.form_type)}
            {form.is_required && (
              <Badge variant="destructive" className="text-xs">必填</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>目標對象：{form.target_role}</span>
            </div>
            {form.submission_deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>截止日期：{formatDate(form.submission_deadline)}</span>
              </div>
            )}
            {form.created_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>建立時間：{formatDate(form.created_at)}</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* 表單內容 */}
      <Card>
        <CardHeader>
          <CardTitle>表單內容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {form.fields && form.fields.length > 0 ? (
            form.fields
              .sort((a, b) => a.display_order - b.display_order)
              .map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-base font-medium">
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.help_text && (
                    <p className="text-sm text-muted-foreground">{field.help_text}</p>
                  )}
                  {renderField(field)}
                </div>
              ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>此表單尚未設定任何欄位</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按鈕 */}
      {form.status === 'active' && form.fields && form.fields.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveResponse}
            disabled={saving}
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '提交中...' : '提交表單'}
          </Button>
        </div>
      )}
    </div>
  )
} 