import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ViewMode } from "./types"

// 檔案項目 Skeleton 組件
export function FileItemSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center space-x-4 p-4 bg-card border border-border rounded-lg">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg flex flex-col h-full aspect-square">
      {/* 縮圖區域 Skeleton */}
      <div className="flex-1 bg-muted/20 border-b border-border">
        <Skeleton className="w-full h-full rounded-t-lg" />
      </div>
      {/* 檔案信息區域 Skeleton */}
      <div className="p-3 text-center space-y-2">
        <Skeleton className="h-4 w-32 mx-auto" />
        <div className="flex items-center justify-center space-x-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-1" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-1" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  )
}

// 載入狀態 Skeleton 組件
export function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  const items = Array.from({ length: 12 }, (_, i) => i)
  
  return (
    <div className={cn(
      "grid gap-4",
      viewMode === 'grid' 
        ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto w-full" 
        : "grid-cols-1"
    )}>
      {items.map((i) => (
        <FileItemSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  )
}
