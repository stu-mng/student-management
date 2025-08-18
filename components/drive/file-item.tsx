import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Archive,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  Folder,
  Image as ImageIcon,
  Music,
  Presentation,
  Video
} from "lucide-react"
import Image from "next/image"
import { useDragDrop } from "./drag-drop-context"
import type { DriveFile } from "./types"
import { formatDate, formatFileSize, getFileTypeLabel } from "./utils"

interface FileItemProps {
  file: DriveFile
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: (fileId: string) => void
  onClick: (file: DriveFile) => void
  onContextMenu: (e: React.MouseEvent, file: DriveFile) => void
  onPreview: (file: DriveFile) => void
  onDownload: (file: DriveFile) => void
  onEnterFolder: (fileId: string, fileName: string) => void
}

export function FileItem({
  file,
  viewMode,
  isSelected,
  onSelect,
  onClick,
  onContextMenu,
  onPreview,
  onDownload,
  onEnterFolder
}: FileItemProps) {
  const { setDraggedItem, setIsDragging, hasContext } = useDragDrop();

  const handleDragStart = (e: React.DragEvent) => {
    if (!hasContext) return;
    
    e.stopPropagation();
    setDraggedItem(file);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
  };

  const handleDragEnd = () => {
    if (!hasContext) return;
    
    setDraggedItem(null);
    setIsDragging(false);
  };

  const renderFileIcon = () => {
    if (file.mimeType.includes('folder')) return <Folder className="h-6 w-6 text-blue-500" />
    if (file.mimeType.includes('document')) return <FileText className="h-6 w-6 text-green-500" />
    if (file.mimeType.includes('spreadsheet')) return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
    if (file.mimeType.includes('presentation')) return <Presentation className="h-6 w-6 text-orange-500" />
    if (file.mimeType.includes('image')) return <ImageIcon className="h-6 w-6 text-purple-500" />
    if (file.mimeType.includes('video')) return <Video className="h-6 w-6 text-red-500" />
    if (file.mimeType.includes('audio')) return <Music className="h-4 w-4 text-pink-500" />
    if (file.mimeType.includes('zip') || file.mimeType.includes('rar')) return <Archive className="h-6 w-6 text-gray-500" />
    return <File className="h-6 w-6 text-gray-500" />
  }

  const renderThumbnail = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="w-full h-32 bg-muted/20 overflow-hidden rounded-t-lg">
          <Image
            src={`/api/drive/image/${file.id}`}
            alt={`Thumbnail for ${file.name}`}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center">
                    ${renderFileIcon()}
                  </div>
                `
              }
            }}
          />
        </div>
      )
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
            <FileText className="h-10 w-10 text-red-600" />
          </div>
          <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            PDF
          </div>
        </div>
      )
    }

    if (file.mimeType.includes('document')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-blue-50">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-10 w-10 text-blue-600" />
          </div>
          <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            DOC
          </div>
        </div>
      )
    }

    if (file.mimeType.includes('spreadsheet')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-green-50">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
            <FileText className="h-10 w-10 text-green-600" />
          </div>
          <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            SHEET
          </div>
        </div>
      )
    }

    if (file.mimeType.includes('presentation')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-orange-50">
          <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
            <Presentation className="h-10 w-10 text-orange-600" />
          </div>
          <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
            SLIDE
          </div>
        </div>
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        {renderFileIcon()}
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          "grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors duration-150 cursor-pointer group min-h-[56px]",
          isSelected && "bg-primary/5 border-primary/20"
        )}
        onClick={() => onClick(file)}
        onContextMenu={(e) => onContextMenu(e, file)}
        draggable={hasContext}
        onDragStart={hasContext ? handleDragStart : undefined}
        onDragEnd={hasContext ? handleDragEnd : undefined}
      >
        {/* 選擇框 */}
        <div className="col-span-1 flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onSelect(file.id)
            }}
            className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
          />
        </div>

        {/* 檔案圖示和名稱 */}
        <div className="col-span-5 flex items-center space-x-3">
          <div className="flex-shrink-0">
            {renderFileIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {file.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {getFileTypeLabel(file.mimeType)}
            </div>
          </div>
        </div>

        {/* 修改時間 */}
        <div className="col-span-3 flex items-center text-sm text-muted-foreground">
          {formatDate(file.createdTime)}
        </div>

        {/* 檔案大小 */}
        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
          {file.mimeType.includes('folder') ? '-' : (file.size || 'N/A')}
        </div>

        {/* 操作按鈕 */}
        <div className="col-span-1 flex items-center justify-end">
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {file.mimeType.includes('folder') ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onEnterFolder(file.id, file.name)
                }}
                className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                title="開啟資料夾"
              >
                <Folder className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview(file)
                  }}
                  className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                  title="預覽檔案"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload(file)
                  }}
                  className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                  title="下載檔案"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
              title="更多選項"
            >
              <span className="text-lg leading-none">⋯</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-lg hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer aspect-square min-w-0",
        isSelected && "border-primary bg-primary/5"
      )}
      onClick={() => onClick(file)}
      onContextMenu={(e) => onContextMenu(e, file)}
      draggable={hasContext}
      onDragStart={hasContext ? handleDragStart : undefined}
      onDragEnd={hasContext ? handleDragEnd : undefined}
    >
      {/* 選擇框 */}
      <div className="absolute top-2 left-2 z-20">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation()
            onSelect(file.id)
          }}
          className="h-4 w-4 text-primary rounded border-border focus:ring-primary bg-background"
        />
      </div>

      {/* 檔案內容 - Google Drive 風格佈局 */}
      <div className="flex flex-col h-full">
        {/* 縮圖區域 - 覆蓋上半部分 */}
        <div className="flex-1 relative bg-muted/20 border-b border-border">
          {renderThumbnail()}
        </div>
        
        {/* 檔案信息區域 - 下半部分 */}
        <div className="p-3 text-center flex-shrink-0">
          <h3 className="text-sm font-medium text-foreground mb-2 truncate px-1">
            {file.name}
          </h3>
          <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
            <span className="truncate">{getFileTypeLabel(file.mimeType)}</span>
            <span>•</span>
            <span className="truncate">{formatDate(file.createdTime)}</span>
            {file.size && file.size !== 'N/A' && (
              <>
                <span>•</span>
                <span className="truncate">{formatFileSize(file.size)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 懸停操作按鈕 */}
      <div className="absolute inset-0 bg-background/95 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
        <div className="flex flex-col space-y-2 pointer-events-auto">
          {file.mimeType.includes('folder') ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEnterFolder(file.id, file.name)
              }}
              className="bg-card text-foreground hover:bg-accent border border-border"
            >
              <Folder className="h-4 w-4 mr-1" />
              開啟
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(file)
                }}
                className="bg-card text-foreground hover:bg-accent border border-border"
              >
                <Eye className="h-4 w-4 mr-1" />
                預覽
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload(file)
                }}
                className="bg-card text-foreground hover:bg-accent border border-border"
              >
                <Download className="h-4 w-4 mr-1" />
                下載
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
