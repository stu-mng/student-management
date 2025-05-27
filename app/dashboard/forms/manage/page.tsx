"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Calendar, Clock, Users, Plus, Edit, Trash2, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Form } from "@/app/api/types"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

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
      default:
        return <Badge variant="outline">{formType}</Badge>
    }
  }

  // 檢查用戶是否有管理權限
  const hasManagePermission = user && user.role && ['admin', 'root'].includes(user.role)

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
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </CardContent>
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
          <Link href="/dashboard/forms/edit">
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
        <Link href="/dashboard/forms/edit">
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
              <Link href="/dashboard/forms/edit" className="mt-4 inline-block">
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
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    {form.description && (
                      <CardDescription className="mt-2">
                        {form.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {getStatusBadge(form.status || 'draft')}
                  {getFormTypeBadge(form.form_type)}
                  {form.is_required && (
                    <Badge variant="destructive" className="text-xs">必填</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mt-3">
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
              
              <CardContent>
                <div className="flex gap-2">
                  <Link href={`/dashboard/forms/${form.id}/edit`} className="flex-1">
                    <Button className="w-full" variant="default">
                      <Edit className="h-4 w-4 mr-2" />
                      編輯
                    </Button>
                  </Link>
                  
                  {form.access_type === 'edit' && (
                    <Link href={`/dashboard/forms/${form.id}/responses`}>
                      <Button variant="outline" size="icon" title="查看回應">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="destructive" 
                    size="icon"
                    disabled={deletingId === form.id}
                    onClick={() => handleDeleteForm(form.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 