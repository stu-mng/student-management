"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Form, RolePermission } from "@/app/api/types"
import { toast } from "sonner"
import { hasAdminPermission } from "@/lib/utils"
import { FormCard, PermissionsModal } from "@/components/forms"

interface RolePermissionLocal {
  role: string
  access_type: 'read' | 'edit' | null
}

export default function FormsManagePage() {
  const { user } = useAuth()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch('/api/forms')
        if (!response.ok) {
          throw new Error('Failed to fetch forms')
        }
        const data = await response.json()
        setForms(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchForms()
    }
  }, [user])

  const handleDeleteForm = async (formId: string) => {
    const confirmed = window.confirm('您確定要刪除此表單嗎？此操作無法復原，所有相關的回應資料也會被刪除。')
    if (!confirmed) return

    setDeletingId(formId)
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete form')
      }
      
      setForms(forms.filter(form => form.id !== formId))
      toast.success('表單已成功刪除')
    } catch (err) {
      toast.error('刪除表單時發生錯誤')
      console.error('Error deleting form:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handlePermissionsUpdate = (formId: string, permissions: RolePermission[]) => {
    // 可以在這裡更新本地狀態，或者重新載入表單列表
    // 目前先保持簡單，不做額外處理
  }

  // 檢查用戶是否有管理權限
  const hasManagePermission = hasAdminPermission(user?.role)

  if (!hasManagePermission) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">表單管理</h1>
          <p className="text-muted-foreground mt-2">管理系統表單</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>您沒有權限存取此頁面</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">表單管理</h1>
            <p className="text-muted-foreground mt-2">管理系統表單</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">表單管理</h1>
            <p className="text-muted-foreground mt-2">管理系統表單</p>
          </div>
          <Link href="/dashboard/forms/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增表單
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>載入表單時發生錯誤：{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">表單管理</h1>
          <p className="text-muted-foreground mt-2">管理系統表單</p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新增表單
          </Button>
        </Link>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>目前沒有表單</p>
              <Link href="/dashboard/forms/new" className="mt-4 inline-block">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  建立第一個表單
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              variant="manage"
              onDelete={handleDeleteForm}
              deletingId={deletingId}
              permissionsModal={
                <PermissionsModal 
                  form={form} 
                  onPermissionsUpdate={handlePermissionsUpdate}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  )
} 