"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
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

interface FieldOverview {
  field_id: string
  field_label: string
  field_type: string
  display_order: number
  responses: Array<{
    response_id: string
    respondent_name: string
    respondent_email: string
    field_value: string | null
    field_values: string[] | null
    created_at: string
    submission_status: string
  }>
  total_responses: number
}

interface AccessData {
  hasAccess: boolean
  accessType: 'read' | 'edit' | null
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function FormResponsesPage() {
  const { user } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const formId = params.id as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [overview, setOverview] = useState<FieldOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [responsesLoading, setResponsesLoading] = useState(false)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responsesError, setResponsesError] = useState<string | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [accessData, setAccessData] = useState<AccessData | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // 從 URL 參數獲取當前 tab 和頁碼
  const currentTab = searchParams.get('tab') || 'overview'
  const currentPage = parseInt(searchParams.get('page') || '1')

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

  // 載入總覽數據
  const fetchOverview = async () => {
    if (!accessData?.accessType || accessData.accessType !== 'edit') {
      return
    }

    setOverviewLoading(true)
    setOverviewError(null)
    
    try {
      const response = await fetch(`/api/forms/${formId}/responses/overview`)
      if (!response.ok) {
        throw new Error('Failed to fetch overview')
      }
      
      const data = await response.json()
      setOverview(data.data || [])
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : 'Failed to load overview')
    } finally {
      setOverviewLoading(false)
    }
  }

  // 載入單一回應數據（帶分頁）
  const fetchResponses = async (page: number = currentPage) => {
    if (!accessData?.accessType || accessData.accessType !== 'edit') {
      return
    }

    setResponsesLoading(true)
    setResponsesError(null)
    
    try {
      const response = await fetch(`/api/forms/${formId}/responses?page=${page}&limit=${pagination.limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch responses')
      }
      
      const data = await response.json()
      setResponses(data.data || [])
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: Math.ceil(data.total / data.limit)
      })
    } catch (err) {
      setResponsesError(err instanceof Error ? err.message : 'Failed to load responses')
    } finally {
      setResponsesLoading(false)
    }
  }

  useEffect(() => {
    if (accessData?.accessType === 'edit') {
      if (currentTab === 'overview') {
        fetchOverview()
      } else {
        fetchResponses(currentPage)
      }
    }
  }, [accessData, currentTab, currentPage])

  // 更新 URL 參數
  const updateUrlParams = (tab: string, page?: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', tab)
    if (page) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // 處理 tab 切換
  const handleTabChange = (tab: string) => {
    updateUrlParams(tab)
  }

  // 處理分頁
  const handlePageChange = (page: number) => {
    updateUrlParams(currentTab, page)
  }

  const renderResponseValue = (fieldResponse: any) => {
    if (fieldResponse.field_values && Array.isArray(fieldResponse.field_values)) {
      return fieldResponse.field_values.join(', ')
    }
    return fieldResponse.field_value || '-'
  }

  const renderOverviewValue = (response: any) => {
    if (response.field_values && Array.isArray(response.field_values)) {
      return response.field_values.join(', ')
    }
    return response.field_value || '-'
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

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="default" className="bg-green-500">已提交</Badge>
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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
      {/* 表單資訊摘要 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{form.title}</CardTitle>
              {form.description && (
                <CardDescription className="mt-2 text-base whitespace-pre-line text-sm">
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
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">已提交</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currentTab === 'individual' 
                ? responses.filter(r => r.submission_status === 'submitted').length
                : overview.reduce((acc, field) => 
                    acc + field.responses.filter(r => r.submission_status === 'submitted').length, 0
                  )
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {currentTab === 'individual' 
                ? responses.filter(r => r.submission_status === 'draft').length
                : overview.reduce((acc, field) => 
                    acc + field.responses.filter(r => r.submission_status === 'draft').length, 0
                  )
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs 內容 */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="individual">單一回應</TabsTrigger>
        </TabsList>

        {/* 總覽 Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>問題總覽</CardTitle>
              <CardDescription>
                每個問題的所有回答
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : overviewError ? (
                <div className="text-center text-red-600 py-8">
                  <p>{overviewError}</p>
                </div>
              ) : overview.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>尚未收到任何回應</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {overview.map((field) => (
                    <div key={field.field_id} className="border rounded-lg p-4">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold">{field.field_label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {field.field_type} • {field.total_responses} 個回應
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        {field.responses.length === 0 ? (
                          <p className="text-muted-foreground text-sm">尚無回應</p>
                        ) : (
                          field.responses.map((response, index) => (
                            <div key={`${response.response_id}-${field.field_id}`} 
                                 className="flex items-start justify-between p-3 bg-muted/50 rounded">
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {renderOverviewValue(response)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {response.respondent_name} • {formatDate(response.created_at)}
                                </div>
                              </div>
                              <div className="ml-4">
                                {getSubmissionStatusBadge(response.submission_status)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 單一回應 Tab */}
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>單一回應</CardTitle>
                  <CardDescription>
                    共收到 {pagination.total} 份回應
                  </CardDescription>
                </div>
                
                {/* 分頁控制 */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {currentPage} 頁，共 {pagination.totalPages} 頁
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
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
                          {getSubmissionStatusBadge(response.submission_status)}
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
        </TabsContent>
      </Tabs>
    </div>
  )
} 