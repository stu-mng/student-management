"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getRoleBgColor } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user: {
    id: string
    name: string | null
    email: string
    avatar_url?: string | null
    last_active?: string | null
    role?: {
      name: string
    }
  }
  size?: "sm" | "md" | "lg"
  showOnlineStatus?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16"
}

const onlineIndicatorSizes = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4"
}

const isOnline = (lastActive: string | null | undefined) => {
  if (!lastActive) return false
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  return new Date(lastActive) > fiveMinutesAgo
}

export function UserAvatar({ 
  user, 
  size = "md", 
  showOnlineStatus = true, 
  className 
}: UserAvatarProps) {
  const userIsOnline = showOnlineStatus && isOnline(user.last_active)
  
  return (
    <div className={cn("relative", className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={user.avatar_url || ""} alt={user.name || ""} />
        <AvatarFallback className={getRoleBgColor(user.role?.name || '')}>
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {userIsOnline && (
        <span className={cn(
          "absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-white",
          onlineIndicatorSizes[size]
        )}>
          <span className="absolute inset-0 rounded-full bg-green-500 animate-pulse" />
        </span>
      )}
    </div>
  )
} 