import type { DriveFile, SortDirection, SortField } from "./types"

export const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('folder')) return 'folder'
  if (mimeType.includes('document')) return 'document'
  if (mimeType.includes('spreadsheet')) return 'spreadsheet'
  if (mimeType.includes('presentation')) return 'presentation'
  if (mimeType.includes('image')) return 'image'
  if (mimeType.includes('video')) return 'video'
  if (mimeType.includes('audio')) return 'audio'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive'
  return 'file'
}

export const getFileTypeLabel = (mimeType: string) => {
  if (mimeType.includes('folder')) return '資料夾'
  if (mimeType.includes('document')) return '文件'
  if (mimeType.includes('spreadsheet')) return '試算表'
  if (mimeType.includes('presentation')) return '簡報'
  if (mimeType.includes('image')) return '圖片'
  if (mimeType.includes('video')) return '影片'
  if (mimeType.includes('audio')) return '音訊'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '壓縮檔'
  return '檔案'
}

export const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('zh-TW')
  } catch (error) {
    return 'N/A'
  }
}

export const formatFileSize = (size: string) => {
  if (size === 'N/A') return 'N/A'
  return size
}

export const sortFiles = (files: DriveFile[], sortField: SortField, sortDirection: SortDirection) => {
  const sortedFiles = [...files].sort((a, b) => {
    if (sortField === 'name') {
      const comparison = a.name.localeCompare(b.name)
      return sortDirection === 'asc' ? comparison : -comparison
    } else {
      const comparison = new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime()
      return sortDirection === 'asc' ? comparison : -comparison
    }
  })
  return sortedFiles
}

export const getViewModeFromStorage = (): 'grid' | 'list' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('drive-view-mode')
      return (saved === 'grid' || saved === 'list') ? saved : 'list'
    } catch (error) {
      console.warn('無法從 localStorage 讀取檢視模式:', error)
      return 'list'
    }
  }
  return 'list'
}

export const saveViewModeToStorage = (mode: 'grid' | 'list') => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('drive-view-mode', mode)
    }
  } catch (error) {
    console.warn('無法保存檢視模式到 localStorage:', error)
  }
}
