"use client"

import type { Form, FormField, FormFieldOption } from "@/app/api/types";
import { useAuth } from "@/components/auth-provider";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// 從 useFormEditor 導入的類型
export interface FormFieldWithId {
  tempId: string
  id?: string
  field_name: string
  field_label: string
  field_type: string
  display_order: number
  is_required: boolean
  is_active: boolean
  placeholder?: string
  help_text?: string
  default_value?: string
  min_length?: number
  max_length?: number
  pattern?: string
  options?: FormFieldOptionWithId[]
  grid_options?: {
    rows: Array<{ value: string; label: string }>
    columns: Array<{ value: string; label: string }>
  }
}

export interface FormFieldOptionWithId {
  tempId: string
  id?: string
  option_value: string
  option_label: string
  display_order: number
  is_active: boolean
}

export const FIELD_TYPES = [
  { value: 'text', label: '單行文字' },
  { value: 'textarea', label: '多行文字' },
  { value: 'email', label: '電子郵件' },
  { value: 'number', label: '數字' },
  { value: 'select', label: '下拉選單' },
  { value: 'radio', label: '單選題' },
  { value: 'checkbox', label: '多選題' },
  { value: 'radio_grid', label: '單選方格' },
  { value: 'checkbox_grid', label: '核取方塊格' },
]

export const FORM_TYPES = [
  { value: 'registration', label: '報名表' },
  { value: 'profile', label: '個人資料' },
  { value: 'survey', label: '問卷調查' },
  { value: 'feedback', label: '意見回饋' },
  { value: 'application', label: '申請表' },
]

interface FormContextType {
  // 表單資料
  form: Form | null
  loading: boolean
  error: string | null
  refetchForm: () => Promise<void>
  
  // 權限檢查
  hasEditPermission: () => boolean
  hasDeletePermission: () => boolean
  
  // 頁面狀態
  pageType: 'view' | 'edit' | 'responses'
  pageTitle: string
  
  // 編輯狀態（整合自 useFormEditor）
  title: string
  description: string
  formType: string
  isRequired: boolean
  allowMultipleSubmissions: boolean
  submissionDeadline: Date | undefined
  status: string
  fields: FormFieldWithId[]
  previewMode: boolean
  focusedFieldId: string | null
  roles: { value: string; label: string }[]
  hasUnsavedChanges: boolean
  saving: boolean
  publishing: boolean
  
  // 編輯操作
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setFormType: (type: string) => void
  setIsRequired: (required: boolean) => void
  setAllowMultipleSubmissions: (allow: boolean) => void
  setSubmissionDeadline: (date: Date | undefined) => void
  setPreviewMode: (mode: boolean) => void
  setFocusedFieldId: (id: string | null) => void
  
  // 欄位操作
  addField: (insertIndex?: number) => void
  updateField: (tempId: string, updates: Partial<FormFieldWithId>) => void
  removeField: (tempId: string) => void
  duplicateField: (tempId: string) => void
  addOption: (fieldTempId: string) => void
  updateOption: (fieldTempId: string, optionTempId: string, updates: Partial<FormFieldOptionWithId>) => void
  removeOption: (fieldTempId: string, optionTempId: string) => void
  onDragEnd: (result: any) => void
  
  // 保存操作
    saveDraft: () => Promise<void>
    publishForm: () => Promise<void>
  
  // 工具方法
  cleanupEmptyFields: () => void
  debugFieldsState: () => void
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export function useFormContext() {
  const context = useContext(FormContext)
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider')
  }
  return context
}

interface FormProviderProps {
  children: ReactNode
}

export function FormProvider({ children }: FormProviderProps) {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const formId = params.id as string
  
  // 基本狀態
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 編輯狀態
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formType, setFormType] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false)
  const [submissionDeadline, setSubmissionDeadline] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState('')
  const [fields, setFields] = useState<FormFieldWithId[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null)
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  
  // 追蹤初始化狀態
  const initialStateRef = useRef<string>('')
  const initializedRef = useRef<string | null>(null)

  // 工具函數
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
      }
    } catch (err) {
      console.error('Failed to load roles:', err)
      const defaultRoles = [
        { value: 'teacher', label: '大學伴' },
        { value: 'manager', label: '區域管理員' },
        { value: 'admin', label: '全域管理員' },
        { value: 'root', label: '系統管理員' },
      ]
      setRoles(defaultRoles)
    }
  }

  // 初始化編輯狀態
  const initializeEditState = (formData: Form) => {
    if (initializedRef.current === formData.id) return

    console.log('初始化編輯狀態:', formData.title)
    initializedRef.current = formData.id

    setTitle(formData.title)
    setDescription(formData.description || '')
    setFormType(formData.form_type)
    setIsRequired(formData.is_required || false)
    setAllowMultipleSubmissions(formData.allow_multiple_submissions || false)
    setStatus(formData.status || 'draft')
    
    if (formData.submission_deadline) {
      setSubmissionDeadline(new Date(formData.submission_deadline))
    }
    
    // 設定欄位
    if (formData.fields && formData.fields.length > 0) {
      const formFields: FormFieldWithId[] = formData.fields
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
          })) || [],
          grid_options: field.grid_options || {
            rows: [],
            columns: []
          }
        }))
      setFields(formFields)
    } else {
      setFields([])
    }

    // 設定初始狀態
    setTimeout(() => {
      const initialState = JSON.stringify({
        title: formData.title,
        description: formData.description || '',
        formType: formData.form_type,
        isRequired: formData.is_required || false,
        allowMultipleSubmissions: formData.allow_multiple_submissions || false,
        submissionDeadline: formData.submission_deadline,
        fields: formData.fields?.map(field => ({
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
          options: field.form_field_options?.map((option, index) => ({
            option_value: option.option_value,
            option_label: option.option_label,
            display_order: index,
            is_active: option.is_active
          }))
        })) || []
      })
      initialStateRef.current = initialState
    }, 100)
  }

  // 檢查未保存變更
  const checkForUnsavedChanges = () => {
    const currentState = JSON.stringify({
      title,
      description,
      formType,
      isRequired,
      allowMultipleSubmissions,
      submissionDeadline: submissionDeadline?.toISOString(),
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
    })
    
    const hasChanges = initialStateRef.current !== currentState
    setHasUnsavedChanges(hasChanges)
    return hasChanges
  }

  const fetchForm = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/forms/${formId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('表單不存在')
        } else if (response.status === 403) {
          throw new Error('您沒有權限查看此表單')
        } else {
          throw new Error('載入表單時發生錯誤')
        }
      }

      const result = await response.json()
      setForm(result.data)
      
      // 在編輯頁面時初始化編輯狀態
      if (pathname.includes('/edit')) {
        initializeEditState(result.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入表單時發生錯誤')
      console.error('Error fetching form:', err)
    } finally {
      setLoading(false)
    }
  }

  const refetchForm = async () => {
    // 保存當前初始化狀態，避免重新初始化編輯狀態
    const currentInitialized = initializedRef.current
    await fetchForm()
    // 如果之前已經初始化過，恢復狀態避免重新初始化
    if (currentInitialized && pathname.includes('/edit')) {
      initializedRef.current = currentInitialized
    }
  }

  useEffect(() => {
    if (formId) {
      fetchForm()
    }
    // 載入角色列表
    loadRoles()
  }, [formId])

  // 監聽路由變化，在進入編輯頁面時初始化編輯狀態
  useEffect(() => {
    if (form && pathname.includes('/edit') && !initializedRef.current) {
      initializeEditState(form)
    }
  }, [form, pathname])

  // 監聽變更
  useEffect(() => {
    if (initialStateRef.current) {
      checkForUnsavedChanges()
    }
  }, [title, description, formType, isRequired, allowMultipleSubmissions, submissionDeadline, fields, checkForUnsavedChanges])

  const hasEditPermission = useCallback(() => {
    if (!user || !form) return false
    
    // 檢查是否為表單創建者
    if (form.created_by === user.id) return true
    
    // 檢查角色權限
    const userRole = user.role?.name
    if (!userRole) return false
    
    // 管理員和 root 用戶可以編輯所有表單
    if (['admin', 'root', 'manager'].includes(userRole)) return true
    
    // 檢查表單權限設定
    if (form.permissions) {
      const rolePermission = form.permissions.find((p: any) => p.role === userRole)
      return rolePermission && rolePermission.access_type === 'edit'
    }
    
    return false
  }, [user, form])

  const hasDeletePermission = useCallback(() => {
    if (!user || !form) return false
    
    // 檢查是否為表單創建者
    if (form.created_by === user.id) return true
    
    // 檢查角色權限
    const userRole = user.role?.name
    if (!userRole) return false
    
    // 只有管理員和 root 用戶可以刪除所有表單
    if (['admin', 'root'].includes(userRole)) return true
    
    return false
  }, [user, form])

  // 根據路由決定頁面類型
  const getPageType = (): 'view' | 'edit' | 'responses' => {
    if (pathname.includes('/edit')) return 'edit'
    if (pathname.includes('/responses')) return 'responses'
    return 'view'
  }

  // 獲取頁面標題
  const getPageTitle = () => {
    const pageType = getPageType()
    switch (pageType) {
      case 'edit':
        return '編輯表單'
      case 'responses':
        return '表單回應'
      case 'view':
        return '表單詳情'
      default:
        return '表單'
    }
  }

  // 欄位編輯方法
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
      options: [],
      grid_options: {
        rows: [],
        columns: []
      }
    }
    
    if (insertIndex !== undefined) {
      const newFields = [...fields]
      newFields.splice(insertIndex, 0, newField)
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        display_order: index
      }))
      setFields(updatedFields)
    } else {
      setFields([...fields, newField])
    }
    
    setFocusedFieldId(newField.tempId)
  }

  const updateField = (tempId: string, updates: Partial<FormFieldWithId>) => {
    setFields(fields.map(field => 
      field.tempId === tempId ? { ...field, ...updates } : field
    ))
  }

  const removeField = (tempId: string) => {
    setFields(fields.filter(field => field.tempId !== tempId))
    if (focusedFieldId === tempId) {
      setFocusedFieldId(null)
    }
  }

  const duplicateField = (tempId: string) => {
    const fieldToDuplicate = fields.find(f => f.tempId === tempId)
    if (!fieldToDuplicate) return

    const fieldIndex = fields.findIndex(f => f.tempId === tempId)
    const duplicatedField: FormFieldWithId = {
      ...fieldToDuplicate,
      tempId: generateTempId(),
      id: undefined,
      field_label: `${fieldToDuplicate.field_label} (副本)`,
      options: fieldToDuplicate.options?.map(option => ({
        ...option,
        tempId: generateTempId(),
        id: undefined
      })) || []
    }

    const newFields = [...fields]
    newFields.splice(fieldIndex + 1, 0, duplicatedField)
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      display_order: index
    }))
    setFields(updatedFields)
    setFocusedFieldId(duplicatedField.tempId)
  }

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

  const updateOption = (fieldTempId: string, optionTempId: string, updates: Partial<FormFieldOptionWithId>) => {
    const field = fields.find(f => f.tempId === fieldTempId)
    if (!field) return

    const updatedOptions = field.options?.map(option =>
      option.tempId === optionTempId ? { ...option, ...updates } : option
    ) || []

    updateField(fieldTempId, { options: updatedOptions })
  }

  const removeOption = (fieldTempId: string, optionTempId: string) => {
    const field = fields.find(f => f.tempId === fieldTempId)
    if (!field) return

    const updatedOptions = field.options?.filter(option => option.tempId !== optionTempId) || []
    updateField(fieldTempId, { options: updatedOptions })
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

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

    const activeFields = fields.filter(field => field.is_active !== false)
    
    for (let i = 0; i < activeFields.length; i++) {
      const field = activeFields[i]
      const fieldLabel = field.field_label || ''
      
      if (!fieldLabel.trim()) {
        const fieldPosition = fields.findIndex(f => f.tempId === field.tempId) + 1
        toast.error(`第 ${fieldPosition} 個欄位缺少標題，請填寫欄位標題`)
        setFocusedFieldId(field.tempId)
        return false
      }
      
      if (!field.field_name || !field.field_name.trim()) {
        field.field_name = fieldLabel.replace(/\s+/g, '_').toLowerCase()
      }

      if (['select', 'radio', 'checkbox'].includes(field.field_type)) {
        if (!field.options || field.options.length === 0) {
          toast.error(`欄位「${fieldLabel}」需要至少一個選項`)
          setFocusedFieldId(field.tempId)
          return false
        }
        for (const option of field.options) {
          const optionLabel = option.option_label || ''
          if (!optionLabel.trim()) {
            toast.error(`欄位「${fieldLabel}」的所有選項都必須有標籤`)
            setFocusedFieldId(field.tempId)
            return false
          }
        }
      }
    }

    return true
  }

  // 保存草稿
  const saveDraft = async () => {
    if (!form) return
    
    if (!validateForm()) return
    
    setSaving(true)
    try {
      const activeFields = fields.filter(field => field.is_active !== false)
      
      const formData = {
        title,
        description,
        form_type: formType,
        status: 'draft',
        is_required: isRequired,
        allow_multiple_submissions: allowMultipleSubmissions,
        submission_deadline: submissionDeadline ? submissionDeadline.toISOString() : undefined,
        fields: activeFields.map(field => ({
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
          })),
          grid_options: field.grid_options
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
      await refetchForm()
      
      // 更新初始狀態
      const newInitialState = JSON.stringify({
        title,
        description,
        formType,
        isRequired,
        allowMultipleSubmissions,
        submissionDeadline: submissionDeadline?.toISOString(),
        fields: activeFields.map(field => ({
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
      })
      initialStateRef.current = newInitialState
      setHasUnsavedChanges(false)
    } catch (err) {
      toast.error('保存草稿時發生錯誤')
      console.error('Error saving draft:', err)
    } finally {
      setSaving(false)
    }
  }

  // 發布表單
  const publishForm = async () => {
    if (!form) return
    
    if (!validateForm()) return
    
    setPublishing(true)
    try {
      const activeFields = fields.filter(field => field.is_active !== false)
      
      const formData = {
        title,
        description,
        form_type: formType,
        status: 'active',
        is_required: isRequired,
        allow_multiple_submissions: allowMultipleSubmissions,
        submission_deadline: submissionDeadline ? submissionDeadline.toISOString() : undefined,
        fields: activeFields.map(field => ({
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
          })),
          grid_options: field.grid_options
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
      await refetchForm()
      
      // 更新初始狀態
      const newInitialState = JSON.stringify({
        title,
        description,
        formType,
        isRequired,
        allowMultipleSubmissions,
        submissionDeadline: submissionDeadline?.toISOString(),
        fields: activeFields.map(field => ({
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
      })
      initialStateRef.current = newInitialState
      setHasUnsavedChanges(false)
    } catch (err) {
      toast.error('發布表單時發生錯誤')
      console.error('Error publishing form:', err)
    } finally {
      setPublishing(false)
    }
  }

  // 工具方法
  const cleanupEmptyFields = () => {
    const cleanedFields = fields.filter(field => {
      const hasLabel = field.field_label && field.field_label.trim()
      const hasPlaceholder = field.placeholder && field.placeholder.trim()
      const hasHelpText = field.help_text && field.help_text.trim()
      const hasOptions = field.options && field.options.length > 0
      
      const hasAnyContent = hasLabel || hasPlaceholder || hasHelpText || hasOptions
      const isCompletelyEmpty = !hasAnyContent && field.is_active !== false
      
      return !isCompletelyEmpty
    })
    
    const removedCount = fields.length - cleanedFields.length
    if (removedCount > 0) {
      setFields(cleanedFields)
      toast.success(`已清理 ${removedCount} 個完全空白的欄位`)
      setFocusedFieldId(null)
    } else {
      toast.info('沒有找到完全空白的欄位')
    }
  }

  const debugFieldsState = () => {
    console.log('=== 當前欄位狀態 ===')
    fields.forEach((field, index) => {
      console.log(`欄位 ${index}:`, {
        tempId: field.tempId,
        field_label: field.field_label,
        field_name: field.field_name,
        field_type: field.field_type,
        is_active: field.is_active,
        placeholder: field.placeholder,
        help_text: field.help_text,
        options: field.options?.length || 0
      })
    })
    console.log('=================')
  }

  const contextValue: FormContextType = {
    // 表單資料
    form,
    loading,
    error,
    refetchForm,
    
    // 權限檢查
    hasEditPermission: () => !!hasEditPermission(),
    hasDeletePermission: () => !!hasDeletePermission(),
    
    // 頁面狀態
    pageType: getPageType(),
    pageTitle: getPageTitle(),
    
    // 編輯狀態
    title,
    description,
    formType,
    isRequired,
    allowMultipleSubmissions,
    submissionDeadline,
    status,
    fields,
    previewMode,
    focusedFieldId,
    roles,
    hasUnsavedChanges,
    saving,
    publishing,
    
    // 編輯操作
    setTitle,
    setDescription,
    setFormType,
    setIsRequired,
    setAllowMultipleSubmissions,
    setSubmissionDeadline,
    setPreviewMode,
    setFocusedFieldId,
    
    // 欄位操作
    addField,
    updateField,
    removeField,
    duplicateField,
    addOption,
    updateOption,
    removeOption,
    onDragEnd,
    
    // 保存操作
    saveDraft,
    publishForm,
    
    // 工具方法
    cleanupEmptyFields,
    debugFieldsState,
  }

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  )
}

export { FormContext };
