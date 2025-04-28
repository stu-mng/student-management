"use client"

import type React from "react"

import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

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

  const syncUserData = async (authUser: User): Promise<User> => {
    try {
      // Check if user exists
      const existingUserResponse = await fetch(`/api/users/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (existingUserResponse.status === 404) {
        // Create new user
        const createResponse = await fetch(`/api/users/me`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'teacher' }),
        })
        
        if (!createResponse.ok) {
          console.error('Failed to create user:', await createResponse.text())
          return authUser
        }
        
        return { ...authUser, ...(await createResponse.json()) }
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
  }

  useEffect(() => {
    let isMounted = true
    let lastAuthId: string | null = null
    
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (isMounted) setIsLoading(false)
          return
        }

        if (data?.session?.user && isMounted) {
          lastAuthId = data.session.user.id
          const fullUser = await syncUserData(data.session.user as User)
          setUser(fullUser)
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
        
        if (session) {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session.user.id !== lastAuthId) {
            lastAuthId = session.user.id
            const fullUser = await syncUserData(session.user as User)
            setUser(fullUser)
          } else if (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED') {
            setUser(session.user as User)
          }
        } else {
          setUser(null)
        }
        
        if (isMounted) setIsLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

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
      router.push("/login")
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
