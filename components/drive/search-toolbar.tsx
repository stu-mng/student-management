import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ArrowLeft, CheckSquare, Plus, RefreshCw, Search, Square, Upload } from "lucide-react"

interface SearchToolbarProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onSearch: () => void
  onRefresh: () => void
  onUpload: () => void
  onCreateFolder: () => void
  isUploading: boolean
  isCreatingFolder: boolean
  isSelectionMode: boolean
  onToggleSelectionMode: () => void
  onBack?: () => void
}

export function SearchToolbar({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onRefresh,
  onUpload,
  onCreateFolder,
  isUploading,
  isCreatingFolder,
  isSelectionMode,
  onToggleSelectionMode,
  onBack
}: SearchToolbarProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜尋檔案..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={onSearch} variant="outline" size="sm">
            搜尋
          </Button>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            重整
          </Button>
          <Button
            onClick={onToggleSelectionMode}
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            className={cn(
              "transition-all duration-200",
              isSelectionMode && "bg-primary text-primary-foreground"
            )}
          >
            {isSelectionMode ? (
              <CheckSquare className="h-4 w-4 mr-2" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            {isSelectionMode ? '選取' : '選取'}
          </Button>
        </div>
        
        {/* Action buttons moved from top navigation */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={onUpload}
            variant="outline"
            size="sm"
            disabled={isUploading}
          >
            {isUploading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isUploading ? '上傳中...' : '上傳'}
          </Button>
          <Button
            onClick={onCreateFolder}
            variant="outline"
            size="sm"
            disabled={isCreatingFolder}
          >
            {isCreatingFolder ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isCreatingFolder ? '建立中...' : '新資料夾'}
          </Button>
        </div>
      </div>
    </div>
  )
}
