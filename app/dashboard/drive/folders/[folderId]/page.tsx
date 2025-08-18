"use client"

import { useAuth } from "@/components/auth-provider";
import type {
  BreadcrumbItem,
  ContextMenuState,
  DriveFile,
  SortDirection,
  SortField,
  ViewMode
} from "@/components/drive";
import {
  ContextMenu,
  CreateFolderDialog,
  DeleteConfirmationDialog,
  EmptyState,
  FileList,
  LoadingSkeleton,
  SearchToolbar,
  SelectionToolbar,
  TopNavigation
} from "@/components/drive";
import { FilePreview } from "@/components/file-preview";
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function DriveFolderPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const folderId = params.folderId as string

  // State
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentFolder, setCurrentFolder] = useState<string>('')
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [clickTimeouts, setClickTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map())

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    target: null
  })

  // Operation states
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Dialog states
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    show: boolean
    file?: DriveFile
    isBulkDelete: boolean
    selectedFiles: DriveFile[]
  }>({
    show: false,
    isBulkDelete: false,
    selectedFiles: []
  })

  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false)
  const dragOverRef = useRef(false)

  // Refs
  const fileExplorerRef = useRef<HTMLDivElement>(null)

  // Permission check
  const hasPermission = (allowedRoles: string[]) => {
    if (!user?.role?.name) return false
    return allowedRoles.includes(user.role.name)
  }

  // Initialize view mode from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('drive-view-mode')
        if (saved === 'grid' || saved === 'list') {
          setViewMode(saved)
        }
      }
    } catch (error) {
      console.warn('無法從 localStorage 讀取檢視模式:', error)
      setViewMode('list')
    }
  }, [])

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, target: 'file' | 'empty', file?: DriveFile) => {
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      target,
      file
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, show: false }))
  }, [])

  const handleFileContextMenu = useCallback((e: React.MouseEvent, file: DriveFile) => {
    handleContextMenu(e, 'file', file)
  }, [handleContextMenu])

  const handleEmptySpaceContextMenu = useCallback((e: React.MouseEvent) => {
    handleContextMenu(e, 'empty')
  }, [handleContextMenu])

  // File operations
  const handleViewInDrive = useCallback((file: DriveFile) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank')
    }
    closeContextMenu()
  }, [closeContextMenu])

  const handleRenameFile = useCallback((file: DriveFile) => {
    // TODO: Implement rename functionality
    console.log('Rename file:', file.name)
    toast.info('重命名功能開發中')
    closeContextMenu()
  }, [closeContextMenu])

  // Bulk delete selected files (now moves to trash)
  const handleBulkDelete = useCallback(() => {
    if (selectedFiles.size === 0) {
      toast.error('請先選擇要移至垃圾桶的檔案')
      return
    }

    const selectedFilesList = files.filter(f => selectedFiles.has(f.id))
    setDeleteDialog({
      show: true,
      isBulkDelete: true,
      selectedFiles: selectedFilesList
    })
  }, [selectedFiles, files])

  // Move file to trash (soft delete)
  const handleMoveToTrash = useCallback((file: DriveFile) => {
    // For now, use the same confirmation dialog but with a different message
    setDeleteDialog({
      show: true,
      file,
      isBulkDelete: false,
      selectedFiles: []
    })
  }, [])

  const handleCopyLink = useCallback((file: DriveFile) => {
    if (file.webViewLink) {
      navigator.clipboard.writeText(file.webViewLink)
      toast.success('連結已複製到剪貼簿')
    } else {
      toast.error('無法複製連結')
    }
    closeContextMenu()
  }, [closeContextMenu])

  const handleSelectFile = useCallback((file: DriveFile) => {
    toggleFileSelection(file.id)
    toast.success(`已選擇檔案: ${file.name}`)
    closeContextMenu()
  }, [closeContextMenu])

  const handleRefreshFiles = useCallback(() => {
    loadFiles(currentFolder)
    toast.success('檔案列表已重新整理')
    closeContextMenu()
  }, [currentFolder, closeContextMenu])

  const handleSelectAll = useCallback(() => {
    const allFileIds = new Set(files.map(f => f.id))
    setSelectedFiles(allFileIds)
    toast.success(`已選擇所有檔案 (${allFileIds.size} 個)`)
    closeContextMenu()
  }, [files, closeContextMenu])

  // Global drag and drop event listeners
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragOverRef.current = false
      setIsDragOver(false)
    }

    document.addEventListener('dragover', handleGlobalDragOver)
    document.addEventListener('drop', handleGlobalDrop)

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver)
      document.removeEventListener('drop', handleGlobalDrop)
    }
  }, [])

  // Load files from API
  const loadFiles = async (targetFolderId?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (targetFolderId) {
        params.append('folderId', targetFolderId)
      }
      
      const response = await fetch(`/api/drive?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        const loadedFiles = data.files || []
        setFiles(loadedFiles)
        
        if (targetFolderId) {
          await loadFolderPath(targetFolderId)
        } else {
          setBreadcrumbs([])
        }
      }
    } catch (error) {
      console.error('載入檔案失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load folder path for breadcrumbs
  const loadFolderPath = async (folderId: string) => {
    try {
      const response = await fetch(`/api/drive/path/${folderId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setBreadcrumbs(data.path || [])
        } else {
          setBreadcrumbs([{ id: folderId, name: '當前資料夾' }])
        }
      } else {
        setBreadcrumbs([{ id: folderId, name: '當前資料夾' }])
      }
    } catch (error) {
      console.error('載入資料夾路徑失敗:', error)
      setBreadcrumbs([{ id: folderId, name: '當前資料夾' }])
    }
  }

  // Load files when folder changes
  useEffect(() => {
    if (folderId && folderId !== currentFolder) {
      setCurrentFolder(folderId)
      loadFiles(folderId)
    }
  }, [folderId, currentFolder])

  // Load files on mount
  useEffect(() => {
    if (currentFolder) {
      loadFiles(currentFolder)
    }
  }, [currentFolder])

  // Create folder handlers
  const handleCreateFolder = useCallback(() => {
    setNewFolderName('')
    setShowCreateFolderDialog(true)
    closeContextMenu()
  }, [closeContextMenu])

  const confirmCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return

    try {
      setIsCreatingFolder(true)
      const response = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentFolderId: currentFolder || '1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await loadFiles(currentFolder)
          setShowCreateFolderDialog(false)
          toast.success('資料夾建立成功')
        } else {
          console.error('建立資料夾失敗:', data.error)
          toast.error('資料夾建立失敗')
        }
      } else {
        console.error('建立資料夾失敗:', response.statusText)
        toast.error('資料夾建立失敗')
      }
    } catch (error) {
      console.error('建立資料夾錯誤:', error)
      toast.error('資料夾建立失敗')
    } finally {
      setIsCreatingFolder(false)
    }
  }, [newFolderName, currentFolder, loadFiles])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragOverRef.current) {
      dragOverRef.current = true
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return
    }
    
    const relatedTarget = e.relatedTarget as Element
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return
    }
    
    dragOverRef.current = false
    setIsDragOver(false)
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragOverRef.current) {
      dragOverRef.current = true
      setIsDragOver(true)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragOverRef.current = false
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    try {
      setIsUploading(true)
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('parentFolderId', currentFolder || '1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo')
        
        const response = await fetch('/api/drive/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            console.log(`檔案 ${file.name} 上傳成功`)
            toast.success(`檔案 ${file.name} 上傳成功`)
          } else {
            console.error(`檔案 ${file.name} 上傳失敗:`, data.error)
            toast.error(`檔案 ${file.name} 上傳失敗`)
          }
        } else {
          console.error(`檔案 ${file.name} 上傳失敗:`, response.statusText)
          toast.error(`檔案 ${file.name} 上傳失敗`)
        }
      }
      
      await loadFiles(currentFolder)
    } catch (error) {
      console.error('拖放上傳檔案錯誤:', error)
      toast.error('拖放上傳檔案失敗')
    } finally {
      setIsUploading(false)
    }
  }, [currentFolder, loadFiles])

  // Upload file handler
  const handleUploadFile = useCallback(() => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.multiple = true
    fileInput.style.display = 'none'
    
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement
      const files = target.files
      
      if (files && files.length > 0) {
        try {
          setIsUploading(true)
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const formData = new FormData()
            formData.append('file', file)
            formData.append('parentFolderId', currentFolder || '1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo')
            
            const response = await fetch('/api/drive/upload', {
              method: 'POST',
              body: formData,
            })
            
            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                console.log(`檔案 ${file.name} 上傳成功`)
                toast.success(`檔案 ${file.name} 上傳成功`)
              } else {
                console.error(`檔案 ${file.name} 上傳失敗:`, data.error)
                toast.error(`檔案 ${file.name} 上傳失敗`)
              }
            } else {
              console.error(`檔案 ${file.name} 上傳失敗:`, response.statusText)
              toast.error(`檔案 ${file.name} 上傳失敗`)
            }
          }
          
          await loadFiles(currentFolder)
        } catch (error) {
          console.error('上傳檔案錯誤:', error)
          toast.error('上傳檔案失敗')
        } finally {
          setIsUploading(false)
        }
      }
      
      document.body.removeChild(fileInput)
    }
    
    document.body.appendChild(fileInput)
    fileInput.click()
    
    closeContextMenu()
  }, [currentFolder, closeContextMenu, loadFiles])

  // File click handler (single click select, double click preview)
  const handleFileClick = (file: DriveFile) => {
    const existingTimeout = clickTimeouts.get(file.id)
    
    if (existingTimeout) {
      // Double click - preview or enter folder
      clearTimeout(existingTimeout)
      setClickTimeouts(prev => {
        const newMap = new Map(prev)
        newMap.delete(file.id)
        return newMap
      })
      
      if (file.mimeType.includes('folder')) {
        enterFolder(file.id, file.name)
      } else {
        handlePreviewFile(file)
      }
    } else {
      // Single click - select file
      const timeout = setTimeout(() => {
        toggleFileSelection(file.id)
        setClickTimeouts(prev => new Map(prev).set(file.id, timeout))
      }, 200)
      
      setClickTimeouts(prev => new Map(prev).set(file.id, timeout))
    }
  }

  // Enter folder
  const enterFolder = (targetFolderId: string, folderName: string) => {
    setCurrentFolder(targetFolderId)
    
    const newUrl = `/dashboard/drive/folders/${targetFolderId}`
    router.push(newUrl)
    
    loadFiles(targetFolderId)
    toast.success(`已進入資料夾: ${folderName}`)
  }

  // Search files
  const searchFiles = async () => {
    if (!searchQuery.trim()) {
      await loadFiles(currentFolder)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('query', searchQuery.trim())
      if (currentFolder) {
        params.append('folderId', currentFolder)
      }
      
      const response = await fetch(`/api/drive/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        const searchResults = data.files || []
        setFiles(searchResults)
        toast.success(`搜尋完成，找到 ${searchResults.length} 個檔案`)
      } else {
        toast.error('搜尋失敗')
      }
    } catch (error) {
      console.error('搜尋檔案失敗:', error)
      toast.error('搜尋失敗')
    } finally {
      setLoading(false)
    }
  }

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
      toast.success('已取消選擇檔案')
    } else {
      newSelected.add(fileId)
      toast.success('已選擇檔案')
    }
    setSelectedFiles(newSelected)
  }

  // Download file
  const downloadFile = (file: DriveFile) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank')
      toast.success(`正在開啟檔案: ${file.name}`)
    } else {
      toast.error('無法下載此檔案')
    }
    closeContextMenu()
  }

  // Preview file
  const handlePreviewFile = async (file: DriveFile) => {
    try {
      const response = await fetch(`/api/drive/preview/${file.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPreviewFile(data.file)
          setShowPreview(true)
          toast.success(`正在預覽檔案: ${file.name}`)
        } else {
          toast.error('無法預覽此檔案')
        }
      } else {
        toast.error('無法預覽此檔案')
      }
    } catch (error) {
      console.error('預覽檔案失敗:', error)
      setPreviewFile(file)
      setShowPreview(true)
      toast.success(`正在預覽檔案: ${file.name}`)
    }
    closeContextMenu()
  }

  // View mode change handler
  const handleViewModeChange = (mode: ViewMode) => {
    if (mode !== viewMode) {
      setViewMode(mode)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('drive-view-mode', mode)
        }
      } catch (error) {
        console.warn('無法保存檢視模式到 localStorage:', error)
      }
    }
  }

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      toast.success(`已${sortDirection === 'asc' ? '降序' : '升序'}排列`)
    } else {
      setSortField(field)
      setSortDirection(field === 'createdTime' ? 'desc' : 'asc')
      toast.success(`已按${field === 'name' ? '名稱' : field === 'createdTime' ? '建立時間' : '修改時間'}排列`)
    }
  }

  // Navigation handler
  const handleNavigate = (folderId: string) => {
    setCurrentFolder(folderId)
    loadFiles(folderId)
  }

  // Actual delete execution (now moves to trash)
  const executeDelete = useCallback(async () => {
    const { file, isBulkDelete, selectedFiles: filesToDelete } = deleteDialog
    
    try {
      if (isBulkDelete) {
        // Bulk move to trash
        const loadingToast = toast.loading(`正在將 ${filesToDelete.length} 個檔案移至垃圾桶...`)
        
        let successCount = 0
        let errorCount = 0
        
        for (const fileToDelete of filesToDelete) {
          try {
            const response = await fetch(`/api/drive/delete/${fileToDelete.id}?action=trash`, {
              method: 'DELETE',
            })

            if (response.ok) {
              const result = await response.json()
              if (result.success) {
                successCount++
              } else {
                errorCount++
                console.error(`移至垃圾桶失敗 ${fileToDelete.name}:`, result.error)
              }
            } else {
              errorCount++
              const errorData = await response.json()
              console.error(`移至垃圾桶失敗 ${fileToDelete.name}:`, errorData.error)
            }
          } catch (error) {
            errorCount++
            console.error(`將檔案 ${fileToDelete.name} 移至垃圾桶時發生錯誤:`, error)
          }
        }

        // Dismiss loading toast
        toast.dismiss(loadingToast)

        // Show results
        if (successCount > 0) {
          toast.success(`成功將 ${successCount} 個檔案移至垃圾桶`)
        }
        if (errorCount > 0) {
          toast.error(`移至垃圾桶失敗 ${errorCount} 個檔案`)
        }

        // Refresh file list
        await loadFiles(currentFolder)
        
        // Clear selection
        setSelectedFiles(new Set())
        
      } else if (file) {
        // Single file move to trash
        const loadingToast = toast.loading('正在將檔案移至垃圾桶...')
        
        const response = await fetch(`/api/drive/delete/${file.id}?action=trash`, {
          method: 'DELETE',
        })

        // Dismiss loading toast
        toast.dismiss(loadingToast)

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            toast.success(`已將檔案移至垃圾桶: ${file.name}`)
            // Remove file from local state
            setFiles(prev => prev.filter(f => f.id !== file.id))
            // Remove from selection if selected
            setSelectedFiles(prev => {
              const newSet = new Set(prev)
              newSet.delete(file.id)
              return newSet
            })
          } else {
            toast.error(`移至垃圾桶失敗: ${result.error}`)
          }
        } else {
          const errorData = await response.json()
          toast.error(`移至垃圾桶失敗: ${errorData.error || '未知錯誤'}`)
        }
      }
    } catch (error) {
      console.error('移至垃圾桶失敗:', error)
      toast.error('移至垃圾桶時發生錯誤')
    } finally {
      // Close dialog
      setDeleteDialog(prev => ({ ...prev, show: false }))
    }
  }, [deleteDialog, currentFolder, loadFiles])

  if (!hasPermission(['admin', 'root', 'class-teacher', 'manager'])) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">檔案總管</h2>
          <p className="text-muted-foreground">您沒有權限訪問此功能</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background">
      {/* Top Navigation */}
      <TopNavigation
        breadcrumbs={breadcrumbs}
        viewMode={viewMode}
        onNavigate={handleNavigate}
        onViewModeChange={handleViewModeChange}
      />

      {/* Main Content */}
      <div 
        className="container mx-auto p-6" 
        ref={fileExplorerRef}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Search Toolbar */}
        <SearchToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={searchFiles}
          onRefresh={() => loadFiles(currentFolder)}
          onUpload={handleUploadFile}
          onCreateFolder={handleCreateFolder}
          isUploading={isUploading}
          isCreatingFolder={isCreatingFolder}
        />

        {/* Selection Toolbar */}
        <SelectionToolbar
          selectedFilesCount={selectedFiles.size}
          onClearSelection={() => setSelectedFiles(new Set())}
          onBulkDelete={handleBulkDelete}
        />

        {/* File List */}
        {loading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : files.length === 0 ? (
          <EmptyState
            isUploading={isUploading}
            isCreatingFolder={isCreatingFolder}
            onUpload={handleUploadFile}
            onCreateFolder={handleCreateFolder}
          />
        ) : (
          <FileList
            files={files}
            viewMode={viewMode}
            selectedFiles={selectedFiles}
            sortField={sortField}
            sortDirection={sortDirection}
            isDragOver={isDragOver}
            onSelect={toggleFileSelection}
            onSelectAll={handleSelectAll}
            onFileClick={handleFileClick}
            onFileContextMenu={handleFileContextMenu}
            onEmptySpaceContextMenu={handleEmptySpaceContextMenu}
            onPreview={handlePreviewFile}
            onDownload={downloadFile}
            onEnterFolder={enterFolder}
            onSort={handleSort}
          />
        )}
      </div>

      {/* File Preview Modal */}
      {showPreview && previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        show={showCreateFolderDialog}
        folderName={newFolderName}
        isCreating={isCreatingFolder}
        onFolderNameChange={setNewFolderName}
        onConfirm={confirmCreateFolder}
        onCancel={() => setShowCreateFolderDialog(false)}
      />

      {/* Context Menu */}
      <ContextMenu
        show={contextMenu.show}
        x={contextMenu.x}
        y={contextMenu.y}
        target={contextMenu.target}
        file={contextMenu.file}
        selectedFilesCount={selectedFiles.size}
        totalFilesCount={files.length}
        onPreview={handlePreviewFile}
        onViewInDrive={handleViewInDrive}
        onRename={handleRenameFile}
        onMoveToTrash={handleMoveToTrash}
        onCopyLink={handleCopyLink}
        onSelect={handleSelectFile}
        onUpload={handleUploadFile}
        onCreateFolder={handleCreateFolder}
        onRefresh={handleRefreshFiles}
        onSelectAll={handleSelectAll}
        onClose={closeContextMenu}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        show={deleteDialog.show}
        file={deleteDialog.file}
        isBulkDelete={deleteDialog.isBulkDelete}
        selectedFiles={deleteDialog.selectedFiles}
        onConfirm={executeDelete}
        onCancel={() => setDeleteDialog(prev => ({ ...prev, show: false }))}
        isDeleting={false}
      />
    </div>
  )
}
