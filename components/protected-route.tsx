"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Simple loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>
  )
}

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
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    // Only run the auth check once loading is complete
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true)
      
      if (!user) {
        // No user found, redirect to login
        console.log('No user found, redirecting to login')
        router.replace("/login")
      } else if (
        allowedRoles.length > 0 &&
        (!user.role?.name || !allowedRoles.includes(user.role.name))
      ) {
        // User doesn't have required role, redirect to dashboard
        console.log('User lacks required role, redirecting to dashboard')
        router.replace('/dashboard')
        return
      }
    }
  }, [user, isLoading, router, allowedRoles, hasCheckedAuth])

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />
  }

  // If not authenticated, don't render anything
  if (!user) {
    return null
  }

  // Check role-based access after loading is complete
  if (
    allowedRoles.length > 0 &&
    (!user.role?.name || !allowedRoles.includes(user.role.name))
  ) {
    return null
  }

  // Only render children when user is authenticated and has required role
  return <>{children}</>
} 