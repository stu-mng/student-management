"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HardDrive, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface StorageQuota {
  limit: string
  usage: string
  usageInDrive: string
  usageInDriveTrash: string
  limitFormatted: string
  usageFormatted: string
  usageInDriveFormatted: string
  usageInDriveTrashFormatted: string
  usagePercentage: number
}

interface StorageQuotaDisplayProps {
  className?: string
}

export function StorageQuotaDisplay({ className }: StorageQuotaDisplayProps) {
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStorageQuota = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/drive/storage')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '無法獲取儲存空間資訊')
      }
      
      const data = await response.json()
      setStorageQuota(data.data)
    } catch (err) {
      console.error('Failed to fetch storage quota:', err)
      setError(err instanceof Error ? err.message : '未知錯誤')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStorageQuota()
  }, [fetchStorageQuota])

  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchStorageQuota}
              className={className}
              disabled={loading}
            >
              <HardDrive className="h-4 w-4 text-destructive" />
              {loading && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>儲存空間載入失敗：{error}</p>
            <p className="text-xs text-muted-foreground">點擊重新載入</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!storageQuota) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className={className}
        disabled
      >
        <HardDrive className="h-4 w-4" />
        {loading && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
      </Button>
    )
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-primary"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchStorageQuota}
            className={`${className} space-x-2`}
            disabled={loading}
          >
            <HardDrive className="h-4 w-4" />
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-secondary rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(storageQuota.usagePercentage)}`}
                  style={{ width: `${Math.min(storageQuota.usagePercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium">
                {storageQuota.usagePercentage}%
              </span>
            </div>
            {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Google Drive 儲存空間</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>已使用：</span>
                <span className="font-medium">{storageQuota.usageFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span>雲端硬碟：</span>
                <span>{storageQuota.usageInDriveFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span>垃圾桶：</span>
                <span>{storageQuota.usageInDriveTrashFormatted}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span>總容量：</span>
                <span className="font-medium">{storageQuota.limitFormatted}</span>
              </div>
            </div>
            <Progress 
              value={storageQuota.usagePercentage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">點擊重新整理</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
