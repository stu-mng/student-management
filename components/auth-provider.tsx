"use client"

import type React from "react"

import { apiClientSilent, type ApiResponse } from "@/lib/api-utils"
import { getRoleOrder, hasHigherPermission } from "@/lib/utils"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

type User = {
  id: string
  email: string
  role?: {
    id: number
    name: string
    display_name: string | null
    color: string | null
    order: number
  }
  region?: string | null;
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
  // 角色預覽
  previewRole: User["role"] | null
  isPreviewing: boolean
  startRolePreview: (role: { name: string; order?: number }) => void
  stopRolePreview: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // user: 提供給 UI 的使用者（若正在預覽，role 會被覆蓋）
  const [user, setUser] = useState<User | null>(null)
  // authUser: 真實登入使用者（不受預覽影響）
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [previewRole, setPreviewRole] = useState<User["role"] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 將預覽角色覆蓋到 UI user（僅限 UI，後端權限仍以真實角色為準）
  const applyRolePreview = useCallback((baseUser: User | null, preview: User["role"] | null): User | null => {
    if (!baseUser) return baseUser
    if (!preview || !baseUser.role) return baseUser
    // 僅允許預覽權限較低的角色
    const allowed = hasHigherPermission(baseUser.role, preview)
    if (!allowed) return baseUser
    return { ...baseUser, role: { ...preview, order: preview.order ?? getRoleOrder(preview) } as User["role"] }
  }, [])

  // 從 localStorage 載入預覽角色
  useEffect(() => {
    try {
      const name = typeof window !== 'undefined' ? localStorage.getItem('rolePreviewName') : null
      if (name) {
        const order = getRoleOrder({ name } as any)
        setPreviewRole({ id: -1, name, display_name: null, color: null, order })
      }
    } catch {}
  }, [])

  // 當預覽角色或真實用戶改變時，重新套用預覽
  useEffect(() => {
    setUser(prev => applyRolePreview(authUser, previewRole))
  }, [authUser, previewRole, applyRolePreview])

  const startRolePreview = useCallback((role: { name: string; order?: number }) => {
    if (!authUser || !authUser.role) return
    const candidate = { id: -1, name: role.name, display_name: null, color: null, order: role.order ?? getRoleOrder(role as any) }
    if (!hasHigherPermission(authUser.role, candidate)) return
    setPreviewRole(candidate)
    try { localStorage.setItem('rolePreviewName', role.name) } catch {}
    setUser(prev => applyRolePreview(authUser, candidate))
  }, [authUser, applyRolePreview])

  const stopRolePreview = useCallback(() => {
    setPreviewRole(null)
    try { localStorage.removeItem('rolePreviewName') } catch {}
    setUser(authUser)
  }, [authUser])

  const syncUserData = useCallback(async (authUser: User): Promise<User> => {
    try {
      // Check if user exists
      const existingUserResponse = await apiClientSilent.get<ApiResponse<unknown>>(`/api/users/me`)
      
      if (existingUserResponse.status === 200) {
        const existingUserData = existingUserResponse.data
        
        // Update user data
        const updateResponse = await apiClientSilent.put<ApiResponse<unknown>>(`/api/users/me`)
        
        if (updateResponse.status === 200) {
          return { ...authUser, ...updateResponse.data }
        } else {
          console.error('Failed to update user data')
          return { ...authUser, ...existingUserData }
        }
      }
      
      console.error('Error checking user')
      return authUser
    } catch (error: any) {
      console.error('Error syncing user data:', error)
      
      // Check if it's a 404 error (user not in whitelist)
      if (error.response?.status === 404) {
        router.replace('/blocked')
      }
      
      return authUser
    }
  }, [router])

  // 定期更新用戶活動時間
  useEffect(() => {
    if (!user) return
    
    // 初始登入時更新活動時間
    const updateActivity = async () => {
      try {
        await apiClientSilent.post<ApiResponse<unknown>>('/api/users/activity')
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
          if (isMounted) {
            setAuthUser(fullUser)
            setUser(applyRolePreview(fullUser, previewRole))
          }
        } else if (isMounted) {
          // Explicitly set user to null if no session
          setAuthUser(null)
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
              setAuthUser(fullUser)
              setUser(applyRolePreview(fullUser, previewRole))
            } else if (event === 'USER_UPDATED') {
              // Handle user updates
              const updated = session.user as User
              setAuthUser(updated)
              setUser(applyRolePreview(updated, previewRole))
            } else if (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED') {
              const updated = session.user as User
              setAuthUser(updated)
              setUser(applyRolePreview(updated, previewRole))
            }
          } else if (event === 'SIGNED_OUT') {
            setAuthUser(null)
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
      
      setAuthUser(null)
      setUser(null)
      try { localStorage.removeItem('rolePreviewName') } catch {}
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
    previewRole,
    isPreviewing: !!previewRole,
    startRolePreview,
    stopRolePreview,
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
