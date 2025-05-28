"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { isAdmin } from "@/lib/utils"
import { Menu, User, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export function MobileNav() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isAdminUser = isAdmin(user?.role)
  
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

  const handleSignOut = () => {
    setOpen(false)
    signOut()
  }

  const handleProfileClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">開啟選單</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[280px] sm:w-[320px] p-0 flex-col">
        <SheetHeader className="px-6 border-b py-4 shrink-0">
          <SheetTitle className="text-left">小學伴資料管理系統</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex flex-col py-6 px-4 flex-1">
            {navigation.map((item) => {
              if (item.admin && !isAdminUser) return null

              return (
                <SheetClose asChild key={item.name}>
                  <Link
                    href={item.href}
                    className={`px-4 py-3 text-sm font-medium transition-colors rounded-md mb-1 ${
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
                    }`}
                  >
                    {item.name}
                  </Link>
                </SheetClose>
              )
            })}
          </nav>
        </div>
        <div className="px-6 py-4 border-t bg-muted/30 shrink-0">
          {user && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <span className="truncate">{displayName}</span>
              </div>
              <div className="flex gap-2">
                <SheetClose asChild>
                  <Link href={`/dashboard/profile/${user.id}`} onClick={handleProfileClick}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <User className="mr-2 h-4 w-4" />
                      個人資料
                    </Button>
                  </Link>
                </SheetClose>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut} 
                  className="flex-1"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 