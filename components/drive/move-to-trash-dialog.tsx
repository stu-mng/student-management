import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import type { DriveFile } from "./types"

interface MoveToTrashDialogProps {
  show: boolean
  file?: DriveFile
  isBulkMove: boolean
  selectedFiles: DriveFile[]
  onConfirm: () => void
  onCancel: () => void
  isMoving: boolean
}

export function MoveToTrashDialog({
  show,
  file,
  isBulkMove,
  selectedFiles,
  onConfirm,
  onCancel,
  isMoving
}: MoveToTrashDialogProps) {
  const getTitle = () => {
    if (isBulkMove) {
      return `移至垃圾桶 (${selectedFiles.length} 個項目)`
    }
    return `移至垃圾桶`
  }

  const getDescription = () => {
    if (isBulkMove) {
      return `確定要將選取的 ${selectedFiles.length} 個檔案/資料夾移至垃圾桶嗎？此操作可以復原。`
    }
    if (file) {
      const itemType = file.mimeType.includes('folder') ? '資料夾' : '檔案'
      return `確定要將${itemType}「${file.name}」移至垃圾桶嗎？此操作可以復原。`
    }
    return '確定要將此項目移至垃圾桶嗎？此操作可以復原。'
  }

  return (
    <AlertDialog open={show} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-orange-600" />
            <span>{getTitle()}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isMoving}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isMoving}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isMoving ? '處理中...' : '移至垃圾桶'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
