"use client"

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
    DragDropProvider,
    EmptyState,
    FileList,
    LoadingSkeleton,
    MoveToTrashDialog,
    RenameDialog,
    SearchToolbar,
    SelectionToolbar,
    TopNavigation
} from "@/components/drive";
import { FilePreview } from "@/components/file-preview";
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function DriveFolderPage() {
  const router = useRouter()
  const params = useParams()
  const folderId = params.folderId as string

  // State
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentFolder, setCurrentFolder] = useState<string>('')
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: folderId || 'loading', name: '載入中...' }
  ])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
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
  const [isRenaming, setIsRenaming] = useState(false)

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

  // Move to trash dialog state
  const [moveToTrashDialog, setMoveToTrashDialog] = useState<{
    show: boolean
    file?: DriveFile
    isBulkMove: boolean
    selectedFiles: DriveFile[]
  }>({
    show: false,
    isBulkMove: false,
    selectedFiles: []
  })

  // Rename dialog state
  const [renameDialog, setRenameDialog] = useState<{
    show: boolean
    file: DriveFile | null
  }>({
    show: false,
    file: null
  })

  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false)
  const dragOverRef = useRef(false)

  // Refs
  const fileExplorerRef = useRef<HTMLDivElement>(null)

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

  // Load files from the specified folder
  const loadFiles = useCallback(async (targetFolderId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/drive?folderId=${targetFolderId}`)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files)
        setCurrentFolder(targetFolderId)
      } else {
        console.error('Failed to load files:', data.error)
        toast.error('載入檔案失敗')
      }
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('載入檔案時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load breadcrumbs for the current folder
  const loadBreadcrumbs = useCallback(async (targetFolderId: string) => {
    try {
      // Set loading state immediately
      setBreadcrumbs([{ id: targetFolderId, name: '載入中...' }]);
      
      const response = await fetch(`/api/drive/path/${targetFolderId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json()
      
      if (data.success && data.path && Array.isArray(data.path) && data.path.length > 0) {
        setBreadcrumbs(data.path)
      } else {
        console.error('Failed to load breadcrumbs or invalid format:', data)
        // Set a default breadcrumb for the current folder
        const defaultBreadcrumb = [{ id: targetFolderId, name: '根目錄' }];
        setBreadcrumbs(defaultBreadcrumb)
      }
    } catch (error) {
      console.error('Error loading breadcrumbs:', error)
      // Set a default breadcrumb for the current folder
      const defaultBreadcrumb = [{ id: targetFolderId, name: '根目錄' }];
      setBreadcrumbs(defaultBreadcrumb)
    }
  }, [])

  // Load files when folder changes
  useEffect(() => {
    if (folderId) {
      loadFiles(folderId)
      loadBreadcrumbs(folderId)
    }
  }, [folderId, loadFiles, loadBreadcrumbs])

  // Handle selection mode toggle
  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      const newMode = !prev;
      // Clear selection when turning off selection mode
      if (!newMode) {
        setSelectedFiles(new Set());
      }
      return newMode;
    });
  }, []);

  // Handle file selection
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
        // Automatically enable selection mode when selecting a file
        if (!isSelectionMode) {
          setIsSelectionMode(true)
        }
      }
      return newSet
    })
  }, [isSelectionMode])

  // Handle select all files
  const handleSelectAll = useCallback(() => {
    // Automatically enable selection mode if not already enabled
    if (!isSelectionMode) {
      setIsSelectionMode(true)
    }
    setSelectedFiles(new Set(files.map(file => file.id)))
  }, [files, isSelectionMode])

  // Handle file context menu
  const handleFileContextMenu = useCallback((e: React.MouseEvent, file: DriveFile) => {
    e.preventDefault()
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      target: 'file',
      file: file
    })
  }, [])

  // Handle empty space context menu
  const handleEmptySpaceContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      target: 'empty'
    })
  }, [])

  // Handle preview file
  const handlePreviewFile = useCallback((file: DriveFile) => {
    setPreviewFile(file)
    setShowPreview(true)
  }, [])

  // Handle download file
  const downloadFile = useCallback(async (file: DriveFile) => {
    try {
      const response = await fetch(`/api/drive/content/${file.id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        toast.error('下載失敗')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('下載時發生錯誤')
    }
  }, [])

  // Handle enter folder
  const enterFolder = useCallback((folderId: string, _folderName: string) => {
    router.push(`/dashboard/drive/folders/${folderId}`)
  }, [router])

  // Handle file click
  const handleFileClick = useCallback((file: DriveFile) => {
    if (file.mimeType.includes('folder')) {
      enterFolder(file.id, file.name)
    } else {
      handlePreviewFile(file)
    }
  }, [enterFolder, handlePreviewFile])

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    setSortField(field)
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }, [])

  // Handle search
  const searchFiles = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      loadFiles(currentFolder)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/drive/search?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files)
      } else {
        console.error('Search failed:', data.error)
        toast.error('搜尋失敗')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('搜尋時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [currentFolder, loadFiles])

  // Handle upload file
  const handleUploadFile = useCallback(async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('parentFolderId', currentFolder)

      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('檔案上傳成功')
        loadFiles(currentFolder)
      } else {
        toast.error(data.error || '上傳失敗')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('上傳時發生錯誤')
    } finally {
      setIsUploading(false)
    }
  }, [currentFolder, loadFiles])

  // Handle create folder
  const handleCreateFolder = useCallback(async (folderName: string) => {
    setIsCreatingFolder(true)
    try {
      const response = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          parentFolderId: currentFolder
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('資料夾建立成功')
        setNewFolderName('')
        setShowCreateFolderDialog(false)
        loadFiles(currentFolder)
      } else {
        toast.error(data.error || '建立資料夾失敗')
      }
    } catch (error) {
      console.error('Create folder error:', error)
      toast.error('建立資料夾時發生錯誤')
    } finally {
      setIsCreatingFolder(false)
    }
  }, [currentFolder, loadFiles])

  // Handle confirm create folder
  const confirmCreateFolder = useCallback(async () => {
    if (newFolderName.trim()) {
      await handleCreateFolder(newFolderName.trim())
    }
  }, [newFolderName, handleCreateFolder])

  // Handle view in drive
  const handleViewInDrive = useCallback((_file: DriveFile) => {
    // TODO: Implement view in drive functionality
    toast.info('在 Google Drive 中檢視功能即將推出')
  }, [])

  // Handle rename file
  const handleRenameFile = useCallback((file: DriveFile) => {
    setRenameDialog({
      show: true,
      file: file
    })
  }, [])

  // Execute rename
  const executeRename = useCallback(async (newName: string) => {
    if (!renameDialog.file) return

    setIsRenaming(true)
    try {
      const response = await fetch(`/api/drive/${renameDialog.file.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newName
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('重新命名成功')
        setRenameDialog({ show: false, file: null })
        loadFiles(currentFolder) // Refresh the file list
      } else {
        throw new Error(data.error || '重新命名失敗')
      }
    } catch (error) {
      console.error('Rename error:', error)
      toast.error('重新命名時發生錯誤')
      throw error // Re-throw to let the dialog handle the error
    } finally {
      setIsRenaming(false)
    }
  }, [renameDialog.file, currentFolder, loadFiles])

  // Handle move to trash
  const handleMoveToTrash = useCallback((file: DriveFile) => {
    setMoveToTrashDialog({
      show: true,
      file,
      isBulkMove: false,
      selectedFiles: []
    })
  }, [])

  // Execute move to trash
  const executeMoveToTrash = useCallback(async () => {
    const filesToMove = moveToTrashDialog.isBulkMove 
      ? moveToTrashDialog.selectedFiles 
      : moveToTrashDialog.file 
        ? [moveToTrashDialog.file] 
        : []

    try {
      for (const file of filesToMove) {
        const response = await fetch(`/api/drive/delete/${file.id}`, {
          method: 'DELETE'
        })

        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || '移至垃圾桶失敗')
        }
      }

      toast.success(moveToTrashDialog.isBulkMove ? '檔案已移至垃圾桶' : '檔案已移至垃圾桶')
      setSelectedFiles(new Set())
      loadFiles(currentFolder)
      setMoveToTrashDialog(prev => ({ ...prev, show: false }))
    } catch (error) {
      console.error('Move to trash error:', error)
      toast.error('移至垃圾桶時發生錯誤')
    }
  }, [moveToTrashDialog, loadFiles, currentFolder])



  // Handle copy link
  const handleCopyLink = useCallback(async (file: DriveFile) => {
    if (file.webViewLink) {
      try {
        await navigator.clipboard.writeText(file.webViewLink)
        toast.success('連結已複製到剪貼簿')
      } catch (error) {
        console.error('Copy link error:', error)
        toast.error('複製連結失敗')
      }
    }
  }, [])

  // Handle select file
  const handleSelectFile = useCallback((file: DriveFile) => {
    // Automatically enable selection mode if not already enabled
    if (!isSelectionMode) {
      setIsSelectionMode(true)
    }
    // Directly toggle the file selection without calling toggleFileSelection
    // to avoid double-enabling selection mode
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(file.id)) {
        newSet.delete(file.id)
      } else {
        newSet.add(file.id)
      }
      return newSet
    })
  }, [isSelectionMode])

  // Handle refresh files
  const handleRefreshFiles = useCallback(() => {
    loadFiles(currentFolder)
  }, [currentFolder, loadFiles])

  // Handle bulk move to trash
  const handleBulkMoveToTrash = useCallback(() => {
    const selectedFilesList = files.filter(file => selectedFiles.has(file.id))
    setMoveToTrashDialog({
      show: true,
      isBulkMove: true,
      selectedFiles: selectedFilesList
    })
  }, [files, selectedFiles])



  // Execute delete
  const executeDelete = useCallback(async () => {
    const filesToDelete = deleteDialog.isBulkDelete 
      ? deleteDialog.selectedFiles 
      : deleteDialog.file 
        ? [deleteDialog.file] 
        : []

    try {
      for (const file of filesToDelete) {
        const response = await fetch(`/api/drive/delete/${file.id}`, {
          method: 'DELETE'
        })

        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || '刪除失敗')
        }
      }

      toast.success(deleteDialog.isBulkDelete ? '檔案刪除成功' : '檔案刪除成功')
      setSelectedFiles(new Set())
      loadFiles(currentFolder)
      setDeleteDialog(prev => ({ ...prev, show: false }))
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('刪除時發生錯誤')
    }
  }, [deleteDialog, loadFiles, currentFolder])

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, show: false }))
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!dragOverRef.current) {
      setIsDragOver(true)
      dragOverRef.current = true
    }
  }, [])

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
      dragOverRef.current = false
    }
  }, [])

  // Handle drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    dragOverRef.current = false

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      for (const file of files) {
        await handleUploadFile(file)
      }
    }
  }, [handleUploadFile])

  // Refresh files when they are moved
  const handleFileMoved = useCallback(() => {
    loadFiles(currentFolder)
  }, [currentFolder, loadFiles])

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('drive-view-mode', mode)
      }
    } catch (error) {
      console.warn('無法保存檢視模式到 localStorage:', error)
    }
  }, [])

  // Handle search query change
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle upload click
  const handleUploadClick = useCallback(() => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.multiple = true
    fileInput.style.display = 'none'
    
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement
      const files = target.files
      
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          await handleUploadFile(files[i])
        }
      }
      
      document.body.removeChild(fileInput)
    }
    
    document.body.appendChild(fileInput)
    fileInput.click()
  }, [handleUploadFile])

  // Handle create folder click
  const handleCreateFolderClick = useCallback(() => {
    setNewFolderName('')
    setShowCreateFolderDialog(true)
  }, [])

  return (
    <DragDropProvider onFileMoved={handleFileMoved}>
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <TopNavigation
          breadcrumbs={breadcrumbs}
          viewMode={viewMode}
          onNavigate={loadFiles}
          onViewModeChange={handleViewModeChange}
        />

        {/* Main Content */}
        <div 
          ref={fileExplorerRef}
          className="p-6 space-y-6"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Search and Actions Toolbar */}
          <SearchToolbar
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            onSearch={() => searchFiles(searchQuery)}
            onRefresh={() => loadFiles(currentFolder)}
            onUpload={handleUploadClick}
            onCreateFolder={handleCreateFolderClick}
            isUploading={isUploading}
            isCreatingFolder={isCreatingFolder}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={handleToggleSelectionMode}
            onBack={() => router.back()}
          />

          {/* Selection Toolbar */}
          <SelectionToolbar
            selectedFilesCount={selectedFiles.size}
            onClearSelection={() => setSelectedFiles(new Set())}
            onBulkMoveToTrash={handleBulkMoveToTrash}
          />

          {/* File List */}
          {loading ? (
            <LoadingSkeleton viewMode={viewMode} />
          ) : files.length === 0 ? (
            <EmptyState
              isUploading={isUploading}
              isCreatingFolder={isCreatingFolder}
              onUpload={handleUploadClick}
              onCreateFolder={handleCreateFolderClick}
            />
          ) : (
            <FileList
              files={files}
              viewMode={viewMode}
              selectedFiles={selectedFiles}
              sortField={sortField}
              sortDirection={sortDirection}
              isDragOver={isDragOver}
              isSelectionMode={isSelectionMode}
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
          selectedFiles={selectedFiles}
          onPreview={handlePreviewFile}
          onViewInDrive={handleViewInDrive}
          onRename={handleRenameFile}
          onMoveToTrash={handleMoveToTrash}
          onCopyLink={handleCopyLink}
          onSelect={handleSelectFile}
          onUpload={handleUploadClick}
          onCreateFolder={handleCreateFolderClick}
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

        {/* Move to Trash Dialog */}
        <MoveToTrashDialog
          show={moveToTrashDialog.show}
          file={moveToTrashDialog.file}
          isBulkMove={moveToTrashDialog.isBulkMove}
          selectedFiles={moveToTrashDialog.selectedFiles}
          onConfirm={executeMoveToTrash}
          onCancel={() => setMoveToTrashDialog(prev => ({ ...prev, show: false }))}
          isMoving={false}
        />

        {/* Rename Dialog */}
        <RenameDialog
          show={renameDialog.show}
          file={renameDialog.file}
          onConfirm={executeRename}
          onCancel={() => setRenameDialog({ show: false, file: null })}
          isRenaming={isRenaming}
        />
      </div>
    </DragDropProvider>
  )
}
