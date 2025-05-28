"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save, Eye, MessageSquare, Edit, FileText, Settings } from "lucide-react"
import { FormProvider, useFormContext } from "@/components/forms"
import { useRouter } from "next/navigation"

interface FormLayoutProps {
  children: ReactNode
}

// 動作按鈕組件
function FormActionButtons() {
  const { 
    form, 
    hasEditPermission, 
    pageType, 
    previewMode, 
    setPreviewMode,
    editorActions,
    saveDraft,
    publishForm,
    saving,
    publishing 
  } = useFormContext()
  
  if (!form || !hasEditPermission()) return null
  
  const isActive = form.status === 'active'
  
  // 使用編輯器動作（如果可用）或回退到 context 動作
  const currentSaving = editorActions?.saving ?? saving
  const currentPublishing = editorActions?.publishing ?? publishing
  const currentSaveDraft = editorActions?.saveDraft ?? saveDraft
  const currentPublishForm = editorActions?.publishForm ?? publishForm
  
  switch (pageType) {
    case 'edit':
      return (
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
            onClick={currentSaveDraft}
            disabled={currentSaving || currentPublishing}
          >
            {isActive ? <Settings className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}   
            {currentSaving ? '處理中...' : (isActive ? '取消發布' : '儲存草稿')}
          </Button>
          <Button
            onClick={currentPublishForm}
            disabled={currentSaving || currentPublishing}
          >
            <Save className="h-4 w-4 mr-2" />
            {currentSaving ? '處理中...' : '發布表單'}
          </Button>
        </div>
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
            onClick={currentSaveDraft}
            disabled={currentSaving}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            {currentSaving ? '處理中...' : '關閉表單'}
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
              <p className="text-muted-foreground mt-2">{form.title}</p>
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