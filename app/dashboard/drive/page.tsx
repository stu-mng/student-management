"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DrivePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/drive/folders/1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* 載入動畫 */}
        <div className="space-y-4">
          <div className="flex justify-center space-x-2">
            <Skeleton className="h-3 w-3 rounded-full bg-primary/20" />
            <Skeleton className="h-3 w-3 rounded-full bg-primary/20 animate-delay-200" />
            <Skeleton className="h-3 w-3 rounded-full bg-primary/20 animate-delay-400" />
          </div>
          <Skeleton className="h-8 w-48 mx-auto bg-muted" />
        </div>
        
        {/* 載入文字 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 mx-auto bg-muted" />
          <Skeleton className="h-4 w-24 mx-auto bg-muted" />
        </div>
      </div>
    </div>
  )
}
