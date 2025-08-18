import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useDragDrop } from "./drag-drop-context"
import type { BreadcrumbItem } from "./types"

interface BreadcrumbNavigationProps {
  breadcrumbs: BreadcrumbItem[]
  onNavigate: (folderId: string) => void
}

export function BreadcrumbNavigation({ breadcrumbs, onNavigate }: BreadcrumbNavigationProps) {
  const router = useRouter()
  
  // Ensure breadcrumbs is always an array and validate each item
  const safeBreadcrumbs = Array.isArray(breadcrumbs) 
    ? breadcrumbs.filter(crumb => crumb && typeof crumb === 'object' && crumb.id && crumb.name)
    : []
  
  // Get drag and drop context - it will always return a value now
  const { draggedItem, dropTarget, setDropTarget, moveFile, setDraggedItem, setIsDragging, hasContext } = useDragDrop();

  const handleBreadcrumbClick = (index: number) => {
    const targetBreadcrumbs = safeBreadcrumbs.slice(0, index + 1)
    const targetFolder = targetBreadcrumbs[targetBreadcrumbs.length - 1]?.id
    
    if (targetFolder) {
      router.push(`/dashboard/drive/folders/${targetFolder}`)
      onNavigate(targetFolder)
    } else {
      router.push('/dashboard/drive/folders/1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo')
      onNavigate('1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo')
    }
  }

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    if (!hasContext) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(folderId);
  };

  const handleDragLeave = () => {
    if (!hasContext) return;
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string) => {
    if (!hasContext) return;
    
    e.preventDefault();
    setDropTarget(null);
    
    if (draggedItem && draggedItem.id !== folderId) {
      try {
        const success = await moveFile(draggedItem.id, folderId);
        if (success) {
          // Reset drag state
          setDraggedItem(null);
          setIsDragging(false);
        }
      } catch (error) {
        console.error('Failed to move file:', error);
      }
    }
  };

  // Always render something, even if breadcrumbs are empty
  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      {safeBreadcrumbs.length === 0 ? (
        <span className="text-muted-foreground">載入中...</span>
      ) : (
        safeBreadcrumbs.map((crumb, index) => (
          <div key={crumb.id} className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBreadcrumbClick(index)}
              onDragOver={hasContext ? (e) => handleDragOver(e, crumb.id) : undefined}
              onDragLeave={hasContext ? handleDragLeave : undefined}
              onDrop={hasContext ? (e) => handleDrop(e, crumb.id) : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground p-1 transition-all duration-200",
                "hover:bg-muted/20 rounded relative",
                hasContext && dropTarget === crumb.id && "ring-2 ring-primary ring-offset-1 bg-primary/10"
              )}
              title={hasContext ? `拖放檔案到此處以移動到 ${crumb.name}` : undefined}
            >
              {crumb.name}
              
              {/* Active drag feedback for breadcrumb */}
              {hasContext && dropTarget === crumb.id && (
                <div className="absolute inset-0 pointer-events-none rounded bg-primary/20 border border-primary" />
              )}
            </Button>
            {index < safeBreadcrumbs.length - 1 && <span>/</span>}
          </div>
        ))
      )}
    </div>
  )
}
