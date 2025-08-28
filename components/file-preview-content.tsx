"use client"

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Download, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface FilePreviewContentProps {
  file: {
    id: string
    name: string
    mimeType: string
    size?: string
    webViewLink?: string
  }
  onDownload?: () => void
  onRetry?: () => void
  className?: string
}

export function FilePreviewContent({ file, onDownload, onRetry, className = "" }: FilePreviewContentProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const generatePreviewUrl = useCallback(async () => {
    if (!file) return
    
    setLoading(true)
    setError(null)
    
    const url = `https://drive.google.com/file/d/${file.id}/preview`
    setPreviewUrl(url)
    setLoading(false)

  }, [file])

  useEffect(() => {
    if (!file) return
    generatePreviewUrl()
  }, [file, generatePreviewUrl])

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

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-8 mx-auto rounded-full" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex items-center space-x-2">
              {onDownload && (
                <Button onClick={onDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下載檔案
                </Button>
              )}
              {onRetry && (
                <Button 
                  onClick={async () => {
                    setError(null)
                    await generatePreviewUrl()
                  }} 
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重試預覽
                </Button>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="text-6xl">{getFileTypeIcon()}</div>
            <p className="text-muted-foreground">無法預覽此檔案</p>
            {onDownload && (
              <Button onClick={onDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                下載檔案
              </Button>
            )}
          </div>
        </div>
      )
    }
    return (
      <div className="w-full h-full bg-muted/20 overflow-hidden">
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title={file.name}
        />
      </div>
    )
  }

  return (
    <div className={cn("w-full h-full overflow-hidden", className)}>
      {renderPreview()}
    </div>
  )
}
