import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { Calendar, Eye, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import type { Task } from "./types"
import { statusColors, statusLabels } from "./types"

interface TaskCardProps {
  task: Task
  variant?: 'default' | 'active' | 'completed' | 'draft'
  onDelete?: (taskId: string) => Promise<void>
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "無截止期限"
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  })
}

const isOverdue = (dateString: string | null) => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

export function TaskCard({ task, variant = 'default', onDelete }: TaskCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getBorderColor = () => {
    switch (variant) {
      case 'active':
        return "border-l-green-500"
      case 'completed':
        return "border-l-gray-500"
      case 'draft':
        return "border-l-gray-500"
      default:
        return "border-l-green-500"
    }
  }

  const getCardClassName = () => {
    const baseClasses = "hover:shadow-lg transition-all duration-200 border-l-4 cursor-pointer group bg-white"
    return cn(
      baseClasses,
      getBorderColor(),
      variant === 'completed' && "opacity-75"
    )
  }

  const getBadgeContent = () => {
    switch (variant) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">進行中</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-600">已完成</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">草稿</Badge>
      default:
        return (
          <Badge className={cn("shrink-0", statusColors[task.status])}>
            {statusLabels[task.status]}
          </Badge>
        )
    }
  }

  const getHref = () => {
    if (variant === 'draft') {
      return `/dashboard/admin/tasks/${task.id}/edit`
    }
    return `/dashboard/admin/tasks/${task.id}`
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(task.id)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('刪除任務失敗:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className={getCardClassName()}>
        <Link href={getHref()} className="block">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 pr-4">
                <CardTitle className="text-lg font-semibold leading-tight text-gray-900">
                  {task.title}
                </CardTitle>
                {task.description && (
                  <CardDescription className="text-sm text-gray-600 line-clamp-2">
                    {task.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex flex-col items-end space-y-2">
                {getBadgeContent()}
                {task.submission_deadline && (
                  <div className="text-xs text-gray-500 text-right">
                    {formatDate(task.submission_deadline)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className={cn(
                    isOverdue(task.submission_deadline) && (variant === 'active' || (variant === 'default' && task.status === 'active'))
                      ? "text-red-600 font-medium" 
                      : "text-gray-600"
                  )}>
                    {formatDate(task.submission_deadline)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium text-gray-700">{task.responses_count || 0}/{task.total_assigned || 0}</span>
                  <span className="ml-1">已完成</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {variant === 'draft' ? (
                  <div className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded">
                    點擊編輯
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Eye className="h-3 w-3" />
                    <span>查看詳情</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="確認刪除任務"
        description={`確定要刪除任務「${task.title}」嗎？\n\n⚠️ 此操作無法撤銷！\n• 任務及其所有相關資料將被永久刪除\n• 所有用戶的回覆和提交記錄也將被刪除\n• 包括草稿、已提交和已審核的回覆`}
        confirmText="刪除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        loading={isDeleting}
      />
    </>
  )
}
