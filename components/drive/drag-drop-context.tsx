'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { DriveFile } from './types';

interface DragDropContextType {
  draggedItem: DriveFile | null;
  setDraggedItem: (item: DriveFile | null) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dropTarget: string | null;
  setDropTarget: (target: string | null) => void;
  moveFile: (fileId: string, newParentId: string) => Promise<boolean>;
  hasContext: boolean;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    // Return fallback values instead of throwing
    return {
      draggedItem: null,
      setDraggedItem: () => {},
      isDragging: false,
      setIsDragging: () => {},
      dropTarget: null,
      setDropTarget: () => {},
      moveFile: async () => false,
      hasContext: false,
    };
  }
  return context;
}

interface DragDropProviderProps {
  children: ReactNode;
  onFileMoved?: () => void;
}

export function DragDropProvider({ children, onFileMoved }: DragDropProviderProps) {
  const [draggedItem, setDraggedItem] = useState<DriveFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const moveFile = async (fileId: string, newParentId: string): Promise<boolean> => {
    try {
      // Show loading toast
      toast.loading('正在移動檔案...');
      
      const response = await fetch('/api/drive/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId, newParentId }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Dismiss loading toast and show success
        toast.dismiss();
        toast.success('檔案移動成功');
        
        // Call the callback to refresh the file list
        onFileMoved?.();
        return true;
      } else {
        // Dismiss loading toast and show error
        toast.dismiss();
        toast.error(`移動失敗: ${result.error || '未知錯誤'}`);
        return false;
      }
    } catch (error) {
      // Dismiss loading toast and show error
      toast.dismiss();
      toast.error('移動檔案時發生錯誤');
      console.error('Error moving file:', error);
      return false;
    }
  };

  const value: DragDropContextType = {
    draggedItem,
    setDraggedItem,
    isDragging,
    setIsDragging,
    dropTarget,
    setDropTarget,
    moveFile,
    hasContext: true,
  };

  return (
    <DragDropContext.Provider value={value}>
      {children}
    </DragDropContext.Provider>
  );
}
