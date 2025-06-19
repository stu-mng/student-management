"use client"

import { Form, Role } from "@/app/api/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/utils"
import { ClipboardList, Eye, FileQuestion, FileSpreadsheet, FileText, MessageCircle, Pen, X } from "lucide-react"
import Link from "next/link"

interface RolePermission {
  role: Role
  access_type: 'read' | 'edit' | null
}

interface FormWithSubmitStatus extends Form {
  submitted?: boolean
  access_type?: 'read' | 'edit' | null
}

interface FormCardProps {
  form: FormWithSubmitStatus
  variant: 'user' | 'manage'
  onDelete?: (formId: string) => void
  permissionsModal?: React.ReactNode
  deletingId?: string | null
  roles?: { value: string; label: string }[]
}


// 權限顯示組件
function PermissionsBadges({ permissions }: { permissions?: RolePermission[] }) {

  if (!permissions || permissions.length === 0) {
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-xs">
          <X className="h-3 w-3 mr-1" />
          無權限設定
        </Badge>
      </div>
    )
  }

  const getPermissionIcon = (accessType: string | null) => {
    switch (accessType) {
      case 'read':
        return <Eye className="h-3 w-3 mr-1" />
      case 'edit':
        return <Pen className="h-3 w-3 mr-1" />
      default:
        return <X className="h-3 w-3 mr-1" />
    }
  }

  const getPermissionColor = (accessType: string | null) => {
    switch (accessType) {
      case 'read':
        return "text-blue-600 border-blue-600"
      case 'edit':
        return "text-green-600 border-green-600"
      default:
        return "text-gray-400 border-gray-400"
    }
  }
  
  if (permissions.length === 0) {
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-xs">
          <X className="h-3 w-3 mr-1" />
          無權限設定
        </Badge>
      </div>
    )
  }

  const maxBadges = 3;

  return (
    <div className="flex flex-wrap gap-1">
      {permissions.length <= maxBadges ? (
        permissions.map((permission) => (
          <Badge 
            key={permission.role.name} 
            variant="outline" 
            className={`text-xs ${getPermissionColor(permission.access_type)}`}
          >
            {getPermissionIcon(permission.access_type)}
            {permission.role.display_name || permission.role.name}
          </Badge>
        ))
      ) : (
        <>
          {permissions.slice(0, maxBadges).map((permission) => (
            <Badge 
              key={permission.role.name} 
              variant="outline" 
              className={`text-xs ${getPermissionColor(permission.access_type)}`}
            >
              {getPermissionIcon(permission.access_type)}
              {permission.role.display_name || permission.role.name}
            </Badge>
          ))}
          <Badge 
            variant="outline" 
            className="text-xs text-gray-500"
          >
            +{permissions.length - maxBadges}
          </Badge>
        </>
      )}
    </div>
  )
}

export function FormCard({ form, variant, onDelete, permissionsModal, deletingId, roles }: FormCardProps) {
  const getStatusBadge = (status: string) => {
    // Check if deadline has passed for active forms
    if (status === 'active' && form.submission_deadline) {
      const deadlinePassed = new Date() > new Date(form.submission_deadline)
      if (deadlinePassed) {
        return (
          <div className="flex items-center gap-1.5 text-red-700 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            已截止
          </div>
        )
      }
    }

    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 text-green-700 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            啟用中
          </div>
        )
      case 'draft':
        return (
          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            草稿
          </div>
        )
      case 'inactive':
        return (
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            停用
          </div>
        )
      case 'archived':
        return (
          <div className="flex items-center gap-1.5 text-red-700 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            已封存
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {status}
          </div>
        )
    }
  }

  const getFormTypeIcon = (formType: string) => {
    switch (formType) {
      case 'registration':
        return (
            <div className="p-2 bg-blue-50 rounded-lg">
                <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
        );
      case 'profile':
        return (
            <div className="p-2 bg-purple-50 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
            </div>
        );
      case 'survey':
        return (
            <div className="p-2 bg-orange-50 rounded-lg">
                <FileQuestion className="h-5 w-5 text-orange-600" />
            </div>
        );
      case 'feedback':
        return (
            <div className="p-2 bg-green-50 rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
        );
      case 'application':
        return (
            <div className="p-2 bg-red-50 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-red-600" />
            </div>
        );
      default:
        return (
            <div className="p-2 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5" />
            </div>
        );
    }
  }

  const getSubmitStatusBadge = (form: FormWithSubmitStatus) => {
    if (form.submitted) {
      return (
        <div className="flex items-center gap-1.5 text-green-700 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          已填寫
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          未填寫
        </div>
      )
    }
  }

  const cardContent = (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="w-full flex-1">
            <div className="w-full flex items-center gap-2">
              {getFormTypeIcon(form.form_type)}
              <CardTitle className="w-auto truncate font-normal ...">
                {form.title}
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground mt-3">
            <div className="flex items-end gap-2 justify-between w-full">
                <div className="flex flex-col items-center gap-2">
                    {getStatusBadge(form.status || 'draft')}
                    {variant === 'user' && getSubmitStatusBadge(form)}
                </div>
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={form.owner?.avatar_url || ''} alt={form.owner?.name || ''} />
                        <AvatarFallback className="text-xs">
                        {form.owner?.name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <span>建立於 {formatRelativeTime(form.created_at as string)}</span>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  )

  const href = variant === 'user' 
    ? `/dashboard/forms/${form.id}`
    : `/dashboard/forms/${form.id}/edit`

  return (
    <Link href={href}>
      {cardContent}
    </Link>
  )
} 