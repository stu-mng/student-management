"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getRoleTextColor, getRoleBgColor } from "@/lib/utils"

export default function PermissionsGuidePage() {
  const router = useRouter()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">權限分級說明</h1>
          <p className="text-muted-foreground">學生管理系統權限層級與資源訪問控制詳細說明</p>
        </div>
      </div>

      <Card className="border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-foreground">權限層級體系</CardTitle>
          <CardDescription>系統中的四個用戶角色及其基本權限</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className={`shadow-none px-2 py-1 font-medium rounded-full ${getRoleTextColor('root')} ${getRoleBgColor('root')}`}>
                系統管理員
              </Badge>
              <div>
                <p className="font-medium">最高權限管理者，能夠管理所有使用者、學生資料及所有系統功能。</p>
                <p className="text-muted-foreground text-sm pt-1">可以創建其他系統管理員、全域管理員、區域管理員和大學伴。</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge variant="outline" className={`shadow-none px-2 py-1 font-medium rounded-full ${getRoleTextColor('admin')} ${getRoleBgColor('admin')}`}>
                全域管理員
              </Badge>
              <div>
                <p className="font-medium">全系統管理者，能夠管理除系統管理員外的所有使用者，以及所有學生資料。</p>
                <p className="text-muted-foreground text-sm pt-1">可以創建區域管理員和大學伴，管理所有區域的資料。</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge variant="outline" className={`shadow-none px-2 py-1 font-medium rounded-full ${getRoleTextColor('manager')} ${getRoleBgColor('manager')}`}>
                區域管理員
              </Badge>
              <div>
                <p className="font-medium">特定區域的管理者，只能管理其負責區域的學生資料，以及查看所在區域的資訊。</p>
                <p className="text-muted-foreground text-sm pt-1">可以創建大學伴，並將區域內的學生分配給大學伴。</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge variant="outline" className={`shadow-none px-2 py-1 font-medium rounded-full ${getRoleTextColor('teacher')} ${getRoleBgColor('teacher')}`}>
                　大學伴　
              </Badge>
              <div>
                <p className="font-medium">最基本使用者，只能查看被分配給自己的學生資料。</p>
                <p className="text-muted-foreground text-sm pt-1">無法創建或管理其他用戶，僅能查看被分配的學生。</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-foreground">權限矩陣表</CardTitle>
          <CardDescription>詳細的資源訪問權限對照表</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-2 px-4">資源</th>
                  <th className="text-left font-medium py-2 px-4">操作</th>
                  <th className="text-center font-medium py-2 px-4">系統管理員<br />(root)</th>
                  <th className="text-center font-medium py-2 px-4">全域管理員<br />(admin)</th>
                  <th className="text-center font-medium py-2 px-4">區域管理員<br />(manager)</th>
                  <th className="text-center font-medium py-2 px-4">大學伴<br />(teacher)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="bg-muted/20 font-medium">
                  <td colSpan={6} className="py-2 px-4">使用者管理</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">查看用戶列表</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">GET /api/users</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">查看用戶詳情</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">GET /api/users/[id]</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">僅自己</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">新增用戶</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">POST /api/users</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">編輯用戶</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">PUT /api/users/[id]</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">除 root 外</td>
                  <td className="text-center py-2 px-4">除 root／admin 外</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">刪除用戶</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">DELETE /api/users/[id]</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">除 root 外</td>
                  <td className="text-center py-2 px-4">除 root／admin 外</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">創建系統管理員</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">權限操作</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">❌</td>
                  <td className="text-center py-2 px-4">❌</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                
                <tr className="bg-muted/20 font-medium">
                  <td colSpan={6} className="py-2 px-4">學生管理</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">查看所有學生</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">GET /api/students</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">僅本區域</td>
                  <td className="text-center py-2 px-4">僅被分配</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">查看學生詳情</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">GET /api/students/[id]</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">僅本區域</td>
                  <td className="text-center py-2 px-4">僅被分配</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">新增學生</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">POST /api/students</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">僅本區域</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">編輯學生</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">PUT /api/students/[id]</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">❌</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">刪除學生</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">DELETE /api/students/[id]</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">❌</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">匯入學生資料</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">POST /api/students/import</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">❌</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>

                <tr className="bg-muted/20 font-medium">
                  <td colSpan={6} className="py-2 px-4">權限管理</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">分配學生給教師</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">POST /api/permissions/assign</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">僅本區域</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">查看教師分配</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">GET /api/permissions/assigned/students/[id]</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">僅自己</td>
                </tr>

                <tr className="bg-muted/20 font-medium">
                  <td colSpan={6} className="py-2 px-4">區域管理</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">查看區域列表</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">GET /api/regions</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">管理用戶區域</td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">透過用戶操作</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">✅</td>
                  <td className="text-center py-2 px-4">❌</td>
                  <td className="text-center py-2 px-4">❌</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-foreground">特殊權限規則</CardTitle>
          <CardDescription>額外的權限管理限制說明</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">用戶層級限制</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-4">
                <li>用戶只能創建/編輯權限比自己低的用戶</li>
                <li>用戶無法編輯/刪除比自己權限高的用戶</li>
                <li>用戶無法刪除自己的帳號</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">區域管理員限制</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-4">
                <li>區域管理員只能查看/管理其所屬區域的學生</li>
                <li>如果區域管理員未指定區域，則無法查看任何學生</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">權限分配限制</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-4">
                <li>區域管理員只能將學生分配給大學伴</li>
                <li>新增學生時區域管理員的學生會自動被指定相同區域</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">大學伴限制</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-4">
                <li>大學伴只能查看被明確分配給自己的學生</li>
                <li>若沒有被分配任何學生，則看不到任何學生資料</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 