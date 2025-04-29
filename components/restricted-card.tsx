import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
  [key: string]: any;
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
  // Determine badge content based on allowed roles
  const getBadgeContent = () => {
    if (allowedRoles.length === 0) {
      return null;
    }
    
    const hasTeacher = allowedRoles.includes('teacher');
    const hasAdmin = allowedRoles.includes('admin');
    const hasRoot = allowedRoles.includes('root');
    
    if (hasTeacher && hasAdmin && hasRoot) {
      return '教師可用';
    } else if (hasAdmin && hasRoot && !hasTeacher) {
      return '僅限管理員';
    } else if (hasRoot && !hasAdmin && !hasTeacher) {
      return '僅限最高管理員';
    } else if (allowedRoles.length > 0) {
      return '權限限制';
    }
    
    return null;
  };

  // Get the role-specific background color
  const getRoleBgColor = () => {
    const hasTeacher = allowedRoles.includes('teacher');
    const hasAdmin = allowedRoles.includes('admin');
    const hasRoot = allowedRoles.includes('root');
    
    if (hasRoot && !hasAdmin && !hasTeacher) {
      return 'bg-red-100'; // Root only
    } else if (hasAdmin && hasRoot && !hasTeacher) {
      return 'bg-blue-100'; // Admin+Root
    } else if (hasTeacher) {
      return 'bg-green-100'; // Teacher access
    }
    
    return 'bg-gray-100';
  };

  // Get the role-specific text color
  const getRoleTextColor = () => {
    const hasTeacher = allowedRoles.includes('teacher');
    const hasAdmin = allowedRoles.includes('admin');
    const hasRoot = allowedRoles.includes('root');
    
    if (hasRoot && !hasAdmin && !hasTeacher) {
      return 'text-red-800'; // Root only
    } else if (hasAdmin && hasRoot && !hasTeacher) {
      return 'text-blue-800'; // Admin+Root
    } else if (hasTeacher) {
      return 'text-green-800'; // Teacher access
    }
    
    return 'text-gray-800';
  };

  const badgeContent = getBadgeContent();
  
  return (
    <Card className={cn("relative", className)} {...props}>
      {badgeContent && (
        <Badge 
          variant="outline"
          className={`absolute top-3 right-3 z-10 shadow-none px-2 py-1 text-xs font-medium rounded-full ${getRoleTextColor()} ${getRoleBgColor()}`}
        >
          {badgeContent}
        </Badge>
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
              badgeBgColor: getRoleBgColor(),
              badgeTextColor: getRoleTextColor()
            }) 
          : children
      )}
      
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
} 