import { RestrictedCard } from "@/components/restricted-card";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileSpreadsheet, Shield, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <div className="container flex min-h-[60vh] flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-8 text-center">
            <h1 className="text-5xl font-bold tracking-tight">學生管理系統</h1>
            <p className="text-xl text-muted-foreground">
              高效能、安全的學生資料管理解決方案
            </p>
            <div className="flex flex-col space-y-4 pt-8">
              <Link href="/login" passHref>
                <Button className="w-full" size="lg">
                  登入系統
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container py-16">
          <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Student Management */}
            <RestrictedCard className="hover:shadow-lg transition-shadow" allowedRoles={["teacher", "admin", "root"]}>
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>學生資料管理</CardTitle>
                <CardDescription>
                  完整的學生資料管理，包含新增、編輯、查詢及教師分配
                </CardDescription>
              </CardHeader>
            </RestrictedCard>

            {/* Data Import */}
            <RestrictedCard className="hover:shadow-lg transition-shadow" allowedRoles={["admin", "root"]}>
              <CardHeader>
                <FileSpreadsheet className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>資料匯入</CardTitle>
                <CardDescription>
                  支援多種格式的資料匯入，快速建立學生資料庫
                </CardDescription>
              </CardHeader>
            </RestrictedCard>

            {/* User Permissions */}
            <RestrictedCard className="hover:shadow-lg transition-shadow" allowedRoles={["admin", "root"]}>
              <CardHeader>
                <Shield className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>權限管理</CardTitle>
                <CardDescription>
                  細緻的權限控制系統，確保資料安全
                </CardDescription>
              </CardHeader>
            </RestrictedCard>

            {/* Analytics */}
            <RestrictedCard className="md:col-start-2 hover:shadow-lg transition-shadow" allowedRoles={["root"]}>
              <CardHeader>
                <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>數據分析</CardTitle>
                <CardDescription>
                  內建系統監測，提供即時資料分析
                </CardDescription>
              </CardHeader>
            </RestrictedCard>

          </div>
        </div>
      </main>
      
    </div>
  );
}
