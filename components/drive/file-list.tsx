import { cn } from "@/lib/utils"
import { DroppableFolder } from "./droppable-folder"
import { FileItem } from "./file-item"
import type { DriveFile, SortDirection, SortField, ViewMode } from "./types"
import { sortFiles } from "./utils"

interface FileListProps {
  files: DriveFile[]
  viewMode: ViewMode
  selectedFiles: Set<string>
  sortField: SortField
  sortDirection: SortDirection
  isDragOver: boolean
  onSelect: (fileId: string) => void
  onSelectAll: () => void
  onFileClick: (file: DriveFile) => void
  onFileContextMenu: (e: React.MouseEvent, file: DriveFile) => void
  onEmptySpaceContextMenu: (e: React.MouseEvent) => void
  onPreview: (file: DriveFile) => void
  onDownload: (file: DriveFile) => void
  onEnterFolder: (fileId: string, fileName: string) => void
  onSort: (field: SortField) => void
}

export function FileList({
  files,
  viewMode,
  selectedFiles,
  sortField,
  sortDirection,
  isDragOver,
  onSelect,
  onSelectAll,
  onFileClick,
  onFileContextMenu,
  onEmptySpaceContextMenu,
  onPreview,
  onDownload,
  onEnterFolder,
  onSort
}: FileListProps) {
  const sortedFiles = sortFiles(files, sortField, sortDirection)

  const renderFileItem = (file: DriveFile) => {
    const fileItem = (
      <FileItem
        key={file.id}
        file={file}
        viewMode={viewMode}
        isSelected={selectedFiles.has(file.id)}
        onSelect={onSelect}
        onClick={onFileClick}
        onContextMenu={onFileContextMenu}
        onPreview={onPreview}
        onDownload={onDownload}
        onEnterFolder={onEnterFolder}
      />
    );

    // Wrap folder items with DroppableFolder for drag and drop
    if (file.mimeType.includes('folder')) {
      return (
        <DroppableFolder key={file.id} folder={file}>
          {fileItem}
        </DroppableFolder>
      );
    }

    return fileItem;
  };

  if (viewMode === 'list') {
    return (
      <div 
        className={cn(
          "bg-card border border-border rounded-lg overflow-hidden transition-all duration-200",
          isDragOver && "border-primary border-2 border-dashed bg-primary/5"
        )}
        onContextMenu={onEmptySpaceContextMenu}
      >
        {/* 列表標題行 */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/20 border-b border-border text-sm font-medium text-muted-foreground min-h-[48px]">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selectedFiles.size === files.length && files.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  onSelectAll()
                } else {
                  // Clear all selections
                  selectedFiles.clear()
                }
              }}
              className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
            />
          </div>
          <div 
            className="col-span-5 flex items-center space-x-2 cursor-pointer hover:text-foreground"
            onClick={() => onSort('name')}
          >
            <span>名稱</span>
            <span className="text-xs text-muted-foreground">
              {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </span>
          </div>
          <div 
            className="col-span-3 flex items-center space-x-2 cursor-pointer hover:text-foreground"
            onClick={() => onSort('createdTime')}
          >
            <span>上次修改時間</span>
            <span className="text-xs text-muted-foreground">
              {sortField === 'createdTime' ? (sortDirection === 'asc' ? '↑' : '↓') : '↓'}
            </span>
          </div>
          <div className="col-span-2 flex items-center space-x-2 cursor-pointer hover:text-foreground">
            <span>檔案大小</span>
          </div>
          <div className="col-span-1 text-right">
            <span className="sr-only">操作</span>
          </div>
        </div>

        {/* 檔案列表項目 */}
        {sortedFiles.map(renderFileItem)}
      </div>
    )
  }

  // Grid view
  return (
    <div 
      className={cn(
        "grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto w-full transition-all duration-200",
        isDragOver && "border-2 border-dashed border-primary rounded-lg bg-primary/5 p-4"
      )}
      onContextMenu={onEmptySpaceContextMenu}
    >
      {sortedFiles.map(renderFileItem)}
    </div>
  )
}
