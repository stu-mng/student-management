"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SmartImage } from "@/components/ui/smart-image"
import { cn } from "@/lib/utils"
import { CheckCircle, Download, ExternalLink, FileText, RefreshCw, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface SubmissionResponse {
  requirement_id: string
  requirement_name: string
  value: string | null
  file_url?: string
}

interface TaskResponse {
  id: string
  user: {
    id: string
    name: string | null
    email: string
    role: {
      display_name: string
    }
  }
  submission_status: 'draft' | 'submitted' | 'reviewed' | 'approved'
  submitted_at: string | null
  responses: SubmissionResponse[]
}

interface SubmissionPreviewProps {
  response: TaskResponse
  onClose: () => void
}

const responseStatusColors = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-800",
  reviewed: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800"
}

const responseStatusLabels = {
  draft: "草稿",
  submitted: "已提交",
  reviewed: "已審查",
  approved: "已批准"
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "未提交"
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 獲取文件類型圖標
const getFileTypeIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('document')) return '📝'
  if (mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('presentation')) return '📽️'
  if (mimeType.includes('video/')) return '🎥'
  if (mimeType.includes('audio/')) return '🎵'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦'
  if (mimeType.startsWith('text/') || 
      mimeType === 'text/markdown' || 
      mimeType === 'text/x-markdown') return '📝'
  return '📁'
}

export function SubmissionPreview({ response, onClose }: SubmissionPreviewProps) {
  const [currentFile, setCurrentFile] = useState<{
    id: string
    name: string
    mimeType: string
    webViewLink: string
    size?: string
  } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePreviewUrl = useCallback(async () => {
    if (!currentFile) return
    
    setLoading(true)
    setError(null)
    
    try {
      if (currentFile.mimeType.startsWith('image/')) {
        // 圖片使用專門的預覽 API
        try {
          const response = await fetch(`/api/drive/preview-image/${currentFile.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.previewUrls) {
              // 優先使用我們的圖片代理 API，最可靠
              setPreviewUrl(data.previewUrls.api)
              setLoading(false)
            } else {
              throw new Error(data.error || '無法獲取圖片預覽信息')
            }
          } else {
            throw new Error('圖片預覽 API 請求失敗')
          }
        } catch (err) {
          console.error('圖片預覽 API 失敗，使用備用方法:', err)
          // 備用方法：直接使用 Google Drive URL
          const fallbackUrl = `https://drive.google.com/uc?export=view&id=${currentFile.id}`
          setPreviewUrl(fallbackUrl)
          setLoading(false)
          setError(null) // 清除之前的錯誤
        }
      } else if (currentFile.mimeType === 'application/pdf') {
        // PDF 使用 Google Drive 的 PDF 預覽
        const pdfUrl = `https://drive.google.com/file/d/${currentFile.id}/preview`
        setPreviewUrl(pdfUrl)
        setLoading(false)
      } else if (currentFile.mimeType.startsWith('text/') || 
                 currentFile.mimeType === 'text/markdown' || 
                 currentFile.mimeType === 'text/x-markdown' ||
                 currentFile.name.toLowerCase().endsWith('.md') ||
                 currentFile.name.toLowerCase().endsWith('.markdown')) {
        // 文本文件、markdown 文件需要下載內容
        try {
          const response = await fetch(`/api/drive/content/${currentFile.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.content) {
              setPreviewUrl(data.content)
            } else {
              setError('無法載入文本內容')
            }
          } else {
            setError('無法載入文本內容')
          }
        } catch (err) {
          setError('載入文本內容時發生錯誤')
        }
        setLoading(false)
      } else if (currentFile.mimeType.includes('document')) {
        // Google Docs 使用嵌入預覽
        const embedUrl = `https://docs.google.com/document/d/${currentFile.id}/preview`
        setPreviewUrl(embedUrl)
        setLoading(false)
      } else if (currentFile.mimeType.includes('spreadsheet')) {
        // Google Sheets 使用嵌入預覽
        const embedUrl = `https://docs.google.com/spreadsheets/d/${currentFile.id}/preview`
        setPreviewUrl(embedUrl)
        setLoading(false)
      } else if (currentFile.mimeType.includes('presentation')) {
        // Google Slides 使用嵌入預覽
        const embedUrl = `https://docs.google.com/presentation/d/${currentFile.id}/preview`
        setPreviewUrl(embedUrl)
        setLoading(false)
      } else {
        // 其他文件類型顯示下載選項
        setError('此檔案類型不支援預覽，請下載後查看')
        setLoading(false)
      }
    } catch (err) {
      setError('預覽檔案時發生錯誤')
      setLoading(false)
    }
  }, [currentFile])

  useEffect(() => {
    if (!currentFile) return

    // 根據檔案類型生成預覽 URL
    generatePreviewUrl()
  }, [currentFile, generatePreviewUrl])

  const handleFilePreview = async (fileUrl: string, fileName: string) => {
    // 從Google Drive URL中提取文件ID
    const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
    if (fileIdMatch) {
      const fileId = fileIdMatch[1]
      
      try {
        // 嘗試獲取文件信息
        const response = await fetch(`/api/drive/preview/${fileId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.file) {
            setCurrentFile({
              id: fileId,
              name: fileName,
              mimeType: data.file.mimeType,
              webViewLink: fileUrl,
              size: data.file.size
            })
          } else {
            // 如果API失敗，使用默認值
            setCurrentFile({
              id: fileId,
              name: fileName,
              mimeType: 'application/pdf', // 默認值
              webViewLink: fileUrl
            })
          }
        } else {
          // 如果API失敗，使用默認值
          setCurrentFile({
            id: fileId,
            name: fileName,
            mimeType: 'application/pdf', // 默認值
            webViewLink: fileUrl
          })
        }
      } catch (err) {
        console.error('獲取文件信息失敗:', err)
        // 使用默認值
        setCurrentFile({
          id: fileId,
          name: fileName,
          mimeType: 'application/pdf', // 默認值
          webViewLink: fileUrl
        })
      }
    } else {
      // 如果不是Google Drive文件，顯示錯誤信息
      setError('不支援此類型的檔案連結')
      setCurrentFile(null)
      setPreviewUrl(null)
    }
  }

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  const handleOpenInDrive = () => {
    if (currentFile?.webViewLink) {
      window.open(currentFile.webViewLink, '_blank')
    }
  }

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">載入預覽中...</p>
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
            {currentFile && (
              <div className="flex items-center space-x-2">
                <Button onClick={handleDownload.bind(null, currentFile.webViewLink, currentFile.name)} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下載檔案
                </Button>
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
              </div>
            )}
          </div>
        </div>
      )
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="text-6xl">{currentFile ? getFileTypeIcon(currentFile.mimeType) : '📁'}</div>
            <p className="text-muted-foreground">選擇文件以預覽</p>
          </div>
        </div>
      )
    }

    if (currentFile?.mimeType.startsWith('image/')) {
      return (
        <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center relative">
          <div className="flex items-center justify-center w-full h-full p-4">
            <SmartImage
              src={previewUrl}
              alt={currentFile.name}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              onError={() => {
                console.error('圖片載入失敗:', previewUrl)
                setError('圖片載入失敗，可能是權限問題或檔案損壞')
                setLoading(false)
              }}
              onLoad={() => {
                console.log('圖片載入成功:', previewUrl)
                setLoading(false)
              }}
              priority
            />
          </div>
        </div>
      )
    }

    if (currentFile?.mimeType === 'application/pdf') {
      return (
        <div className="w-full h-full bg-muted/20 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={currentFile.name}
          />
        </div>
      )
    }

    if (currentFile?.mimeType.startsWith('text/') || 
        currentFile?.mimeType === 'text/markdown' || 
        currentFile?.mimeType === 'text/x-markdown' ||
        currentFile?.name.toLowerCase().endsWith('.md') ||
        currentFile?.name.toLowerCase().endsWith('.markdown')) {
      return (
        <div className="w-full h-full bg-muted/20 rounded-lg overflow-auto p-4">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
            {previewUrl}
          </pre>
        </div>
      )
    }

    if (currentFile?.mimeType.includes('document') || 
        currentFile?.mimeType.includes('spreadsheet') || 
        currentFile?.mimeType.includes('presentation')) {
      return (
        <div className="w-full h-full bg-muted/20 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={currentFile.name}
          />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="text-6xl">{currentFile ? getFileTypeIcon(currentFile.mimeType) : '📄'}</div>
          <p className="text-muted-foreground">此檔案類型不支援預覽</p>
          <Button onClick={handleDownload.bind(null, currentFile?.webViewLink || '', currentFile?.name || '')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            下載檔案
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-lg shadow-lg max-w-6xl w-full mx-4 h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {response.user.name || response.user.email}
              </h2>
              <p className="text-sm text-muted-foreground">
                {response.user.role.display_name} • {formatDate(response.submitted_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={cn(responseStatusColors[response.submission_status])}>
              {responseStatusLabels[response.submission_status]}
            </Badge>
            {currentFile && (
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
                  onClick={handleDownload.bind(null, currentFile.webViewLink, currentFile.name)}
                  title="下載檔案"
                >
                  <Download className="h-4 w-4 mr-2" />
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

        {/* 內容區域 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左側：提交內容列表 */}
          <div className="w-80 border-r border-border overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="text-sm font-medium text-muted-foreground">
                提交內容 ({response.responses.length} 項)
              </div>
              {response.responses.map((resp, index) => (
                <div 
                  key={resp.requirement_id} 
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    currentFile && resp.file_url && resp.file_url.includes(currentFile.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-border hover:border-border/60"
                  )}
                  onClick={() => {
                    if (resp.file_url) {
                      handleFilePreview(resp.file_url, resp.requirement_name)
                    }
                  }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm font-medium">{resp.requirement_name}</span>
                  </div>
                  {resp.file_url ? (
                    <div className="flex items-center space-x-2 text-xs text-blue-600">
                      <FileText className="h-3 w-3" />
                      <span>點擊預覽檔案</span>
                    </div>
                  ) : resp.value ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {resp.value}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      未填寫
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 右側：文件預覽區域 */}
          <div className="flex-1 overflow-hidden">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  )
}

