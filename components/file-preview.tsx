"use client"

import { Button } from '@/components/ui/button'
import { ExternalLink, X } from 'lucide-react'
import { FilePreviewContent } from './file-preview-content'

interface FilePreviewProps {
  file: {
    id: string
    name: string
    mimeType: string
    size?: string
    webViewLink?: string
  }
  onClose: () => void
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const handleDownload = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank')
    }
  }

  const handleOpenInDrive = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank')
    }
  }

  const getFileTypeIcon = () => {
    if (file.mimeType.startsWith('image/')) return '🖼️'
    if (file.mimeType === 'application/pdf') return '📄'
    if (file.mimeType.startsWith('text/') || 
        file.mimeType === 'text/markdown' || 
        file.mimeType === 'text/x-markdown' ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.markdown')) return '📝'
    if (file.mimeType.includes('document')) return '📘'
    if (file.mimeType.includes('spreadsheet')) return '📊'
    if (file.mimeType.includes('presentation')) return '📽️'
    if (file.mimeType.includes('video/')) return '🎥'
    if (file.mimeType.includes('audio/')) return '🎵'
    if (file.mimeType.includes('zip') || file.mimeType.includes('rar')) return '📦'
    if (file.mimeType.includes('folder')) return '📁'
    return '📄'
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-6xl w-full mx-4 h-[90vh] overflow-hidden flex flex-col">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getFileTypeIcon()}</div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{file.name}</h2>
              <p className="text-sm text-muted-foreground">
                {file.size && `${file.size} • `}{getFileTypeLabel(file.mimeType)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {file.webViewLink && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInDrive}
                  title="在 Google Drive 中開啟"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  在 Drive 中開啟
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  title="下載檔案"
                >
                  下載
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 預覽內容 */}
        <div className="flex-1 overflow-hidden">
          <FilePreviewContent 
            file={file}
            onDownload={handleDownload}
            onRetry={() => {
              // 重新加载预览内容
              window.location.reload()
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Helper function to get file type label
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
