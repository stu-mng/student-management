"use client"

import { useAuth } from "@/components/auth-provider"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isAdmin } from "@/lib/utils"
import { User, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function DashboardHeader() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

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

  return (
    <header className="border-b w-full">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <MobileNav />
          <Link href="/dashboard" className="font-semibold">
            小學伴管理系統
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || ""} alt={displayName} />
                    <AvatarFallback>
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
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
