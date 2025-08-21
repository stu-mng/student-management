import { Button } from "@/components/ui/button"
import { Grid3X3, List } from "lucide-react"
import { BreadcrumbNavigation } from "./breadcrumb-navigation"
import { StorageQuotaDisplay } from "./storage-quota-display"
import type { BreadcrumbItem, ViewMode } from "./types"

interface TopNavigationProps {
  breadcrumbs: BreadcrumbItem[]
  viewMode: ViewMode
  onNavigate: (folderId: string) => void
  onViewModeChange: (mode: ViewMode) => void
}

export function TopNavigation({
  breadcrumbs,
  viewMode,
  onNavigate,
  onViewModeChange
}: TopNavigationProps) {
  return (
    <div className="bg-card border-b border-border sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左側：麵包屑導航 */}
          <div className="flex items-center space-x-4">
            <BreadcrumbNavigation 
              breadcrumbs={breadcrumbs} 
              onNavigate={onNavigate} 
            />
          </div>

          {/* 右側：儲存空間顯示和視圖切換按鈕 */}
          <div className="flex items-center space-x-4">
            {/* 儲存空間顯示 */}
            <StorageQuotaDisplay />
            
            {/* 視圖切換按鈕 */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
