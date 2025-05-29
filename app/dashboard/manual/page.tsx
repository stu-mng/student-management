"use client"

import { useAuth } from "@/components/auth-provider"
import { RestrictedCard } from "@/components/restricted-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Bookmark, Info, Link as LinkIcon, Shield, User, UserCog, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { getRoleTextColor, getRoleBgColor } from "@/lib/utils"

import { ManualTabs } from "./manual-tabs"

// Loading fallback for ManualTabs
function ManualTabsLoading() {
  return (
    <div className="space-y-6">
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
        <div className="h-8 w-24 bg-muted-foreground/20 animate-pulse rounded mx-1" />
        <div className="h-8 w-24 bg-muted-foreground/20 animate-pulse rounded mx-1" />
        <div className="h-8 w-24 bg-muted-foreground/20 animate-pulse rounded mx-1" />
      </div>
      <div className="space-y-4">
        <div className="h-32 bg-muted-foreground/10 animate-pulse rounded" />
        <div className="h-48 bg-muted-foreground/10 animate-pulse rounded" />
      </div>
    </div>
  )
}

export default function UserManualPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Is user an admin
  const isAdmin = user?.role?.name === "admin" || user?.role?.name === "root" || user?.role?.name === "manager"
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">系統使用手冊</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
      </div>
      <p className="text-muted-foreground">系統功能指南與操作說明</p>
      
      <div className="w-full">
        <Suspense fallback={<ManualTabsLoading />}>
          <ManualTabs user={user} isAdmin={isAdmin} />
        </Suspense>
      </div>
    </div>
  )
} 