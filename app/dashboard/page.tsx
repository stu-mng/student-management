"use client"

import { useAuth } from "@/components/auth-provider"
import { RestrictedCard } from "@/components/restricted-card"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader } from "@/components/ui/card"
import { hasAdminPermission, hasFormManagePermission, hasManagerPermission, isRoot } from "@/lib/utils"
import { BarChart3, BookOpen, FileSpreadsheet, Link2, UserCog, Users, FileText, Settings } from "lucide-react"
import Link from "next/link"

// Create a styled title component for feature cards
const FeatureTitle = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <div className="p-2 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <span className="text-xl font-semibold">
      {title}
    </span>
  </div>
);

// Enhanced description component
const FeatureDescription = ({ description }: { description: string }) => (
  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
    {description}
  </p>
);

// Styled section heading component
const SectionHeading = ({ title }: { title: string }) => (
  <div className="mb-4">
    <h2 className="text-xl relative inline-block text-gray-500">
      {title}
    </h2>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth()
  const adminFeatures = [
    {
      title: "用戶權限管理",
      description: "查看並管理系統用戶及其權限",
      icon: <UserCog className="h-8 w-8 text-blue-500" />,
      href: "/dashboard/admin/permissions",
      allowedRoles: ["admin", "root", 'manager']
    },
    {
      title: "小學伴分配",
      description: "為大學伴分配可查看的小學伴",
      icon: <Link2 className="h-8 w-8 text-purple-500" />,
      href: "/dashboard/admin/assign",
      allowedRoles: ["admin", "root", "manager"]
    },
    {
      title: "匯入小學伴資料",
      description: "從 Excel 或 CSV 檔案批量匯入小學伴資料",
      icon: <FileSpreadsheet className="h-8 w-8 text-amber-500" />,
      href: "/dashboard/admin/import",
      allowedRoles: ["admin", "root", "manager"]
    },
    {
      title: "表單管理",
      description: "創建、編輯和管理系統表單",
      icon: <Settings className="h-8 w-8 text-indigo-500" />,
      href: "/dashboard/forms/manage",
      allowedRoles: ["admin", "root", "project_manager"]
    },
    {
      title: "系統分析",
      description: "查看學伴、教師數據及系統使用情況統計",
      icon: <BarChart3 className="h-8 w-8 text-red-500" />,
      href: "/dashboard/root/analytics",
      allowedRoles: ["root"]
    },
  ]
  
  const teacherFeatures = [
    {
      title: "小學伴管理",
      description: "查看及管理小學伴資料",
      icon: <Users className="h-8 w-8 text-green-500" />,
      href: "/dashboard/students",
      allowedRoles: ["teacher", "admin", "root", "manager"]
    },
    {
      title: "表單填寫",
      description: "查看並填寫可用的表單",
      icon: <FileText className="h-8 w-8 text-orange-500" />,
      href: "/dashboard/forms",
      allowedRoles: ["student", "teacher", "admin", "root", "manager", "candidate"]
    },
    {
      title: "系統使用手冊",
      description: "提供完整功能介紹與操作指南",
      icon: <BookOpen className="h-8 w-8 text-cyan-500" />,
      href: "/dashboard/manual",
      allowedRoles: ["teacher", "admin", "root", "manager"]
    }
  ]

  // Check if user has permission for a specific feature using utility functions
  const hasPermission = (allowedRoles: string[]) => {
    if (!user?.role?.name) return false;
    
    // Use utility functions for common permission checks
    if (allowedRoles.includes('admin') && hasAdminPermission(user.role)) return true;
    if (allowedRoles.includes('manager') && hasManagerPermission(user.role)) return true;
    if (allowedRoles.includes('root') && isRoot(user.role)) return true;
    
    // Fallback to direct role name check for other roles
    return allowedRoles.includes(user.role.name);
  }

  return (
    <div className="space-y-6 pt-4">
      {/* 教師功能區塊 */}
      {user && (
        <div>
          <SectionHeading title="基本功能" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teacherFeatures.map((feature) => (
              <RestrictedCard 
                key={feature.title} 
                className="hover:shadow-md transition-shadow"
                allowedRoles={feature.allowedRoles}
              >
                <CardHeader className="p-4">
                  <FeatureTitle 
                    title={feature.title} 
                    icon={feature.icon} 
                  />
                  <FeatureDescription description={feature.description} />
                </CardHeader>
                <CardContent className="pb-4 pt-0 px-4">
                  <Link href={feature.href} passHref>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled={!hasPermission(feature.allowedRoles)}
                    >
                      {hasPermission(feature.allowedRoles) ? `前往 ${feature.title}` : `無權訪問`}
                    </Button>
                  </Link>
                </CardContent>
              </RestrictedCard>
            ))}
          </div>
        </div>
      )}

      {/* 管理員功能區塊 */}
      {user && (
        <div>
          <SectionHeading title="管理員功能" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminFeatures.map((feature) => (
              <RestrictedCard 
                key={feature.title} 
                className="hover:shadow-md transition-shadow"
                allowedRoles={feature.allowedRoles}
              >
                <CardHeader className="p-4">
                  <FeatureTitle 
                    title={feature.title} 
                    icon={feature.icon} 
                  />
                  <FeatureDescription description={feature.description} />
                </CardHeader>
                <CardContent className="pb-4 pt-0 px-4">
                  <Link href={feature.href} passHref>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled={!hasPermission(feature.allowedRoles)}
                    >
                      {hasPermission(feature.allowedRoles) ? `前往 ${feature.title}` : `無權訪問`}
                    </Button>
                  </Link>
                </CardContent>
              </RestrictedCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 