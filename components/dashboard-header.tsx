"use client"

import { useAuth } from "@/components/auth-provider"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function DashboardHeader() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const isAdmin = user?.role === "admin" || user?.role === "root";
  
  const avatarUrl = user?.user_metadata?.avatar_url || 
                    user?.user_metadata?.picture || 
                    null
                    
  const displayName = user?.user_metadata?.full_name || 
                     user?.user_metadata?.name || 
                     user?.email || 
                     ""

  const navigation = [
    { name: "控制台", href: "/dashboard", admin: false },
    { name: "學生管理", href: "/dashboard/students", admin: false },
  ]

  return (
    <header className="border-b w-full">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <MobileNav />
          <Link href="/dashboard" className="font-semibold">
            學生管理系統
          </Link>
          <nav className="hidden md:flex gap-4">
            {navigation.map((item) => {
              if (item.admin && !isAdmin) return null

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
          {user && (
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              {avatarUrl && (
                <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                  <Image 
                    src={avatarUrl} 
                    alt="User avatar" 
                    width={32} 
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <span className="max-w-[200px] truncate">{displayName}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={signOut} className="hidden md:inline-flex">
            登出
          </Button>
        </div>
      </div>
    </header>
  )
}
