import { Button } from "@/components/ui/button"
import { Download, Info, Share2, Trash2 } from "lucide-react"

interface SelectionToolbarProps {
  selectedFilesCount: number
  onClearSelection: () => void
  onBulkDelete: () => void
}

export function SelectionToolbar({
  selectedFilesCount,
  onClearSelection,
  onBulkDelete
}: SelectionToolbarProps) {
  return (
    <div className="h-[72px] transition-all duration-200 ease-in-out">
      {selectedFilesCount > 0 ? (
        // 有選擇檔案時顯示操作按鈕
        <div className="flex items-center space-x-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm text-primary font-medium">
            已選擇 {selectedFilesCount} 個檔案
          </span>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            下載
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            分享
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onBulkDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            刪除
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            取消選擇
          </Button>
        </div>
      ) : (
        // 沒有選擇檔案時只顯示提示信息
        <div className="flex items-center p-4 bg-muted/20 border border-border rounded-lg">
          <div className="flex items-center space-x-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              選擇檔案以進行批量操作，或使用快速功能
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
