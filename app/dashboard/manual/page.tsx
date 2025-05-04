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
import { Suspense, useState } from "react"
import { getRoleTextColor, getRoleBgColor } from "@/lib/utils"

import { ManualTabs } from "./manual-tabs"

export default function UserManualPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Is user an admin
  const isAdmin = user?.role === "admin" || user?.role === "root" || user?.role === "manager"
  
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
        <Suspense fallback={<div className="h-10 bg-muted rounded-md animate-pulse mb-4"></div>}>
          <ManualTabs user={user} isAdmin={isAdmin} />
        </Suspense>
      </div>
    </div>
  )
} 