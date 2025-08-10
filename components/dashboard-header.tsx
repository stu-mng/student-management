"use client"

import { useAuth } from "@/components/auth-provider"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, getRoleDisplay, getRoleOrder, getRoleTextColor, isAdmin } from "@/lib/utils"
import { Eye, EyeOff, LogOut, Shield, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type RoleItem = { id: number; name: string; display_name?: string | null; order?: number }

export default function DashboardHeader() {
  const { user, signOut, isPreviewing, previewRole, startRolePreview, stopRolePreview } = useAuth()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [allRoles, setAllRoles] = useState<RoleItem[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  const isAdminUser = isAdmin(user?.role);
  
  const avatarUrl = user?.user_metadata?.avatar_url || 
                    user?.user_metadata?.picture || 
                    null
                    
  const displayName = user?.user_metadata?.full_name || 
                     user?.user_metadata?.name || 
                     user?.email || 
                     ""

  const navigation = [
    { name: "控制台", href: "/dashboard", admin: false },
    { name: "小學伴管理", href: "/dashboard/students", admin: false },
  ]

  useEffect(() => {
    const fetchRoles = async () => {
      if (!menuOpen || loadingRoles || allRoles.length > 0) return
      try {
        setLoadingRoles(true)
        const res = await fetch('/api/roles', { method: 'GET' })
        if (!res.ok) return
        const json = await res.json()
        if (Array.isArray(json?.data)) {
          setAllRoles(json.data as RoleItem[])
        }
      } finally {
        setLoadingRoles(false)
      }
    }
    fetchRoles()
  }, [menuOpen, loadingRoles, allRoles.length])

  const lowerRoles = useMemo(() => {
    if (!user?.role) return [] as RoleItem[]
    const currentOrder = getRoleOrder(user.role)
    return allRoles
      .filter(r => (r.order ?? getRoleOrder(r)) > currentOrder)
      .sort((a, b) => (a.order ?? getRoleOrder(a)) - (b.order ?? getRoleOrder(b)))
  }, [allRoles, user?.role])

  return (
    <header className="border-b w-full">
      {isPreviewing && (
        <div className="w-full bg-pink-400 text-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span>
              目前以「{getRoleDisplay(previewRole?.name || user?.role?.name || '')}」視角預覽中
            </span>
            <Button
              size="sm"
              onClick={stopRolePreview}
              className="bg-white text-pink-600 hover:bg-white/90"
            >
              退出預覽
            </Button>
          </div>
        </div>
      )}
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <MobileNav />
          <Link href="/dashboard" className="font-semibold">
            興大學伴酷系統
          </Link>
          <nav className="hidden md:flex gap-4">
            {navigation.map((item) => {
              if (item.admin && !isAdminUser) return null

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || ""} alt={displayName} />
                    <AvatarFallback>
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isPreviewing && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] text-white flex items-center justify-center">P</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {user.role?.name && (
                      <span className={cn("text-xs", getRoleTextColor(user.role.name))}>
                        目前角色：{getRoleDisplay(user.role.name)}{isPreviewing ? "（預覽中）" : ""}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">角色預覽</DropdownMenuLabel>
                  {isPreviewing ? (
                    <DropdownMenuItem onClick={stopRolePreview} className="cursor-pointer">
                      <EyeOff className="mr-2 h-4 w-4" />
                      <span>退出預覽</span>
                    </DropdownMenuItem>
                  ) : null}
                  {lowerRoles.length === 0 && (
                    <DropdownMenuItem disabled>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>無可預覽角色</span>
                    </DropdownMenuItem>
                  )}
                  {lowerRoles.map((r) => (
                    <DropdownMenuItem
                      key={r.id}
                      onClick={() => startRolePreview({ name: r.name, order: r.order })}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      <span>{getRoleDisplay(r.name)}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/profile/${user.id}`} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>個人資料</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
