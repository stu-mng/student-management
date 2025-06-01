"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save, Eye, MessageSquare, Edit, FileText, Settings, Trash2, Send } from "lucide-react"
import { FormProvider, useFormContext } from "@/components/forms"
import { useRouter, useParams } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface FormLayoutProps {
  children: ReactNode
}

// 動作按鈕組件
function FormActionButtons() {
  const { 
    form, 
    hasEditPermission,
    hasDeletePermission,
    pageType, 
    previewMode, 
    setPreviewMode,
    saving,
    publishing,
    hasUnsavedChanges,
    saveDraft,
    publishForm
  } = useFormContext()
  const router = useRouter()
  const params = useParams()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // 刪除表單處理函數
  const handleDeleteForm = async () => {
    if (!form) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/forms/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '刪除表單時發生錯誤')
      }

      toast.success('表單已成功刪除')
      router.push('/dashboard/forms/manage')
    } catch (error) {
      console.error('Error deleting form:', error)
      toast.error(error instanceof Error ? error.message : '刪除表單時發生錯誤')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }
  
  if (!form || !hasEditPermission()) return null
  
  const isActive = form.status === 'active'
  
  // 簡單狀態更新函數（非編輯頁面使用）
  const updateStatus = async (status: string) => {
    if (!form) return
    
    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update form status to ${status}`)
      }

      toast.success(status === 'active' ? '表單已發布' : '表單已保存為草稿')
      window.location.reload() // 簡單重新載入頁面
    } catch (err) {
      toast.error('更新表單狀態時發生錯誤')
      console.error('Error updating form status:', err)
    }
  }
  
  switch (pageType) {
    case 'edit':
      return (
        <>
          <div className="flex gap-2">
            <Link href={`/dashboard/forms/${form.id}/responses`}>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                查看回應
              </Button>
            </Link>
            {setPreviewMode && (
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? '編輯模式' : '預覽模式'}
              </Button>
            )}
            <Button
              onClick={saveDraft}
              disabled={saving || publishing}
              className={hasUnsavedChanges ? "border-orange-500 text-orange-600" : ""}
            >
              {isActive ? <Settings className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}   
              {saving ? '處理中...' : (isActive ? '保存為草稿' : '儲存草稿')}
              {hasUnsavedChanges && ' *'}
            </Button>
            <Button
              onClick={publishForm}
              disabled={saving || publishing}
            >
              <Send className="h-4 w-4 mr-2" />
              {publishing ? '處理中...' : '發布表單'}
            </Button>
            {hasDeletePermission() && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                刪除表單
              </Button>
            )}
          </div>

          {/* 刪除確認 Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  確認刪除表單
                </DialogTitle>
                <DialogDescription className="space-y-2 text-red-600 font-medium">
                  ⚠️ 您即將刪除表單「{form?.title || '未命名表單'}」。此操作無法復原，所有表單資料、欄位設定和用戶回應都將永久刪除。
                  <br />
                  <br />
                  請確認您真的要繼續刪除此表單？
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                >
                  取消
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDeleteForm} 
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="mr-2">刪除中...</span>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      確認刪除
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )
    
    case 'responses':
      return (
        <div className="flex gap-2">
          <Link href={`/dashboard/forms/${form.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              編輯表單
            </Button>
          </Link>
          <Button
            onClick={() => updateStatus('draft')}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            關閉表單
          </Button>
        </div>
      )
    
    case 'view':
      return (
        <div className="flex gap-2">
          <Link href={`/dashboard/forms/${form.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              編輯表單
            </Button>
          </Link>
        </div>
      )
    
    default:
      return null
  }
}

// 頁面內容組件
function FormLayoutContent({ children }: { children: ReactNode }) {
  const { form, loading, error, pageTitle, refetchForm } = useFormContext()
  const router = useRouter()
  // 載入中狀態
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
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
              <h1 className="text-3xl font-bold">表單</h1>
              <p className="text-muted-foreground mt-2">載入表單時發生錯誤</p>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                onClick={refetchForm} 
                className="mt-4"
                variant="outline"
              >
                重新載入
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和動作按鈕 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
        <Button onClick={() => {router.back()}} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
        </Button>
          <div>
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
            {form && (
              <p className="text-muted-foreground mt-2">表單管理</p>
            )}
          </div>
        </div>
        <FormActionButtons />
      </div>
      
      {/* 頁面內容 */}
      {children}
    </div>
  )
}

export default function FormLayout({ children }: FormLayoutProps) {
  return (
    <FormProvider>
      <FormLayoutContent>
        {children}
      </FormLayoutContent>
    </FormProvider>
  )
} 