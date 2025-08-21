import { Button } from "@/components/ui/button"
import { Folder, Plus, RefreshCw, Upload } from "lucide-react"

interface EmptyStateProps {
  isUploading: boolean
  isCreatingFolder: boolean
  onUpload: () => void
  onCreateFolder: () => void
}

export function EmptyState({
  isUploading,
  isCreatingFolder,
  onUpload,
  onCreateFolder
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <Folder className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">此資料夾是空的</h3>
              <p className="text-muted-foreground">上傳或建立新資料夾來開始使用</p>
      <p className="text-sm text-muted-foreground mt-2">或直接拖放檔案到此處</p>
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button 
          onClick={onUpload} 
          variant="outline" 
          size="sm"
          disabled={isUploading}
        >
          {isUploading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
                      {isUploading ? '上傳中...' : '上傳'}
        </Button>
        <Button 
          onClick={onCreateFolder} 
          variant="outline" 
          size="sm"
          disabled={isCreatingFolder}
        >
          {isCreatingFolder ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
                      {isCreatingFolder ? '建立中...' : '新資料夾'}
        </Button>
      </div>
    </div>
  )
}
