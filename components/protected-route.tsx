"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = []
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else if (
        (allowedRoles.length > 0 && user.role && !allowedRoles.includes(user.role))
      ) {
        // Redirect if user doesn't have permission
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, router, allowedRoles])

  if (isLoading) {
    return <div>Loading...</div>
  }

  // Only render children if user exists and has the required role
  if (
    user && 
    (allowedRoles.length === 0 || (user.role && allowedRoles.includes(user.role)))
  ) {
    return <>{children}</>
  }

  // Return null during redirect
  return null
} 