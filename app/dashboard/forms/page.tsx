"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Calendar, Clock, Users, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Form } from "@/app/api/types"
import { formatDate } from "@/lib/utils"

interface FormWithSubmitStatus extends Form {
  canSubmit: boolean
}

export default function FormsPage() {
  const { user } = useAuth()
  const [forms, setForms] = useState<FormWithSubmitStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const getSubmitStatusBadge = (form: FormWithSubmitStatus) => {
    if (form.status !== 'active') {
      return null
    }
    
    if (form.canSubmit) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          可填寫
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-600">
          <XCircle className="h-3 w-3 mr-1" />
          已填寫
        </Badge>
      )
    }
  }

  const getButtonText = (form: FormWithSubmitStatus) => {
    if (form.status !== 'active') {
      return '表單未啟用'
    }
    
    if (form.canSubmit) {
      return '填寫表單'
    } else {
      return '查看表單'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">表單填寫</h1>
          <p className="text-muted-foreground mt-2">查看並填寫可用的表單</p>
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
                <Skeleton className="h-10 w-full" />
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
        <div>
          <h1 className="text-3xl font-bold">表單填寫</h1>
          <p className="text-muted-foreground mt-2">查看並填寫可用的表單</p>
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
      <div>
        <h1 className="text-3xl font-bold">表單填寫</h1>
        <p className="text-muted-foreground mt-2">查看並填寫可用的表單</p>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>目前沒有可用的表單</p>
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
                  {getSubmitStatusBadge(form)}
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
                <Link href={`/dashboard/forms/${form.id}`} passHref>
                  <Button 
                    className="w-full" 
                    variant={form.canSubmit ? 'default' : 'outline'}
                    disabled={form.status !== 'active' || !form.access_type}
                  >
                    {getButtonText(form)}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 