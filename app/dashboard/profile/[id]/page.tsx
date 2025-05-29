"use client"

import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/user-avatar"
import { formatRelativeTime, getRoleBgColor, getRoleDisplay, getRoleTextColor, hasHigherPermission } from "@/lib/utils"
import { ArrowLeft, Calendar, Mail, MapPin, Clock, FileText, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  name: string | null
  role?: {
    id: number
    name: string
    display_name: string | null
    color: string | null
    order: number
  }
  region?: string | null
  created_at: string
  updated_at: string
  avatar_url?: string | null
  last_active?: string | null
}

interface FormFieldResponse {
  id: string
  field_value: string | null
  field_values: string[] | null
  field: {
    id: string
    field_label: string
    field_type: string
    form_field_options?: {
      id: string
      option_value: string
      option_label: string
    }[]
  }
}

interface FormResponse {
  id: string
  form_id: string
  respondent_id?: string | null
  respondent_type: string
  submission_status?: string | null
  submitted_at?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  review_notes?: string | null
  metadata?: any
  created_at?: string | null
  updated_at?: string | null
  forms?: {
    id: string
    title: string
    description?: string | null
    form_type: string
    status?: string | null
    is_required?: boolean | null
    submission_deadline?: string | null
    created_by?: string | null
    created_at?: string | null
  }
  field_responses?: FormFieldResponse[]
}

interface UserProfileResponse {
  user: User
  formResponses?: FormResponse[]
}

const ProfilePageSkeleton = () => {
  return (
    <div className="space-y-6">
    {/* Header with back button */}
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10" /> {/* Back button */}
      <Skeleton className="h-9 w-48" /> {/* Page title */}
    </div>

    {/* User Info Card */}
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" /> {/* Avatar */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48" /> {/* Name */}
              <Skeleton className="h-5 w-16" /> {/* Role badge */}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" /> {/* Icon */}
                <Skeleton className="h-4 w-40" /> {/* Email */}
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" /> {/* Icon */}
                <Skeleton className="h-4 w-32" /> {/* Region */}
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" /> {/* Icon */}
                <Skeleton className="h-4 w-36" /> {/* Join date */}
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" /> {/* Icon */}
                <Skeleton className="h-4 w-44" /> {/* Last active */}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>

    {/* Form Responses Card */}
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" /> {/* Icon */}
          <Skeleton className="h-6 w-32" /> {/* Title */}
        </div>
        <Skeleton className="h-4 w-48" /> {/* Description */}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-32" /> {/* Form title */}
                      <Skeleton className="h-5 w-16" /> {/* Form type */}
                      <Skeleton className="h-5 w-16" /> {/* Status */}
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-24 mb-1" /> {/* Submit time */}
                      <Skeleton className="h-4 w-24" /> {/* Review time */}
                    </div>
                  </div>
                  <Skeleton className="h-4 w-[300px]" /> {/* Description */}
                </div>
              </div>
              {/* Expand button */}
              <div className="flex justify-end mt-4">
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
  )
}

export default function ProfilePage() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set())
  const [responseDetails, setResponseDetails] = useState<Record<string, FormFieldResponse[]>>({})
  const [loadingResponses, setLoadingResponses] = useState<Set<string>>(new Set())

  const userId = params.id as string

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser || !userId) return

      try {
        setLoading(true)
        const response = await fetch(`/api/users/${userId}/profile`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('用戶不存在')
          } else if (response.status === 403) {
            throw new Error('沒有權限查看此用戶')
          } else {
            throw new Error('獲取用戶資料失敗')
          }
        }
        
        const data = await response.json()
        setProfileData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '發生未知錯誤')
        toast.error(err instanceof Error ? err.message : '發生未知錯誤')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [currentUser, userId])

  const getSubmissionStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'submitted':
        return (
          <Badge variant="outline" className="text-wrap bg-green-50 text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            已提交
          </Badge>
        )
      case 'draft':
        return (
          <Badge variant="outline" className="text-wrap bg-yellow-50 text-yellow-600 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            草稿
          </Badge>
        )
      case 'reviewed':
        return (
          <Badge variant="outline" className="text-wrap bg-blue-50 text-blue-600 border-blue-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            已審核
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-wrap bg-gray-50 text-gray-600 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            未知狀態
          </Badge>
        )
    }
  }

  const getFormTypeBadge = (formType: string) => {
    const typeMap: Record<string, { label: string; color: string }> = {
      'survey': { label: '問卷調查', color: 'text-wrap bg-blue-50 text-blue-600 border-blue-200' },
      'application': { label: '申請表', color: 'bg-green-50 text-green-600 border-green-200' },
      'feedback': { label: '意見回饋', color: 'bg-purple-50 text-purple-600 border-purple-200' },
      'evaluation': { label: '評估表', color: 'bg-orange-50 text-orange-600 border-orange-200' },
      'registration': { label: '報名表', color: 'bg-pink-50 text-pink-600 border-pink-200' },
    }

    const type = typeMap[formType] || { label: formType, color: 'bg-gray-50 text-gray-600 border-gray-200' }
    
    return (
      <Badge variant="outline" className={type.color}>
        {type.label}
      </Badge>
    )
  }

  const toggleResponseExpand = async (responseId: string) => {
    const newExpandedResponses = new Set(expandedResponses)
    
    if (expandedResponses.has(responseId)) {
      newExpandedResponses.delete(responseId)
      setExpandedResponses(newExpandedResponses)
      return
    }

    // 如果還沒有詳細資料，就獲取它
    if (!responseDetails[responseId]) {
      try {
        // 設置載入狀態
        setLoadingResponses(prev => {
          const newSet = new Set(prev)
          newSet.add(responseId)
          return newSet
        })

        const response = await fetch(`/api/form-responses/${responseId}`)
        if (!response.ok) {
          throw new Error('獲取回應詳情失敗')
        }
        const data = await response.json()
        setResponseDetails(prev => ({
          ...prev,
          [responseId]: data.data.field_responses || []
        }))
      } catch (err) {
        toast.error('獲取回應詳情失敗')
        return
      } finally {
        // 清除載入狀態
        setLoadingResponses(prev => {
          const newSet = new Set(prev)
          newSet.delete(responseId)
          return newSet
        })
      }
    }

    newExpandedResponses.add(responseId)
    setExpandedResponses(newExpandedResponses)
  }

  const renderResponseValue = (fieldResponse: FormFieldResponse) => {
    const { field_value, field_values, field } = fieldResponse

    // 處理多選題（checkbox）
    if (field.field_type === 'checkbox' && field_values && Array.isArray(field_values)) {
      return field_values
        .map(value => {
          const option = field.form_field_options?.find(opt => opt.option_value === value)
          return option?.option_label || value
        })
        .filter(Boolean)
        .join(', ')
    }

    // 處理單選題（radio）和下拉選單（select）
    if (['radio', 'select'].includes(field.field_type) && field_value) {
      const option = field.form_field_options?.find(opt => opt.option_value === field_value)
      return option?.option_label || field_value
    }

    // 處理其他類型的欄位
    return field_value || '-'
  }

  if (loading) {
    return (
        <ProfilePageSkeleton />
    );
  }

  if (error || !profileData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">用戶資料</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {error || '無法載入用戶資料'}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { user, formResponses } = profileData
  const isCurrentUser = currentUser?.id === user.id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isCurrentUser ? '我的資料' : '用戶資料'}
        </h1>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <UserAvatar user={user} size="lg" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">
                  {user.name || user.email.split('@')[0]}
                </CardTitle>
                {user.role && (
                  <Badge 
                    variant="outline" 
                    className={`${getRoleTextColor(user.role.name)} ${getRoleBgColor(user.role.name)}`}
                  >
                    {getRoleDisplay(user.role.name)}
                  </Badge>
                )}
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.region && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{user.region}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>加入於 {formatRelativeTime(user.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-2 truncate text-wrap">
                    <Clock className="h-4 w-4" />
                    <span>{user.last_active ? `最後活動 ${formatRelativeTime(user.last_active)}` : '從未登入'}</span>
                </div>
                
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form Responses */}
      {formResponses && !hasHigherPermission(user.role, currentUser?.role) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              表單作答記錄
            </CardTitle>
            <CardDescription>
              {isCurrentUser ? '您的' : `${user.name || user.email.split('@')[0]} 的`}表單提交記錄
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formResponses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                尚無表單作答記錄
              </div>
            ) : (
              <div className="space-y-4">
                {formResponses.map((response) => (
                  <div
                    key={response.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate ...">
                            {response.forms?.title || '未知表單'}
                          </h3>
                          {response.forms?.form_type && getFormTypeBadge(response.forms.form_type)}
                          {getSubmissionStatusBadge(response.submission_status)}
                        </div>
                          <div className="text-xs text-muted-foreground text-right space-y-1">
                            <div>提交於 {formatRelativeTime(response.submitted_at || response.created_at || null)}</div>
                                {response.reviewed_at && (
                                <div>審核於 {formatRelativeTime(response.reviewed_at)}</div>
                                )}
                            </div>
                        </div>
                        {response.forms?.description && (
                          <p className="text-sm text-muted-foreground">
                            {response.forms.description}
                          </p>
                        )}
                      </div>
                      
                    </div>

                    {/* Response Details */}
                    {expandedResponses.has(response.id) && (
                      <div className="mt-4 pt-4 border-t">
                        {loadingResponses.has(response.id) ? (
                          <div className="text-center text-muted-foreground py-4">
                            載入中...
                          </div>
                        ) : !responseDetails[response.id] ? (
                          <div className="text-center text-muted-foreground py-4">
                            無法載入詳細資料
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {responseDetails[response.id].map((fieldResponse) => (
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
                        )}
                      </div>
                    )}

                    {/* 展開/收合按鈕 */}
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={() => toggleResponseExpand(response.id)}
                        disabled={loadingResponses.has(response.id)}
                      >
                        {loadingResponses.has(response.id) ? (
                          <>
                            載入中...
                            <Skeleton className="h-4 w-4 rounded-full" />
                          </>
                        ) : expandedResponses.has(response.id) ? (
                          <>
                            收合詳情
                            <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            展開詳情
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {hasHigherPermission(user.role, currentUser?.role) && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              無法查看權限較高用戶的表單回覆紀錄
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 