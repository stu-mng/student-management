"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FcGoogle } from "react-icons/fc"

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-2 text-center pb-2">
          <CardTitle className="text-3xl font-bold text-primary">興大學伴酷系統</CardTitle>
          <CardDescription className="text-gray-500">請使用您的 Google 帳戶登入以存取小學伴資料</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-6 pt-4">
          <div className="flex justify-center">
            <Image 
              width={256}
              height={256}
              src="/logo.png" 
              alt="系統標誌" 
              className="h-48 w-auto mb-4 rounded-full"
              onError={(e) => e.currentTarget.style.display = 'none'} 
            />
          </div>
          <Button 
            onClick={signInWithGoogle} 
            className="w-full py-6 text-base font-medium transition-all hover:bg-primary/90" 
            disabled={isLoading}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            {isLoading ? "登入中..." : "使用 Google 帳戶登入"}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-xs text-center text-gray-500 pt-2">
          <p>登入即表示您同意我們的</p>
          <div className="flex justify-center space-x-2">
            <Link href="/terms" className="text-primary hover:underline">使用者條款</Link>
            <span>與</span>
            <Link href="/privacy" className="text-primary hover:underline">隱私條款</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
