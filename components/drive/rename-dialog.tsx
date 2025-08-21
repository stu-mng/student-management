import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { DriveFile } from './types'

interface RenameDialogProps {
  show: boolean
  file: DriveFile | null
  onConfirm: (newName: string) => Promise<void>
  onCancel: () => void
  isRenaming: boolean
}

export function RenameDialog({
  show,
  file,
  onConfirm,
  onCancel,
  isRenaming
}: RenameDialogProps) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (show && file) {
      setNewName(file.name)
      setError('')
    }
  }, [show, file])

  const handleConfirm = async () => {
    if (!newName.trim()) {
      setError('名稱不能為空')
      return
    }

    if (newName === file?.name) {
      onCancel()
      return
    }

    try {
      await onConfirm(newName.trim())
    } catch (error) {
      setError('重新命名失敗，請重試')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  if (!show || !file) return null

  return (
    <Dialog open={show} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>重新命名</DialogTitle>
          <DialogDescription>
            為 {file.mimeType.includes('folder') ? '資料夾' : '檔案'} 輸入新名稱
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              名稱
            </Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="col-span-3"
              placeholder="輸入新名稱"
              disabled={isRenaming}
              autoFocus
            />
          </div>
          {error && (
            <div className="text-sm text-destructive text-center">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isRenaming}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isRenaming || !newName.trim() || newName === file.name}
          >
            {isRenaming ? '重新命名中...' : '重新命名'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}




