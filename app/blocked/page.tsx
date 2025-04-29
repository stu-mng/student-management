"use client"

import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function BlockedPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is not logged in, redirect to login
    const checkAuth = async () => {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">無訪問權限</CardTitle>
          <CardDescription className="text-center">
            系統訪問權限驗證
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>訪問被拒絕</AlertTitle>
            <AlertDescription>
              很抱歉，您不在系統的白名單中。如果您認為這是一個錯誤，請聯繫系統管理員。
            </AlertDescription>
          </Alert>
          
          <Button
            variant="outline"
            onClick={() => signOut()}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            登出
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 