import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FormCreateRequest, FormFieldCreateRequest, FormFieldOptionCreateRequest, Form, FormField, FormFieldOption } from "@/app/api/types"

export interface FormFieldWithId extends FormFieldCreateRequest {
  tempId: string
  id?: string
  options?: FormFieldOptionWithId[]
}

export interface FormFieldOptionWithId extends FormFieldOptionCreateRequest {
  tempId: string
  id?: string
}

export interface RolePermission {
  role: string
  access_type: 'read' | 'edit' | null
}

export const FIELD_TYPES = [
  { value: 'text', label: '單行文字' },
  { value: 'textarea', label: '多行文字' },
  { value: 'email', label: '電子郵件' },
  { value: 'number', label: '數字' },
  { value: 'select', label: '下拉選單' },
  { value: 'radio', label: '單選題' },
  { value: 'checkbox', label: '多選題' },
]

export const FORM_TYPES = [
  { value: 'registration', label: '報名表' },
  { value: 'profile', label: '個人資料' },
  { value: 'survey', label: '問卷調查' },
  { value: 'feedback', label: '意見回饋' },
  { value: 'application', label: '申請表' },
]

// 動態角色列表，將從 API 獲取
export let ROLES: { value: string; label: string }[] = []

export const ACCESS_TYPES = [
  { value: null, label: '無權限' },
  { value: 'read', label: '檢視' },
  { value: 'edit', label: '編輯' },
]

export function useFormEditor(form: Form | null, hasEditPermission?: boolean, refetchForm?: () => Promise<void>) {
  const router = useRouter()
  
  // 表單基本資訊
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formType, setFormType] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false)
  const [submissionDeadline, setSubmissionDeadline] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState('')
  
  // 表單欄位
  const [fields, setFields] = useState<FormFieldWithId[]>([])
  
  // 狀態管理
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null)
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([])

  // 生成臨時 ID
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 生成隨機選項值
  const generateRandomOptionValue = () => `option_${Math.random().toString(36).substr(2, 6)}`

  // 載入角色列表
  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const result = await response.json()
        const rolesList = result.data.map((role: any) => ({
          value: role.name,
          label: role.display_name || role.name
        }))
        setRoles(rolesList)
        // 更新全域 ROLES 變數
        ROLES.length = 0
        ROLES.push(...rolesList)
      }
    } catch (err) {
      console.error('Failed to load roles:', err)
      // 使用預設角色作為後備
      const defaultRoles = [
        { value: 'teacher', label: '大學伴' },
        { value: 'manager', label: '區域管理員' },
        { value: 'admin', label: '全域管理員' },
        { value: 'root', label: '系統管理員' },
      ]
      setRoles(defaultRoles)
      ROLES.length = 0
      ROLES.push(...defaultRoles)
    }
  }

  // 初始化表單資料
  useEffect(() => {
    // 載入角色列表
    loadRoles()

    if (hasEditPermission === false) {
      router.push('/dashboard/forms')
      return
    }

    if (form) {
      // 設定基本資訊
      setTitle(form.title)
      setDescription(form.description || '')
      setFormType(form.form_type)
      setIsRequired(form.is_required || false)
      setAllowMultipleSubmissions(form.allow_multiple_submissions || false)
      setStatus(form.status || 'draft')
      
      if (form.submission_deadline) {
        setSubmissionDeadline(new Date(form.submission_deadline))
      }
      
      // 設定欄位
      if (form.fields && form.fields.length > 0) {
        const formFields: FormFieldWithId[] = form.fields
          .sort((a, b) => a.display_order - b.display_order)
          .map((field: FormField) => ({
            tempId: `existing_${field.id}`,
            id: field.id,
            field_name: field.field_name,
            field_label: field.field_label,
            field_type: field.field_type,
            display_order: field.display_order,
            is_required: field.is_required || false,
            is_active: field.is_active !== false,
            placeholder: field.placeholder || '',
            help_text: field.help_text || '',
            default_value: field.default_value || '',
            min_length: field.min_length || undefined,
            max_length: field.max_length || undefined,
            pattern: field.pattern || '',
            options: field.form_field_options?.map((option: FormFieldOption) => ({
              tempId: `existing_option_${option.id}`,
              id: option.id,
              option_value: option.option_value,
              option_label: option.option_label,
              display_order: option.display_order,
              is_active: option.is_active !== false
            })) || []
          }))
        setFields(formFields)
      }
    }
  }, [form, hasEditPermission, router])

  // 添加新欄位
  const addField = (insertIndex?: number) => {
    const newField: FormFieldWithId = {
      tempId: generateTempId(),
      field_name: '',
      field_label: '',
      field_type: 'text',
      display_order: insertIndex !== undefined ? insertIndex : fields.length,
      is_required: false,
      is_active: true,
      placeholder: '',
      help_text: '',
      options: []
    }
    
    if (insertIndex !== undefined) {
      // 在指定位置插入
      const newFields = [...fields]
      newFields.splice(insertIndex, 0, newField)
      // 重新計算 display_order
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        display_order: index
      }))
      setFields(updatedFields)
    } else {
      // 添加到末尾
      setFields([...fields, newField])
    }
    
    // 自動聚焦新欄位
    setFocusedFieldId(newField.tempId)
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
    if (focusedFieldId === tempId) {
      setFocusedFieldId(null)
    }
  }

  // 複製欄位
  const duplicateField = (tempId: string) => {
    const fieldToDuplicate = fields.find(f => f.tempId === tempId)
    if (!fieldToDuplicate) return

    const fieldIndex = fields.findIndex(f => f.tempId === tempId)
    const duplicatedField: FormFieldWithId = {
      ...fieldToDuplicate,
      tempId: generateTempId(),
      id: undefined, // 新欄位沒有 ID
      field_label: `${fieldToDuplicate.field_label} (副本)`,
      options: fieldToDuplicate.options?.map(option => ({
        ...option,
        tempId: generateTempId(),
        id: undefined
      })) || []
    }

    const newFields = [...fields]
    newFields.splice(fieldIndex + 1, 0, duplicatedField)
    // 重新計算 display_order
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      display_order: index
    }))
    setFields(updatedFields)
    
    // 聚焦複製的欄位
    setFocusedFieldId(duplicatedField.tempId)
  }

  // 添加選項（用於 select, radio, checkbox）
  const addOption = (fieldTempId: string) => {
    const newOption: FormFieldOptionWithId = {
      tempId: generateTempId(),
      option_value: generateRandomOptionValue(),
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
  const onDragEnd = (result: any) => {
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
          // 選項值已經自動生成，不需要驗證或修改
        }
      }
    }

    return true
  }

  // 保存草稿
  const saveDraft = async () => {
    if (!form || !validateForm()) return

    setSaving(true)
    try {
      const formData = {
        title,
        description,
        form_type: formType,
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

      const response = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      toast.success('草稿已保存')
      if (refetchForm) {
        await refetchForm()
      }
    } catch (err) {
      toast.error('保存草稿時發生錯誤')
      console.error('Error saving draft:', err)
    } finally {
      setSaving(false)
    }
  }

  // 發布表單
  const publishForm = async () => {
    if (!form || !validateForm()) return

    setSaving(true)
    try {
      const formData = {
        title,
        description,
        form_type: formType,
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

      const response = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to publish form')
      }

      toast.success('表單已發布')
      if (refetchForm) {
        await refetchForm()
      }
    } catch (err) {
      toast.error('發布表單時發生錯誤')
      console.error('Error publishing form:', err)
    } finally {
      setSaving(false)
    }
  }

  return {
    // 狀態
    form,
    title,
    description,
    formType,
    isRequired,
    allowMultipleSubmissions,
    submissionDeadline,
    status,
    fields,
    saving,
    publishing,
    previewMode,
    focusedFieldId,
    roles,
    
    // 設定器
    setTitle,
    setDescription,
    setFormType,
    setIsRequired,
    setAllowMultipleSubmissions,
    setSubmissionDeadline,
    setPreviewMode,
    setFocusedFieldId,
    
    // 方法
    addField,
    updateField,
    removeField,
    duplicateField,
    addOption,
    updateOption,
    removeOption,
    onDragEnd,
    saveDraft,
    publishForm,
  }
} 