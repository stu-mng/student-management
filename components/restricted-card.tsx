'use client'

import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, getRoleBgColor, getRoleDisplay, getRoleTextColor } from "@/lib/utils";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import React from 'react';

type ChildrenFunction = (props: { 
  badgeContent: string | null; 
  badgeBgColor: string;
  badgeTextColor: string;
}) => React.ReactNode;

interface RestrictedCardProps {
  allowedRoles?: string[];
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode | ChildrenFunction;
  footer?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

export function RestrictedCard({
  allowedRoles = [],
  title,
  description,
  children,
  footer,
  className,
  ...props
}: RestrictedCardProps) {
  const router = useRouter();
  const { user } = useAuth();

  // 檢查用戶是否有權限查看此卡片
  const hasPermission = () => {
    if (!user?.role?.name) return false;
    if (allowedRoles.length === 0) return true; // 如果沒有設置限制，則所有人都能看到
    return allowedRoles.includes(user.role.name);
  };

  // 如果用戶沒有權限，直接不渲染此組件
  if (!hasPermission()) {
    return null;
  }

  // Determine badge content based on allowed roles
  const getCardBadgeContent = () => {
    if (allowedRoles.length === 0) {
      return null;
    }
    
    let content: string = '';
    (['root', 'admin', 'class-teacher', 'manager' , 'teacher', 'candidate', 'new-registrant'] as string[]).forEach((role: string) => {
      if (allowedRoles.includes(role)) {
        content = getRoleDisplay(role);
      }
    });
    return content;
  };

  // Get the role-specific background color
  const getCardRoleBgColor = () => {
    let bgColor: string = '';

    (['root', 'admin', 'class-teacher', 'manager', 'teacher', 'new-registrant', 'candidate'] as string[]).forEach((role: string) => {
      if (allowedRoles.includes(role)) {
        bgColor = getRoleBgColor(role);
      }
    });

    return bgColor;
  };

  // Get the role-specific text color
  const getCardRoleTextColor = () => {
    let textColor: string = '';

    (['root', 'admin', 'class-teacher', 'manager', 'teacher', 'new-registrant', 'candidate'] as string[]).forEach((role: string) => {
      if (allowedRoles.includes(role)) {
        textColor = getRoleTextColor(role);
      }
    });

    return textColor;
  };

  const badgeContent = getCardBadgeContent();
  
  return (
    <Card className={cn("relative", className)} {...props}>
      {badgeContent && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline"
                className={cn(`cursor-pointer absolute top-3 right-3 z-10 shadow-none px-2 py-1 text-xs font-medium rounded-full`, getCardRoleTextColor(), getCardRoleBgColor())}
                onClick={() => router.push('/dashboard/manual?tab=permissions')}
              >
                <Lock className="w-3 h-3 mr-1" />
                {badgeContent}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>前往查看權限說明</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      {children && (
        typeof children === 'function' 
          ? (children as ChildrenFunction)({ 
              badgeContent, 
              badgeBgColor: getCardRoleBgColor(),
              badgeTextColor: getCardRoleTextColor()
            }) 
          : children
      )}
      
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
} 