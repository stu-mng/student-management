import {
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  Plus,
  RefreshCw,
  Trash2,
  Upload
} from "lucide-react"
import { useEffect, useRef } from "react"
import type { DriveFile } from "./types"

interface ContextMenuProps {
  show: boolean
  x: number
  y: number
  target: 'file' | 'empty' | null
  file?: DriveFile
  selectedFilesCount: number
  totalFilesCount: number
  onPreview: (file: DriveFile) => void
  onViewInDrive: (file: DriveFile) => void
  onRename: (file: DriveFile) => void
  onMoveToTrash: (file: DriveFile) => void
  onCopyLink: (file: DriveFile) => void
  onSelect: (file: DriveFile) => void
  onUpload: () => void
  onCreateFolder: () => void
  onRefresh: () => void
  onSelectAll: () => void
  onClose: () => void
}

export function ContextMenu({
  show,
  x,
  y,
  target,
  file,
  selectedFilesCount,
  totalFilesCount,
  onPreview,
  onViewInDrive,
  onRename,
  onMoveToTrash,
  onCopyLink,
  onSelect,
  onUpload,
  onCreateFolder,
  onRefresh,
  onSelectAll,
  onClose
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close menu
  useEffect(() => {
    if (!show) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[200px]"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {target === 'file' && file && (
        <>
          <button
            onClick={() => onPreview(file)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>預覽</span>
          </button>
          {file.webViewLink && (
            <button
              onClick={() => onViewInDrive(file)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>在 Drive 中查看</span>
            </button>
          )}
          <button
            onClick={() => onRename(file)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
          >
            <Edit3 className="h-4 w-4" />
            <span>重新命名</span>
          </button>
          <button
            onClick={() => onMoveToTrash(file)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2 text-orange-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>移至垃圾桶</span>
          </button>
          {file.webViewLink && (
            <button
              onClick={() => onCopyLink(file)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>複製連結</span>
            </button>
          )}
          <button
            onClick={() => onSelect(file)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
          >
            <input
              type="checkbox"
              checked={false} // This should be passed as a prop
              readOnly
              className="h-4 w-4 text-primary rounded border-border"
            />
            <span>選取</span>
          </button>
        </>
      )}

      {target === 'empty' && (
        <>
          <button
            onClick={onUpload}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>上傳檔案</span>
          </button>
          <button
            onClick={onCreateFolder}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>新增資料夾</span>
          </button>
          <button
            onClick={onRefresh}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>重新整理</span>
          </button>
          <button
            onClick={onSelectAll}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
          >
            <input
              type="checkbox"
              checked={selectedFilesCount === totalFilesCount && totalFilesCount > 0}
              readOnly
              className="h-4 w-4 text-primary rounded border-border"
            />
            <span>全部選取</span>
          </button>
        </>
      )}
    </div>
  )
}
