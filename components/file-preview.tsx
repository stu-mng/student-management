"use client"

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SmartImage } from '@/components/ui/smart-image'
import { Download, ExternalLink, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return

    setLoading(true)
    setError(null)

    // 根據檔案類型生成預覽 URL
    generatePreviewUrl()
  }, [file])

  const generatePreviewUrl = async () => {
    try {
      if (file.mimeType.startsWith('image/')) {
        // 圖片使用專門的預覽 API
        try {
          const response = await fetch(`/api/drive/preview-image/${file.id}`)
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
          const fallbackUrl = `https://drive.google.com/uc?export=view&id=${file.id}`
          setPreviewUrl(fallbackUrl)
          setLoading(false)
          setError(null) // 清除之前的錯誤
        }
      } else if (file.mimeType === 'application/pdf') {
        // PDF 使用 Google Drive 的 PDF 預覽
        const pdfUrl = `https://drive.google.com/file/d/${file.id}/preview`
        setPreviewUrl(pdfUrl)
        setLoading(false)
      } else if (file.mimeType.startsWith('text/')) {
        // 文本文件需要下載內容
        await loadTextContent()
      } else if (file.mimeType.includes('document')) {
        // Google Docs 使用嵌入預覽
        const embedUrl = `https://docs.google.com/document/d/${file.id}/preview`
        setPreviewUrl(embedUrl)
        setLoading(false)
      } else if (file.mimeType.includes('spreadsheet')) {
        // Google Sheets 使用嵌入預覽
        const embedUrl = `https://docs.google.com/spreadsheets/d/${file.id}/preview`
        setPreviewUrl(embedUrl)
        setLoading(false)
      } else if (file.mimeType.includes('presentation')) {
        // Google Slides 使用嵌入預覽
        const embedUrl = `https://docs.google.com/presentation/d/${file.id}/preview`
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
  }

  const loadTextContent = async () => {
    try {
      const response = await fetch(`/api/drive/content/${file.id}`)
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
  }

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
    if (file.mimeType.startsWith('text/')) return '📝'
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
        <div className="flex items-center justify-center h-96">
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
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex items-center space-x-2">
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                下載檔案
              </Button>
              <Button 
                onClick={async () => {
                  setError(null)
                  setLoading(true)
                  
                  try {
                    // 嘗試使用圖片預覽 API
                    const response = await fetch(`/api/drive/preview-image/${file.id}`)
                    if (response.ok) {
                      const data = await response.json()
                      if (data.success && data.previewUrls) {
                        // 嘗試不同的預覽方法，優先使用我們的 API
                        const urls = [
                          data.previewUrls.api,        // 我們的圖片代理 API (最可靠)
                          data.previewUrls.direct,     // 直接下載 URL
                          data.previewUrls.preview     // Google Drive 預覽 URL
                        ]
                        
                        // 測試每個 URL 直到找到可用的
                        let urlFound = false
                        for (const url of urls) {
                          try {
                            await new Promise((resolve, reject) => {
                              const img = new window.Image()
                              img.onload = () => {
                                setPreviewUrl(url)
                                setLoading(false)
                                urlFound = true
                                resolve(true)
                              }
                              img.onerror = () => {
                                console.log('URL 失敗:', url)
                                reject(new Error(`URL 失敗: ${url}`))
                              }
                              img.src = url
                            })
                            if (urlFound) break
                          } catch (e) {
                            console.log('URL 測試失敗:', url, e)
                            continue
                          }
                        }
                        
                        if (!urlFound) {
                          throw new Error('所有預覽方法都失敗了')
                        }
                      } else {
                        throw new Error(data.error || '無法獲取圖片預覽信息')
                      }
                    } else {
                      throw new Error('圖片預覽 API 請求失敗')
                    }
                  } catch (err) {
                    console.error('重試預覽失敗:', err)
                    setError('重試預覽失敗，請嘗試下載檔案')
                    setLoading(false)
                  }
                }} 
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重試預覽
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="text-6xl">{getFileTypeIcon()}</div>
            <p className="text-muted-foreground">無法預覽此檔案</p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              下載檔案
            </Button>
          </div>
        </div>
      )
    }

    // 根據檔案類型渲染不同的預覽
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
              <div className="text-center space-y-2">
                <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                <p className="text-sm text-muted-foreground">載入圖片中...</p>
              </div>
            </div>
          )}
          
          {error ? (
            <div className="text-center space-y-4">
              <div className="text-6xl">🖼️</div>
              <p className="text-muted-foreground">{error}</p>
              <div className="flex items-center space-x-2">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下載檔案
                </Button>
                <Button 
                  onClick={async () => {
                    setError(null)
                    setLoading(true)
                    
                    try {
                      // 嘗試使用圖片預覽 API
                      const response = await fetch(`/api/drive/preview-image/${file.id}`)
                      if (response.ok) {
                        const data = await response.json()
                        if (data.success && data.previewUrls) {
                          // 嘗試不同的預覽方法，優先使用我們的 API
                          const urls = [
                            data.previewUrls.api,        // 我們的圖片代理 API (最可靠)
                            data.previewUrls.direct,     // 直接下載 URL
                            data.previewUrls.preview     // Google Drive 預覽 URL
                          ]
                          
                          // 測試每個 URL 直到找到可用的
                          let urlFound = false
                          for (const url of urls) {
                            try {
                              await new Promise((resolve, reject) => {
                                const img = new window.Image()
                                img.onload = () => {
                                  setPreviewUrl(url)
                                  setLoading(false)
                                  urlFound = true
                                  resolve(true)
                                }
                                img.onerror = () => {
                                  console.log('URL 失敗:', url)
                                  reject(new Error(`URL 失敗: ${url}`))
                                }
                                img.src = url
                              })
                              if (urlFound) break
                            } catch (e) {
                              console.log('URL 測試失敗:', url, e)
                              continue
                            }
                          }
                          
                          if (!urlFound) {
                            throw new Error('所有預覽方法都失敗了')
                          }
                        } else {
                          throw new Error(data.error || '無法獲取圖片預覽信息')
                        }
                      } else {
                        throw new Error('圖片預覽 API 請求失敗')
                      }
                    } catch (err) {
                      console.error('重試預覽失敗:', err)
                      setError('重試預覽失敗，請嘗試下載檔案')
                      setLoading(false)
                    }
                  }} 
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重試預覽
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full p-4">
              <SmartImage
                src={previewUrl}
                alt={file.name}
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
          )}
        </div>
      )
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <div className="w-full h-full bg-muted/20 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={file.name}
          />
        </div>
      )
    }

    if (file.mimeType.startsWith('text/')) {
      return (
        <div className="w-full h-full bg-muted/20 rounded-lg overflow-auto p-4">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
            {previewUrl}
          </pre>
        </div>
      )
    }

    if (file.mimeType.includes('document') || 
        file.mimeType.includes('spreadsheet') || 
        file.mimeType.includes('presentation')) {
      return (
        <div className="w-full h-full bg-muted/20 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={file.name}
          />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-6xl">{getFileTypeIcon()}</div>
          <p className="text-muted-foreground">此檔案類型不支援預覽</p>
          <Button onClick={handleDownload} variant="outline">
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
        className="bg-card border border-border rounded-lg shadow-lg max-w-4xl w-full mx-4 h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileTypeIcon()}</span>
            <div>
              <h2 className="text-lg font-semibold text-foreground truncate max-w-md">
                {file.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {file.size} • {file.mimeType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
              <Download className="h-4 w-4 mr-2" />
              下載
            </Button>
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
          {renderPreview()}
        </div>
      </div>
    </div>
  )
}
