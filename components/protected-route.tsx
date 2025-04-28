"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "./auth-provider"

export function ProtectedRoute({
  children,
  allowedRoles = [],
}: {
  children: React.ReactNode
  allowedRoles?: string[]
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (
      !isLoading &&
      user &&
      allowedRoles.length > 0 &&
      user.role &&
      !allowedRoles.includes(user.role)
    ) {
      // If user doesn't have the required role, redirect to dashboard
      router.push("/dashboard")
    }
  }, [user, isLoading, router, allowedRoles])

  // Show nothing while loading or if not authenticated
  if (isLoading || !user) {
    return null
  }

  // If roles are specified and user doesn't have the required role, show nothing
  if (
    allowedRoles.length > 0 &&
    user.role &&
    !allowedRoles.includes(user.role)
  ) {
    return null
  }

  // User is authenticated and has the required role, show children
  return <>{children}</>
} 