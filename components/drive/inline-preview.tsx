"use client"

import { FilePreviewContent } from '@/components/file-preview-content'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Download, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import type { DriveFile } from './types'

interface InlinePreviewProps {
  file: DriveFile
  isOpen: boolean
  onClose: () => void
  onDownload: (file: DriveFile) => void
  className?: string
}

export function InlinePreview({ 
  file, 
  isOpen, 
  onClose, 
  onDownload, 
  className = "" 
}: InlinePreviewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!isOpen || file.mimeType.includes('folder')) return null

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // 延迟一下再关闭，让用户看到刷新状态
    setTimeout(() => {
      setIsRefreshing(false)
    }, 500)
  }

  const handleDownload = () => {
    onDownload(file)
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={cn(
        "bg-card border border-border rounded-lg shadow-lg max-w-5xl w-full mx-4 h-[85vh] overflow-hidden flex flex-col",
        className
      )}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">
                {getFileTypeIcon(file.mimeType, file.name)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {file.size && `${file.size} • `}{getFileTypeLabel(file.mimeType)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 px-3"
            >
              <Download className="h-4 w-4 mr-2" />
              下載
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 px-3"
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-2",
                isRefreshing && "animate-spin"
              )} />
              重新整理
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 预览内容 */}
        <div className="flex-1 overflow-hidden bg-muted/10">
          <FilePreviewContent 
            file={file}
            onDownload={handleDownload}
            onRetry={handleRefresh}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}

// 辅助函数：获取文件类型图标
function getFileTypeIcon(mimeType: string, fileName: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('text/') || 
      mimeType === 'text/markdown' || 
      mimeType === 'text/x-markdown' ||
      fileName.toLowerCase().endsWith('.md') ||
      fileName.toLowerCase().endsWith('.markdown')) return '📝'
  if (mimeType.includes('document')) return '📘'
  if (mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('presentation')) return '📽️'
  if (mimeType.includes('video/')) return '🎥'
  if (mimeType.includes('audio/')) return '🎵'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦'
  return '📄'
}

// 辅助函数：获取文件类型标签
function getFileTypeLabel(mimeType: string): string {
  if (mimeType.includes('folder')) return '資料夾'
  if (mimeType.includes('document')) return 'Google 文件'
  if (mimeType.includes('spreadsheet')) return 'Google 試算表'
  if (mimeType.includes('presentation')) return 'Google 簡報'
  if (mimeType.startsWith('image/')) return '圖片'
  if (mimeType === 'application/pdf') return 'PDF 文件'
  if (mimeType.startsWith('text/') || 
      mimeType === 'text/markdown' || 
      mimeType === 'text/x-markdown') return '文字文件'
  if (mimeType.includes('video/')) return '影片'
  if (mimeType.includes('audio/')) return '音訊'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '壓縮檔'
  return '檔案'
}
