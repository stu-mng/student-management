"use client"

import { FilePreviewContent } from "@/components/file-preview-content"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-utils"
import { cn } from "@/lib/utils"
import { Archive, ChevronDown, ChevronRight, Download, ExternalLink, File, FileText, Folder, Image, Music, User, Video, X } from "lucide-react"
import { useEffect, useState } from "react"

interface SubmissionResponse {
  requirement_id: string
  requirement_name: string
  value: string | null
  file_url?: string
  file_id?: string
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

interface DrivePreviewResponse {
  success: boolean
  file?: {
    name: string
    mimeType: string
    size: string
    webViewLink: string
  }
  error?: string
}

interface AllSubmissionsPreviewProps {
  responses: TaskResponse[]
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



// 獲取文件類型圖標 (完全按照 drive 頁面)
const getFileTypeIcon = (mimeType: string, className: string = "h-6 w-6") => {
  if (mimeType.includes('folder')) return <Folder className={`${className} text-blue-500`} />
  if (mimeType.includes('document')) return <FileText className={`${className} text-green-500`} />
  if (mimeType.includes('spreadsheet')) return <FileText className={`${className} text-emerald-500`} />
  if (mimeType.includes('presentation')) return <FileText className={`${className} text-orange-500`} />
  if (mimeType.includes('image')) return <Image className={`${className} text-purple-500`} />
  if (mimeType.includes('video')) return <Video className={`${className} text-red-500`} />
  if (mimeType.includes('audio')) return <Music className={`${className} text-pink-500`} />
  if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className={`${className} text-gray-500`} />
  if (mimeType.startsWith('text/') || 
      mimeType === 'text/markdown' || 
      mimeType === 'text/x-markdown') return <FileText className={`${className} text-blue-500`} />
  return <File className={`${className} text-gray-500`} />
}

// 獲取文件縮圖 (完全按照 drive 頁面)
const getFileThumbnail = (mimeType: string, fileName: string, fileId?: string) => {
  if (mimeType.startsWith('image/') && fileId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-purple-50">
        <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      </div>
    )
  }

  if (mimeType === 'application/pdf') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-red-600" />
        </div>
        <div className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
          PDF
        </div>
      </div>
    )
  }

  if (mimeType.includes('document')) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-blue-50">
        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
          DOC
        </div>
      </div>
    )
  }

  if (mimeType.includes('spreadsheet')) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-green-50">
        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-green-600" />
        </div>
        <div className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
          SHEET
        </div>
      </div>
    )
  }

  if (mimeType.includes('presentation')) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-orange-50">
        <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-orange-600" />
        </div>
        <div className="absolute bottom-1 right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded">
          SLIDE
        </div>
      </div>
    )
  }

  if (mimeType.startsWith('text/') || 
      mimeType === 'text/markdown' || 
      mimeType === 'text/x-markdown') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cyan-50">
        <div className="w-8 h-8 bg-cyan-100 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-cyan-600" />
        </div>
        <div className="absolute bottom-1 right-1 bg-cyan-500 text-white text-xs px-1 py-0.5 rounded">
          {fileName.toLowerCase().endsWith('.md') || fileName.toLowerCase().endsWith('.markdown') ? 'MD' : 'TXT'}
        </div>
      </div>
    )
  }

  if (mimeType.startsWith('video/')) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
          <Video className="h-5 w-5 text-red-600" />
        </div>
        <div className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
          {mimeType.includes('mp4') ? 'MP4' : 
           mimeType.includes('avi') ? 'AVI' : 
           mimeType.includes('mov') ? 'MOV' : 
           mimeType.includes('wmv') ? 'WMV' : 'VID'}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/20">
      {getFileTypeIcon(mimeType)}
    </div>
  )
}

export function AllSubmissionsPreview({ responses, onClose }: AllSubmissionsPreviewProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [currentFile, setCurrentFile] = useState<{
    id: string
    name: string
    mimeType: string
    webViewLink: string
    size?: string
  } | null>(null)

  // 初始化展開第一個用戶
  useEffect(() => {
    if (responses.length > 0) {
      setExpandedUsers(new Set([responses[0].id]))
    }
  }, [responses])

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleFilePreview = async (fileUrl: string, fileName: string, fileId?: string) => {
    // 使用传入的 fileId 或从 URL 中提取
    const actualFileId = fileId || fileUrl.match(/\/api\/drive\/content\/([a-zA-Z0-9-_]+)/)?.[1]
    if (actualFileId) {
      
      try {
        // 嘗試獲取文件信息
        const response = await apiClient.get<DrivePreviewResponse>(`/api/drive/preview/${actualFileId}`)
        if (response.data.success && response.data.file) {
          setCurrentFile({
            id: actualFileId,
            name: response.data.file.name || fileName, // 优先使用实际文件名
            mimeType: response.data.file.mimeType,
            webViewLink: `https://drive.google.com/file/d/${actualFileId}/view`,
            size: response.data.file.size
          })
        } else {
          // 如果API失敗，嘗試從文件名推斷類型
          const inferredMimeType = inferMimeTypeFromFileName(fileName)
          setCurrentFile({
            id: actualFileId,
            name: fileName,
            mimeType: inferredMimeType,
            webViewLink: `https://drive.google.com/file/d/${actualFileId}/view`
          })
        }
      } catch (err) {
        console.error('獲取文件信息失敗:', err)
        // 使用文件名推斷類型
        const inferredMimeType = inferMimeTypeFromFileName(fileName)
        setCurrentFile({
          id: actualFileId,
          name: fileName,
          mimeType: inferredMimeType,
          webViewLink: `https://drive.google.com/file/d/${actualFileId}/view`
        })
      }
    } else {
      // 如果不是API URL，顯示錯誤信息
      console.error('不支援此類型的檔案連結:', fileUrl)
      setCurrentFile(null)
    }
  }

  // 從文件名推斷 MIME 類型
  const inferMimeTypeFromFileName = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop()
    
    // 影片格式
    if (['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'flv', 'm4v'].includes(extension || '')) {
      return `video/${extension}`
    }
    
    // 音頻格式
    if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].includes(extension || '')) {
      return `audio/${extension}`
    }
    
    // 圖片格式
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension || '')) {
      return `image/${extension}`
    }
    
    // 文檔格式
    if (['pdf'].includes(extension || '')) {
      return 'application/pdf'
    }
    
    if (['doc', 'docx'].includes(extension || '')) {
      return 'application/msword'
    }
    
    if (['xls', 'xlsx'].includes(extension || '')) {
      return 'application/vnd.ms-excel'
    }
    
    if (['ppt', 'pptx'].includes(extension || '')) {
      return 'application/vnd.ms-powerpoint'
    }
    
    if (['txt', 'md'].includes(extension || '')) {
      return 'text/plain'
    }
    
    // 壓縮格式
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return 'application/zip'
    }
    
    // 默認
    return 'application/octet-stream'
  }

  const handleDownload = (fileId: string, fileName: string) => {
    const downloadUrl = `https://drive.usercontent.google.com/u/0/uc?id=${fileId}&export=download`
    window.open(downloadUrl, '_blank')
  }

  const handleOpenInDrive = () => {
    if (currentFile?.webViewLink) {
      window.open(currentFile.webViewLink, '_blank')
    }
  }



  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-lg shadow-lg max-w-7xl w-full mx-4 h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                所有提交 ({responses.length} 位用戶)
              </h2>
              <p className="text-sm text-muted-foreground">
                當前: {currentFile?.name || '選擇文件以預覽'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
                  onClick={handleDownload.bind(null, currentFile.id, currentFile.name)}
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
          {/* 左側：可折疊的用戶和文件列表 */}
          <div className="w-80 border-r border-border overflow-y-auto">
            <div className="p-4 space-y-2">
              {responses.map((response) => {
                const isExpanded = expandedUsers.has(response.id)
                const filesInResponse = response.responses.filter(resp => resp.file_url)
                
                return (
                  <div key={response.id} className="space-y-1">
                    {/* 用戶標題 - 可點擊展開/收合 */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => toggleUserExpansion(response.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {response.user.name || response.user.email}
                        </span>
                      </div>
                      <Badge 
                        className={cn(
                          "text-xs", 
                          responseStatusColors[response.submission_status]
                        )}
                      >
                        {responseStatusLabels[response.submission_status]}
                      </Badge>
                    </div>
                    
                    {/* 文件列表 - 當用戶展開時顯示 */}
                    {isExpanded && (
                      <div className="ml-6 space-y-1">
                        {filesInResponse.map((resp, index) => {
                          // 从 API URL 中提取文件 ID
                          const fileIdMatch = resp.file_url?.match(/\/api\/drive\/content\/([a-zA-Z0-9-_]+)/)
                          const fileId = fileIdMatch ? fileIdMatch[1] : resp.file_id
                          
                          return (
                            <div 
                              key={resp.requirement_id}
                              className={cn(
                                "flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors",
                                currentFile?.id === fileId
                                  ? "border-blue-500 bg-blue-50 hover:bg-blue-100" // 当前选中的文件 - 蓝色主题
                                  : "border-border hover:bg-muted/20" // 未选中的文件
                              )}
                              onClick={() => handleFilePreview(resp.file_url!, resp.requirement_name, fileId)}
                            >
                              {/* 文件縮圖 */}
                              <div className="w-8 h-8 relative bg-muted/20 rounded border flex-shrink-0">
                                {getFileThumbnail(inferMimeTypeFromFileName(resp.requirement_name), resp.requirement_name, fileId)}
                              </div>
                              
                              {/* 文件信息 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                  <span className="text-sm font-medium truncate">
                                    {resp.requirement_name}
                                    {fileId && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        (ID: {fileId})
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-blue-600">
                                  <FileText className="h-3 w-3" />
                                  <span>點擊預覽</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        
                        {filesInResponse.length === 0 && (
                          <div className="p-2 text-xs text-muted-foreground italic">
                            沒有文件提交
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 右側：文件預覽區域 */}
          <div className="flex-1 overflow-hidden">
            {currentFile ? (
                <FilePreviewContent 
                  file={currentFile}
                  onDownload={() => handleDownload(currentFile.id, currentFile.name)}
                  onRetry={() => {
                    // 重新加载预览内容
                    window.location.reload()
                  }}
                />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="text-6xl">📁</div>
                  <p className="text-muted-foreground">選擇文件以預覽</p>
                  <div className="text-xs text-muted-foreground max-w-md">
                    <p>支援的文件類型：</p>
                    <p>📹 影片：MP4, AVI, MOV, WMV, WebM, MKV, FLV, M4V</p>
                    <p>📄 文檔：PDF, DOC, XLS, PPT, TXT, MD</p>
                    <p>🖼️ 圖片：JPG, PNG, GIF, SVG, WebP</p>
                    <p>🎵 音頻：MP3, WAV, AAC, OGG, FLAC</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
