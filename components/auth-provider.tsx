"use client"

import type React from "react"

import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

type User = {
  id: string
  email: string
  role?: string
  user_metadata?: {
    avatar_url?: string
    full_name?: string
    name?: string
    picture?: string
  }
  name?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
  last_active?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const syncUserData = useCallback(async (authUser: User): Promise<User> => {
    try {
      // Check if user exists
      const existingUserResponse = await fetch(`/api/users/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (existingUserResponse.status === 404) {
        // User is not in the whitelist, redirect to blocked page
        router.replace('/blocked')
        return authUser
      }
      
      if (existingUserResponse.ok) {
        const existingUserData = await existingUserResponse.json()
        
        // Update user data
        const updateResponse = await fetch(`/api/users/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (!updateResponse.ok) {
          console.error('Failed to update user data:', await updateResponse.text())
          return { ...authUser, ...existingUserData }
        }
        
        return { ...authUser, ...(await updateResponse.json()) }
      }
      
      console.error('Error checking user:', existingUserResponse.statusText)
      return authUser
    } catch (error) {
      console.error('Error syncing user data:', error)
      return authUser
    }
  }, [router])

  // 定期更新用戶活動時間
  useEffect(() => {
    if (!user) return
    
    // 初始登入時更新活動時間
    const updateActivity = async () => {
      try {
        await fetch('/api/users/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Error updating activity:', error)
      }
    }
    
    updateActivity()
    
    // 每5分鐘更新一次活動時間
    const activityInterval = setInterval(() => {
      updateActivity()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(activityInterval)
  }, [user])

  useEffect(() => {
    let isMounted = true
    let lastAuthId: string | null = null
    
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (isMounted) setIsLoading(false)
          return
        }

        if (data?.session?.user && isMounted) {
          lastAuthId = data.session.user.id
          const fullUser = await syncUserData(data.session.user as User)
          if (isMounted) setUser(fullUser)
        } else if (isMounted) {
          // Explicitly set user to null if no session
          setUser(null)
        }
        
        if (isMounted) setIsLoading(false)
      } catch (err) {
        console.error('Error initializing auth:', err)
        if (isMounted) setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        // Set loading to true during auth state changes
        setIsLoading(true)
        
        try {
          if (session) {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session.user.id !== lastAuthId) {
              lastAuthId = session.user.id
              const fullUser = await syncUserData(session.user as User)
              setUser(fullUser)
            } else if (event === 'USER_UPDATED') {
              // Handle user updates
              setUser(session.user as User)
            } else if (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED') {
              setUser(session.user as User)
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
        } finally {
          if (isMounted) setIsLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, syncUserData])

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error("Error signing in with Google:", error)
      }
    } catch (error) {
      console.error("Error signing in with Google:", error)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Error signing out:", error)
        return
      }
      
      setUser(null)
      router.replace("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const value = {
    user,
    isLoading,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
