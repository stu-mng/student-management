import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Trash2 } from "lucide-react"
import type { DriveFile } from "./types"

interface DeleteConfirmationDialogProps {
  show: boolean
  file?: DriveFile
  isBulkDelete?: boolean
  selectedFiles?: DriveFile[]
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export function DeleteConfirmationDialog({
  show,
  file,
  isBulkDelete = false,
  selectedFiles = [],
  onConfirm,
  onCancel,
  isDeleting = false
}: DeleteConfirmationDialogProps) {
  if (!show) return null

  const isFolder = file?.mimeType === 'application/vnd.google-apps.folder'
  const title = isBulkDelete 
    ? `移至垃圾桶 (${selectedFiles.length} 個檔案)`
    : `移至垃圾桶 (${isFolder ? '資料夾' : '檔案'})`
  
  const description = isBulkDelete
    ? `確定要將以下 ${selectedFiles.length} 個檔案移至垃圾桶嗎？\n\n${selectedFiles.map(f => f.name).join(', ')}\n\n您可以稍後從垃圾桶恢復這些檔案。`
    : `確定要將 "${file?.name}" 移至垃圾桶嗎？\n\n${isFolder ? '此資料夾及其所有內容將被移至垃圾桶。' : '此檔案將被移至垃圾桶。'}\n\n您可以稍後從垃圾桶恢復。`

  return (
    <Dialog open={show} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            取消
          </Button>
          <Button 
            variant="outline" 
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? '移至垃圾桶中...' : '移至垃圾桶'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
