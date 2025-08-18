import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw } from "lucide-react"

interface CreateFolderDialogProps {
  show: boolean
  folderName: string
  isCreating: boolean
  onFolderNameChange: (name: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function CreateFolderDialog({
  show,
  folderName,
  isCreating,
  onFolderNameChange,
  onConfirm,
  onCancel
}: CreateFolderDialogProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">建立新資料夾</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="folderName" className="block text-sm font-medium text-foreground mb-2">
              資料夾名稱
            </label>
            <Input
              id="folderName"
              type="text"
              placeholder="輸入資料夾名稱"
              value={folderName}
              onChange={(e) => onFolderNameChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onConfirm()}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isCreating}
            >
              取消
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!folderName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  建立中...
                </>
              ) : (
                '建立資料夾'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
