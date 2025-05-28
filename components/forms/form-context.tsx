"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Form } from "@/app/api/types"
import { toast } from "sonner"

interface FormContextType {
  // 表單資料
  form: Form | null
  loading: boolean
  error: string | null
  refetchForm: () => Promise<void>
  
  // 權限檢查
  hasEditPermission: () => boolean
  
  // 頁面狀態
  pageType: 'view' | 'edit' | 'responses'
  pageTitle: string
  
  // 編輯頁面專用狀態
  previewMode?: boolean
  setPreviewMode?: (mode: boolean) => void
  
  // 動作函數
  saveDraft?: () => Promise<void>
  publishForm?: () => Promise<void>
  saving?: boolean
  publishing?: boolean
  
  // 編輯器動作函數（可被編輯頁面覆蓋）
  editorActions?: {
    saveDraft: () => Promise<void>
    publishForm: () => Promise<void>
    saving: boolean
    publishing: boolean
  } | null
  updateEditorActions?: (actions: {
    saveDraft: () => Promise<void>
    publishForm: () => Promise<void>
    saving: boolean
    publishing: boolean
  }) => void
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
  
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 編輯頁面專用狀態
  const [previewMode, setPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  
  // 編輯器動作函數（可被編輯頁面覆蓋）
  const [editorActions, setEditorActions] = useState<{
    saveDraft: () => Promise<void>
    publishForm: () => Promise<void>
    saving: boolean
    publishing: boolean
  } | null>(null)

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
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入表單時發生錯誤')
      console.error('Error fetching form:', err)
    } finally {
      setLoading(false)
    }
  }

  const refetchForm = async () => {
    await fetchForm()
  }

  useEffect(() => {
    if (formId) {
      fetchForm()
    }
  }, [formId])

  const hasEditPermission = useCallback(() => {
    if (!user || !form) return false
    
    // 檢查是否為表單創建者
    if (form.created_by === user.id) return true
    
    // 檢查角色權限
    const userRole = user.role?.name
    if (!userRole) return false
    
    // 管理員和 root 用戶可以編輯所有表單
    if (['admin', 'root'].includes(userRole)) return true
    
    // 檢查表單權限設定
    if (form.permissions) {
      const rolePermission = form.permissions.find((p: any) => p.role === userRole)
      return rolePermission && rolePermission.access_type === 'edit'
    }
    
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

  // 處理動作按鈕（簡化版本，用於非編輯頁面）
  const handleSaveDraft = async () => {
    if (!form) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'draft'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save as draft')
      }

      toast.success('已儲存為草稿')
      await refetchForm()
    } catch (err) {
      toast.error('儲存草稿時發生錯誤')
      console.error('Error saving draft:', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePublishForm = async () => {
    if (!form) return
    
    setPublishing(true)
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish form')
      }

      toast.success('表單已發布')
      await refetchForm()
    } catch (err) {
      toast.error('發布表單時發生錯誤')
      console.error('Error publishing form:', err)
    } finally {
      setPublishing(false)
    }
  }

  // 更新編輯器動作的方法
  const updateEditorActions = useCallback((actions: {
    saveDraft: () => Promise<void>
    publishForm: () => Promise<void>
    saving: boolean
    publishing: boolean
  }) => {
    setEditorActions(actions)
  }, [])

  const contextValue: FormContextType = {
    // 表單資料
    form,
    loading,
    error,
    refetchForm,
    
    // 權限檢查
    hasEditPermission: () => !!hasEditPermission(),
    
    // 頁面狀態
    pageType: getPageType(),
    pageTitle: getPageTitle(),
    
    // 編輯頁面專用狀態
    previewMode,
    setPreviewMode,
    
    // 動作函數
    saveDraft: handleSaveDraft,
    publishForm: handlePublishForm,
    saving,
    publishing,
    
    // 編輯器動作函數
    editorActions,
    updateEditorActions,
  }

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  )
}

export { FormContext } 