"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Bookmark, Info, Shield, User, UserCog, Users } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getRoleTextColor, getRoleBgColor } from "@/lib/utils"

interface ManualTabsProps {
  user: any
  isAdmin: boolean
}

export function ManualTabs({ user, isAdmin }: ManualTabsProps) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  
  // Get tab from URL when component mounts
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", tab)
    window.history.pushState({}, "", url)
  }

  return (
    <>
      {/* Tabs Navigation */}
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
        <Button 
          variant={activeTab === "overview" ? "default" : "ghost"} 
          onClick={() => handleTabChange("overview")}
          className="rounded-sm px-3 py-1.5 text-sm"
        >
          <BookOpen className="h-4 w-4 mr-1" /> 系統概述
        </Button>
        <Button 
          variant={activeTab === "permissions" ? "default" : "ghost"} 
          onClick={() => handleTabChange("permissions")}
          className="rounded-sm px-3 py-1.5 text-sm"
        >
          <Shield className="h-4 w-4 mr-1" /> 權限說明
        </Button>
        <Button 
          variant={activeTab === "teacher" ? "default" : "ghost"} 
          onClick={() => handleTabChange("teacher")}
          className="rounded-sm px-3 py-1.5 text-sm"
        >
          <User className="h-4 w-4 mr-1" /> 教師指南
        </Button>
        {isAdmin && (
          <Button 
            variant={activeTab === "admin" ? "default" : "ghost"} 
            onClick={() => handleTabChange("admin")}
            className="rounded-sm px-3 py-1.5 text-sm"
          >
            <UserCog className="h-4 w-4 mr-1" /> 管理員指南
          </Button>
        )}
        {user?.role === "root" && (
          <Button 
            variant={activeTab === "root" ? "default" : "ghost"} 
            onClick={() => handleTabChange("root")}
            className="rounded-sm px-3 py-1.5 text-sm"
          >
            <UserCog className="h-4 w-4 mr-1" /> 系統管理員指南
          </Button>
        )}
      </div>
      
      {/* 系統概述 */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>小學伴資料管理系統</CardTitle>
              <CardDescription>系統功能與特色概述</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">系統簡介</h3>
                <p>小學伴資料管理系統是一個為教育組織設計的網頁應用程式，用於管理小學伴資料、追蹤小學伴資訊，並控制教師和管理員對小學伴資料的訪問權限。</p>
              </div>
              
              <Alert className="my-2">
                <AlertDescription className="flex gap-4 items-center">
                  <Info className="h-4 w-4" />
                  <p>
                    請注意：舊版系統尚未包含「區域管理員」角色。點擊
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mx-2 h-auto p-0 text-primary" 
                      onClick={() => handleTabChange("permissions")}
                    >
                      權限說明
                    </Button>
                    標籤查看詳細權限資訊。
                  </p>
                </AlertDescription>
              </Alert>
              
              <div className="w-full flex justify-center">
                  <div className="max-w-[70%] w-[48rem] h-[27rem] relative mt-6 mb-8 overflow-hidden rounded-lg border border-border">
                  <iframe 
                      src="https://www.youtube.com/embed/4CgpOY9dcpU" 
                      title="學生管理系統功能介紹" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="absolute top-0 left-0 h-full w-full"
                      ></iframe>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <h4 className="font-medium">學生資料管理</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">管理學生基本資料、詳細背景、弱勢學生識別及分類</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Bookmark className="h-5 w-5 mr-2 text-primary" />
                    <h4 className="font-medium">資料匯入功能</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">支援從 Excel 或 CSV 檔案批量匯入學生資料</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    <h4 className="font-medium">使用者權限管理</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">多層級權限系統與白名單機制，確保資料安全</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    <h4 className="font-medium">系統監控與數據分析</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">即時用戶活動監控與學生資料統計分析</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 權限說明 */}
      {activeTab === "permissions" && (
        <div className="space-y-6">
          <Card className="border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle>權限層級體系</CardTitle>
              </div>
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
            <CardHeader>
              <CardTitle>權限矩陣表</CardTitle>
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
                      <td className="text-center py-2 px-4">僅本區域</td>
                      <td className="text-center py-2 px-4">僅被分配</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4">刪除學生</td>
                      <td className="py-2 px-4 text-xs text-muted-foreground">DELETE /api/students/[id]</td>
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
        </div>
      )}
      
      {/* 教師指南 */}
      {activeTab === "teacher" && (
        <Card>
          <CardHeader>
            <CardTitle>教師操作指南</CardTitle>
            <CardDescription>教師角色功能與操作流程</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">1</span>
                  登入系統
                </h3>
                <div className="ml-8">
                  <p className="mb-2">使用 Google 帳號登入系統，系統會驗證您的授權狀態。</p>
                  <p className="text-sm text-muted-foreground">注意：未被添加至白名單的教師無法存取系統功能。</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">2</span>
                  查看學生資料
                </h3>
                <div className="ml-8">
                  <p className="mb-2">進入學生資料管理頁面，可查看被分配給您的學生。</p>
                  <p className="mb-2">使用搜尋欄位尋找特定學生，或使用篩選功能進行多條件篩選。</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>輸入關鍵字：例如 "男" 尋找男生、"1" 尋找一年級學生</li>
                    <li>使用篩選器：可同時設定多個條件，如 "年級=3 且 班級=2"</li>
                  </ul>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">3</span>
                  查看學生詳細資料
                </h3>
                <div className="ml-8">
                  <p className="mb-2">點擊「查看」按鈕開啟學生詳細資料對話框。</p>
                  <p className="mb-2">在對話框中可使用上/下一個按鈕或鍵盤左右鍵在學生間切換。</p>
                  <p className="mb-2">點擊眼睛圖示可顯示/隱藏學生帳號密碼。</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">4</span>
                  編輯學生資料
                </h3>
                <div className="ml-8">
                  <p className="mb-2">點擊「編輯」按鈕修改學生資訊。</p>
                  <p className="mb-2">填寫表單後點擊「更新學生」儲存變更。</p>
                  <p className="text-sm text-muted-foreground">注意：教師無法刪除學生資料，僅能編輯。</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 管理員指南 */}
      {activeTab === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>管理員操作指南</CardTitle>
            <CardDescription>管理員角色功能與操作流程</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">1</span>
                  管理用戶權限
                </h3>
                <div className="ml-8">
                  <p className="mb-2">進入「用戶權限管理」頁面，查看系統中所有用戶。</p>
                  <p className="mb-2">點擊「新增用戶」按鈕將教師加入白名單並設定角色。</p>
                  <p className="mb-2">為已存在用戶修改權限，或從系統中移除用戶。</p>
                  <p className="text-sm text-muted-foreground">注意：您只能管理比自己權限低的用戶。</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">2</span>
                  學生分配
                </h3>
                <div className="ml-8">
                  <p className="mb-2">進入「小學伴分配」頁面，選擇要分配學生的教師。</p>
                  <p className="mb-2">勾選需要分配給該教師的學生。</p>
                  <p className="mb-2">點擊「保存分配」按鈕確認變更。</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">3</span>
                  匯入學生資料
                </h3>
                <div className="ml-8">
                  <p className="mb-2">進入「匯入小學伴資料」頁面，上傳 Excel 或 CSV 檔案。</p>
                  <p className="mb-2">檢查預覽資料是否正確，確認無誤後點擊「確認匯入」。</p>
                  <p className="text-sm text-muted-foreground">注意：請確保上傳檔案符合格式要求，包含所有必要欄位。</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">4</span>
                  學生資料管理
                </h3>
                <div className="ml-8">
                  <p className="mb-2">管理員可進行所有學生資料操作，包括新增、編輯、刪除。</p>
                  <p className="mb-2">點擊「新增學生」按鈕手動添加單個學生。</p>
                  <p className="mb-2">點擊「刪除」按鈕移除學生（不可恢復，請謹慎操作）。</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 系統管理員指南 */}
      {activeTab === "root" && (
        <Card>
          <CardHeader>
            <CardTitle>系統管理員操作指南</CardTitle>
            <CardDescription>系統管理員特有功能與操作流程</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">1</span>
                  系統分析
                </h3>
                <div className="ml-8">
                  <p className="mb-2">進入「系統分析」頁面，查看系統即時統計數據。</p>
                  <p className="mb-2">監控當前在線用戶、學生總數、弱勢學生比例等關鍵指標。</p>
                  <p className="mb-2">查看各類圖表，了解學生年級分佈、類型分佈等資訊。</p>
                  <p className="mb-2">檢視教師活動狀況與學生分配情況。</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">2</span>
                  最高權限管理
                </h3>
                <div className="ml-8">
                  <p className="mb-2">擁有管理所有用戶權限，包括其他管理員。</p>
                  <p className="mb-2">可指派或撤銷管理員權限。</p>
                  <p className="text-sm text-muted-foreground">注意：系統可擁有多個系統管理員，彼此無法互相管理。</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
} 