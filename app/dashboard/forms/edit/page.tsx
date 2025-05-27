"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Send, Eye, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FormCreateRequest, FormFieldCreateRequest, FormFieldOptionCreateRequest } from "@/app/api/types"
import { toast } from "sonner"
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface FormFieldWithId extends FormFieldCreateRequest {
  tempId: string
  options?: FormFieldOptionWithId[]
}

interface FormFieldOptionWithId extends FormFieldOptionCreateRequest {
  tempId: string
}

const FIELD_TYPES = [
  { value: 'text', label: '單行文字' },
  { value: 'textarea', label: '多行文字' },
  { value: 'email', label: '電子郵件' },
  { value: 'number', label: '數字' },
  { value: 'select', label: '下拉選單' },
  { value: 'radio', label: '單選題' },
  { value: 'checkbox', label: '多選題' },
]

const FORM_TYPES = [
  { value: 'registration', label: '報名表' },
  { value: 'profile', label: '個人資料' },
  { value: 'survey', label: '問卷調查' },
  { value: 'feedback', label: '意見回饋' },
  { value: 'application', label: '申請表' },
]

const TARGET_ROLES = [
  { value: 'teacher', label: '大學伴' },
  { value: 'manager', label: '區域管理員' },
  { value: 'admin', label: '全域管理員' },
  { value: 'all', label: '所有用戶' },
]

export default function FormEditPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // 表單基本資訊
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formType, setFormType] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false)
  const [submissionDeadline, setSubmissionDeadline] = useState<Date | undefined>(undefined)
  
  // 表單欄位
  const [fields, setFields] = useState<FormFieldWithId[]>([])
  
  // 狀態管理
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [isCreating, setIsCreating] = useState(true)

  // 檢查用戶權限
  const hasCreatePermission = user && user.role && ['admin', 'root', 'manager'].includes(user.role)

  useEffect(() => {
    if (!hasCreatePermission) {
      router.push('/dashboard/forms')
    }
  }, [hasCreatePermission, router])

  // 生成臨時 ID
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 添加新欄位
  const addField = () => {
    const newField: FormFieldWithId = {
      tempId: generateTempId(),
      field_name: '',
      field_label: '',
      field_type: 'text',
      display_order: fields.length,
      is_required: false,
      is_active: true,
      placeholder: '',
      help_text: '',
      options: []
    }
    setFields([...fields, newField])
  }

  // 更新欄位
  const updateField = (tempId: string, updates: Partial<FormFieldWithId>) => {
    setFields(fields.map(field => 
      field.tempId === tempId ? { ...field, ...updates } : field
    ))
  }

  // 刪除欄位
  const removeField = (tempId: string) => {
    setFields(fields.filter(field => field.tempId !== tempId))
  }

  // 添加選項（用於 select, radio, checkbox）
  const addOption = (fieldTempId: string) => {
    const newOption: FormFieldOptionWithId = {
      tempId: generateTempId(),
      option_value: '',
      option_label: '',
      display_order: 0,
      is_active: true
    }
    
    updateField(fieldTempId, {
      options: [...(fields.find(f => f.tempId === fieldTempId)?.options || []), newOption]
    })
  }

  // 更新選項
  const updateOption = (fieldTempId: string, optionTempId: string, updates: Partial<FormFieldOptionWithId>) => {
    const field = fields.find(f => f.tempId === fieldTempId)
    if (!field) return

    const updatedOptions = field.options?.map(option =>
      option.tempId === optionTempId ? { ...option, ...updates } : option
    ) || []

    updateField(fieldTempId, { options: updatedOptions })
  }

  // 刪除選項
  const removeOption = (fieldTempId: string, optionTempId: string) => {
    const field = fields.find(f => f.tempId === fieldTempId)
    if (!field) return

    const updatedOptions = field.options?.filter(option => option.tempId !== optionTempId) || []
    updateField(fieldTempId, { options: updatedOptions })
  }

  // 拖拽排序
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // 更新 display_order
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }))

    setFields(updatedItems)
  }

  // 驗證表單
  const validateForm = () => {
    if (!title.trim()) {
      toast.error('請輸入表單標題')
      return false
    }
    if (!formType) {
      toast.error('請選擇表單類型')
      return false
    }
    if (!targetRole) {
      toast.error('請選擇目標對象')
      return false
    }

    // 驗證欄位
    for (const field of fields) {
      if (!field.field_label.trim()) {
        toast.error('所有欄位都必須有標題')
        return false
      }
      if (!field.field_name.trim()) {
        // 自動生成 field_name
        field.field_name = field.field_label.replace(/\s+/g, '_').toLowerCase()
      }

      // 驗證有選項的欄位
      if (['select', 'radio', 'checkbox'].includes(field.field_type)) {
        if (!field.options || field.options.length === 0) {
          toast.error(`欄位「${field.field_label}」需要至少一個選項`)
          return false
        }
        for (const option of field.options) {
          if (!option.option_label.trim()) {
            toast.error(`欄位「${field.field_label}」的所有選項都必須有標籤`)
            return false
          }
          if (!option.option_value.trim()) {
            option.option_value = option.option_label
          }
        }
      }
    }

    return true
  }

  // 保存草稿
  const saveDraft = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const formData: FormCreateRequest = {
        title,
        description,
        form_type: formType,
        target_role: targetRole,
        status: 'draft',
        is_required: isRequired,
        allow_multiple_submissions: allowMultipleSubmissions,
        submission_deadline: submissionDeadline ? submissionDeadline.toISOString() : undefined,
        fields: fields.map(field => ({
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          display_order: field.display_order,
          is_required: field.is_required,
          is_active: field.is_active,
          placeholder: field.placeholder,
          help_text: field.help_text,
          default_value: field.default_value,
          min_length: field.min_length,
          max_length: field.max_length,
          pattern: field.pattern,
          options: field.options?.map((option, index) => ({
            option_value: option.option_value,
            option_label: option.option_label,
            display_order: index,
            is_active: option.is_active
          }))
        }))
      }

      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      const result = await response.json()
      toast.success('草稿已保存')
      router.push(`/dashboard/forms/edit/${result.data.id}`)
    } catch (err) {
      toast.error('保存草稿時發生錯誤')
      console.error('Error saving draft:', err)
    } finally {
      setSaving(false)
    }
  }

  // 發布表單
  const publishForm = async () => {
    if (!validateForm()) return

    setPublishing(true)
    try {
      const formData: FormCreateRequest = {
        title,
        description,
        form_type: formType,
        target_role: targetRole,
        status: 'active',
        is_required: isRequired,
        allow_multiple_submissions: allowMultipleSubmissions,
        submission_deadline: submissionDeadline ? submissionDeadline.toISOString() : undefined,
        fields: fields.map(field => ({
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          display_order: field.display_order,
          is_required: field.is_required,
          is_active: field.is_active,
          placeholder: field.placeholder,
          help_text: field.help_text,
          default_value: field.default_value,
          min_length: field.min_length,
          max_length: field.max_length,
          pattern: field.pattern,
          options: field.options?.map((option, index) => ({
            option_value: option.option_value,
            option_label: option.option_label,
            display_order: index,
            is_active: option.is_active
          }))
        }))
      }

      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to publish form')
      }

      const result = await response.json()
      toast.success('表單已發布')
      router.push(`/dashboard/forms/${result.data.id}`)
    } catch (err) {
      toast.error('發布表單時發生錯誤')
      console.error('Error publishing form:', err)
    } finally {
      setPublishing(false)
    }
  }

  // 渲染欄位編輯器
  const renderFieldEditor = (field: FormFieldWithId, index: number) => {
    const needsOptions = ['select', 'radio', 'checkbox'].includes(field.field_type)

    return (
      <Draggable key={field.tempId} draggableId={field.tempId} index={index}>
        {(provided: DraggableProvided) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="mb-4"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div {...provided.dragHandleProps}>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </div>
                  <Badge variant="outline">
                    {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(field.tempId)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`field-label-${field.tempId}`}>欄位標題 *</Label>
                  <Input
                    id={`field-label-${field.tempId}`}
                    value={field.field_label}
                    onChange={(e) => updateField(field.tempId, { field_label: e.target.value })}
                    placeholder="請輸入欄位標題"
                  />
                </div>
                <div>
                  <Label htmlFor={`field-type-${field.tempId}`}>欄位類型</Label>
                  <Select
                    value={field.field_type}
                    onValueChange={(value) => updateField(field.tempId, { field_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor={`field-placeholder-${field.tempId}`}>提示文字</Label>
                <Input
                  id={`field-placeholder-${field.tempId}`}
                  value={field.placeholder || ''}
                  onChange={(e) => updateField(field.tempId, { placeholder: e.target.value })}
                  placeholder="請輸入提示文字"
                />
              </div>

              <div>
                <Label htmlFor={`field-help-${field.tempId}`}>說明文字</Label>
                <Textarea
                  id={`field-help-${field.tempId}`}
                  value={field.help_text || ''}
                  onChange={(e) => updateField(field.tempId, { help_text: e.target.value })}
                  placeholder="請輸入說明文字"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`field-required-${field.tempId}`}
                  checked={field.is_required || false}
                  onCheckedChange={(checked) => updateField(field.tempId, { is_required: checked })}
                />
                <Label htmlFor={`field-required-${field.tempId}`}>必填欄位</Label>
              </div>

              {needsOptions && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>選項設定</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(field.tempId)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      新增選項
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {field.options?.map((option) => (
                      <div key={option.tempId} className="flex items-center gap-2">
                        <Input
                          value={option.option_label}
                          onChange={(e) => updateOption(field.tempId, option.tempId, { option_label: e.target.value })}
                          placeholder="選項標籤"
                          className="flex-1"
                        />
                        <Input
                          value={option.option_value}
                          onChange={(e) => updateOption(field.tempId, option.tempId, { option_value: e.target.value })}
                          placeholder="選項值"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(field.tempId, option.tempId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Draggable>
    )
  }

  if (!hasCreatePermission) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/forms/manage">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{isCreating ? '建立表單' : '編輯表單'}</h1>
            <p className="text-muted-foreground mt-2">設計並{isCreating ? '建立' : '編輯'}表單</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? '編輯模式' : '預覽模式'}
          </Button>
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存草稿'}
          </Button>
          <Button
            onClick={publishForm}
            disabled={publishing}
          >
            <Send className="h-4 w-4 mr-2" />
            {publishing ? '發布中...' : '發布表單'}
          </Button>
        </div>
      </div>

      {!previewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 表單設定 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>表單設定</CardTitle>
                <CardDescription>設定表單的基本資訊</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">表單標題 *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="請輸入表單標題"
                  />
                </div>

                <div>
                  <Label htmlFor="description">表單描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="請輸入表單描述"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="form-type">表單類型 *</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇表單類型" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target-role">目標對象 *</Label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇目標對象" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>截止日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !submissionDeadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {submissionDeadline ? format(submissionDeadline, "yyyy/MM/dd") : "選擇截止日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={submissionDeadline}
                        onSelect={setSubmissionDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={isRequired}
                      onCheckedChange={setIsRequired}
                    />
                    <Label htmlFor="required">必填表單</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="multiple"
                      checked={allowMultipleSubmissions}
                      onCheckedChange={setAllowMultipleSubmissions}
                    />
                    <Label htmlFor="multiple">允許多次提交</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 表單欄位編輯 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>表單欄位</CardTitle>
                    <CardDescription>拖拽欄位來調整順序</CardDescription>
                  </div>
                  <Button onClick={addField}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增欄位
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>尚未新增任何欄位</p>
                    <Button onClick={addField} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      新增第一個欄位
                    </Button>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="fields">
                      {(provided: DroppableProvided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {fields.map((field, index) => renderFieldEditor(field, index))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* 預覽模式 */
        <Card>
          <CardHeader>
            <CardTitle>{title || '未命名表單'}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>表單尚未新增任何欄位</p>
              </div>
            ) : (
              fields.map((field) => (
                <div key={field.tempId} className="space-y-2">
                  <Label>
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.help_text && (
                    <p className="text-sm text-muted-foreground">{field.help_text}</p>
                  )}
                  
                  {/* 根據欄位類型渲染預覽 */}
                  {field.field_type === 'text' && (
                    <Input placeholder={field.placeholder} disabled />
                  )}
                  {field.field_type === 'textarea' && (
                    <Textarea placeholder={field.placeholder} disabled rows={3} />
                  )}
                  {field.field_type === 'email' && (
                    <Input type="email" placeholder={field.placeholder} disabled />
                  )}
                  {field.field_type === 'number' && (
                    <Input type="number" placeholder={field.placeholder} disabled />
                  )}
                  {field.field_type === 'select' && (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || '請選擇'} />
                      </SelectTrigger>
                    </Select>
                  )}
                  {field.field_type === 'radio' && (
                    <div className="space-y-2">
                      {field.options?.map((option) => (
                        <div key={option.tempId} className="flex items-center space-x-2">
                          <input type="radio" disabled />
                          <Label>{option.option_label}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                  {field.field_type === 'checkbox' && (
                    <div className="space-y-2">
                      {field.options?.map((option) => (
                        <div key={option.tempId} className="flex items-center space-x-2">
                          <input type="checkbox" disabled />
                          <Label>{option.option_label}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 