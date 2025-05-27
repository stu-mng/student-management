"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, MessageSquare, Download, Filter } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Form } from "@/app/api/types"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

interface FormResponse {
  id: string
  created_at: string
  submission_status: string
  respondent: {
    id: string
    name: string
    email: string
  }
  field_responses: Array<{
    id: string
    field_value: string | null
    field_values: string[] | null
    field: {
      id: string
      field_label: string
      field_type: string
    }
  }>
}

interface AccessData {
  hasAccess: boolean
  accessType: 'read' | 'edit' | null
}

export default function FormResponsesPage() {
  const { user } = useAuth()
  const params = useParams()
  const formId = params.id as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [responsesLoading, setResponsesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responsesError, setResponsesError] = useState<string | null>(null)
  const [responsesTotal, setResponsesTotal] = useState(0)
  const [accessData, setAccessData] = useState<AccessData | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    const fetchFormAndAccess = async () => {
      try {
        // 同時獲取表單資料和權限資料
        const [formResponse, accessResponse] = await Promise.all([
          fetch(`/api/forms/${formId}`),
          fetch(`/api/forms/${formId}/access`)
        ])

        if (!formResponse.ok) {
          throw new Error('Failed to fetch form')
        }

        const formData = await formResponse.json()
        setForm(formData.data)

        if (accessResponse.ok) {
          const accessData = await accessResponse.json()
          setAccessData(accessData.data)
        } else {
          setAccessData({ hasAccess: false, accessType: null })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
        setCheckingAccess(false)
      }
    }

    if (formId) {
      fetchFormAndAccess()
    }
  }, [formId])

  // 載入表單回應
  const fetchResponses = async () => {
    if (!accessData?.accessType || accessData.accessType !== 'edit') {
      return
    }

    setResponsesLoading(true)
    setResponsesError(null)
    
    try {
      const response = await fetch(`/api/forms/${formId}/responses`)
      if (!response.ok) {
        throw new Error('Failed to fetch responses')
      }
      
      const data = await response.json()
      setResponses(data.data || [])
      setResponsesTotal(data.total || 0)
    } catch (err) {
      setResponsesError(err instanceof Error ? err.message : 'Failed to load responses')
    } finally {
      setResponsesLoading(false)
    }
  }

  useEffect(() => {
    if (accessData?.accessType === 'edit') {
      fetchResponses()
    }
  }, [accessData])

  const renderResponseValue = (fieldResponse: any) => {
    if (fieldResponse.field_values && Array.isArray(fieldResponse.field_values)) {
      return fieldResponse.field_values.join(', ')
    }
    return fieldResponse.field_value || '-'
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

  if (loading || checkingAccess) {
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !form || !accessData?.hasAccess || accessData.accessType !== 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/forms">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">表單回應</h1>
            <p className="text-muted-foreground mt-2">查看表單回應</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error || (!accessData?.hasAccess ? '您沒有權限查看此表單回應' : '找不到表單')}</p>
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
          <Link href={`/dashboard/forms/${formId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">表單回應</h1>
            <p className="text-muted-foreground mt-2">{form.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <Filter className="h-4 w-4 mr-2" />
            篩選
          </Button>
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            匯出
          </Button>
        </div>
      </div>

      {/* 表單資訊摘要 */}
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
        </CardHeader>
      </Card>

      {/* 回應統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">總回應數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responsesTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">已提交</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {responses.filter(r => r.submission_status === 'submitted').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {responses.filter(r => r.submission_status === 'draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 回應列表 */}
      <Card>
        <CardHeader>
          <CardTitle>回應詳情</CardTitle>
          <CardDescription>
            共收到 {responsesTotal} 份回應
          </CardDescription>
        </CardHeader>
        <CardContent>
          {responsesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : responsesError ? (
            <div className="text-center text-red-600 py-8">
              <p>{responsesError}</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>尚未收到任何回應</p>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map((response) => (
                <Card key={response.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {response.respondent.name}
                        </CardTitle>
                        <CardDescription>
                          {response.respondent.email} • {formatDate(response.created_at)}
                        </CardDescription>
                      </div>
                      <Badge variant={response.submission_status === 'submitted' ? 'default' : 'secondary'}>
                        {response.submission_status === 'submitted' ? '已提交' : '草稿'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {response.field_responses.map((fieldResponse) => (
                        <div key={fieldResponse.id} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="font-medium text-sm">
                            {fieldResponse.field.field_label}
                          </div>
                          <div className="md:col-span-2 text-sm">
                            {renderResponseValue(fieldResponse)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 