'use client';

import { cn } from "@/lib/utils";
import { useDragDrop } from "./drag-drop-context";
import type { DriveFile } from "./types";

interface DroppableFolderProps {
  folder: DriveFile;
  children: React.ReactNode;
  className?: string;
}

export function DroppableFolder({ folder, children, className }: DroppableFolderProps) {
  const { draggedItem, dropTarget, setDropTarget, moveFile, setDraggedItem, setIsDragging, hasContext } = useDragDrop();

  const isDragOver = hasContext && dropTarget === folder.id;

  const handleDragOver = (e: React.DragEvent) => {
    if (!hasContext) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(folder.id);
  };

  const handleDragLeave = () => {
    if (!hasContext) return;
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!hasContext) return;
    
    e.preventDefault();
    setDropTarget(null);
    
    if (draggedItem && draggedItem.id !== folder.id) {
      try {
        const success = await moveFile(draggedItem.id, folder.id);
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

  return (
    <div
      className={cn(
        "transition-all duration-200 relative",
        "hover:bg-muted/20 rounded-lg",
        isDragOver && "ring-2 ring-primary ring-offset-2 bg-primary/5",
        className
      )}
      onDragOver={hasContext ? handleDragOver : undefined}
      onDragLeave={hasContext ? handleDragLeave : undefined}
      onDrop={hasContext ? handleDrop : undefined}
    >
      {children}
      
      {/* Active drag feedback */}
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none rounded-lg bg-primary/10 border-2 border-dashed border-primary" />
      )}
    </div>
  );
}
