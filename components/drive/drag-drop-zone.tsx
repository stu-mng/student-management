import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"

interface DragDropZoneProps {
  isDragOver: boolean
  hasFiles: boolean
}

export function DragDropZone({ isDragOver, hasFiles }: DragDropZoneProps) {
  if (!hasFiles) return null

  return (
    <div className={cn(
      "text-center py-4 mb-4 border border-dashed rounded-lg transition-all duration-200",
      isDragOver 
        ? "bg-primary/10 border-primary" 
        : "bg-muted/20 border-border"
    )}>
      <Upload className={cn(
        "h-8 w-8 mx-auto mb-2 transition-colors duration-200",
        isDragOver ? "text-primary" : "text-muted-foreground"
      )} />
      <p className={cn(
        "text-sm transition-colors duration-200",
        isDragOver ? "text-primary font-medium" : "text-muted-foreground"
      )}>
        {isDragOver ? "放開以上傳檔案" : "拖放檔案到此處以上傳"}
      </p>
    </div>
  )
}
