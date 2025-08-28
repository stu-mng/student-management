import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ArrowLeft, Edit, Pause, Play, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import type { TaskDetail } from "./types"

interface TaskDetailHeaderProps {
  task: TaskDetail
  taskId: string
  actionLoading: boolean
  onUpdateStatus: (status: string) => void
  onDelete?: (taskId: string) => Promise<void>
}

export function TaskDetailHeader({ 
  task, 
  taskId, 
  actionLoading, 
  onUpdateStatus,
  onDelete
}: TaskDetailHeaderProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(taskId)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('刪除任務失敗:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/admin/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回任務列表
            </Button>
          </Link>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/dashboard/admin/tasks/${taskId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              編輯
            </Button>
          </Link>
          
          {task.status === 'draft' && (
            <Button onClick={() => onUpdateStatus('active')} disabled={actionLoading}>
              <Play className="h-4 w-4 mr-2" />
              發布任務
            </Button>
          )}
          
          {task.status === 'active' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => onUpdateStatus('inactive')} 
                disabled={actionLoading}
              >
                <Pause className="h-4 w-4 mr-2" />
                關閉
              </Button>
            </>
          )}
          
          {task.status === 'inactive' && (
            <Button onClick={() => onUpdateStatus('active')} disabled={actionLoading}>
              <Play className="h-4 w-4 mr-2" />
              恢復
            </Button>
          )}

          {/* Delete button - only show for draft tasks */}
          {onDelete && (
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              刪除
            </Button>
          )}
        </div>
      </div>

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
