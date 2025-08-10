"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { permissionGroups, roleDescriptions, roleHeaders } from "@/lib/permissions-content"
import { getRoleBgColor, getRoleTextColor } from "@/lib/utils"
import { AlertTriangle, BookOpen, Bookmark, CheckCircle, Clock, FileText, History, Info, Layers, ListChecks, Shield, User, UserCog, Users } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useState } from "react"

interface ManualTabsProps {
  user: { role?: string } | null
  isAdmin: boolean
}

export function ManualTabs({ user, isAdmin }: ManualTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
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
    const params = new URLSearchParams(searchParams)
    params.set("tab", tab)
    router.push(`/dashboard/manual?${params.toString()}`)
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
          variant={activeTab === "forms" ? "default" : "ghost"} 
          onClick={() => handleTabChange("forms")}
          className="rounded-sm px-3 py-1.5 text-sm"
        >
          <FileText className="h-4 w-4 mr-1" /> 表單功能
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
        <Button 
          variant={activeTab === "history" ? "default" : "ghost"} 
          onClick={() => handleTabChange("history")}
          className="rounded-sm px-3 py-1.5 text-sm"
        >
          <History className="h-4 w-4 mr-1" /> 系統日誌
        </Button>
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
                    系統採用六層級權限架構：系統管理員、計畫主持人、學校負責人、科任老師、大學伴、儲備大學伴。點擊
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
                      title="興大學伴酷系統功能介紹" 
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
              <CardDescription>系統中的六個用戶角色及其基本權限</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                {roleDescriptions.map((role) => (
                  <div key={role.name} className="flex items-start gap-3">
                    <Badge variant="outline" className={`flex items-center justify-center w-20 text-center shadow-none px-2 py-1 font-medium rounded-full ${getRoleTextColor(role.name)} ${getRoleBgColor(role.name)}`}>
                      {role.displayName}
                    </Badge>
                    <div>
                      <p className="font-medium">{role.description}</p>
                      <p className="text-muted-foreground text-sm pt-1">{role.details}</p>
                    </div>
                  </div>
                ))}
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
                      {roleHeaders.map((header) => (
                        <th key={header.key} className="text-center font-medium py-2 px-2">
                          {header.name}<br />{header.subName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {permissionGroups.map((group) => (
                      <React.Fragment key={group.name}>
                        <tr className="bg-muted/20 font-medium">
                          <td colSpan={9} className="py-2 px-4">{group.name}</td>
                        </tr>
                        {group.rows.map((row, index) => (
                          <tr key={`${group.name}-${index}`}>
                            <td className="py-2 px-4">{row.resource}</td>
                            <td className="py-2 px-4 text-xs text-muted-foreground">{row.operation}</td>
                            <td className="text-center py-2 px-2">{row.permissions.root}</td>
                            <td className="text-center py-2 px-2">{row.permissions.admin}</td>
                            <td className="text-center py-2 px-2">{row.permissions['class-teacher']}</td>
                            <td className="text-center py-2 px-2">{row.permissions.manager}</td>
                            <td className="text-center py-2 px-2">{row.permissions.teacher}</td>
                            <td className="text-center py-2 px-2">{row.permissions.candidate}</td>
                            <td className="text-center py-2 px-2">{row.permissions['new-registrant']}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 表單功能 */}
      {activeTab === "forms" && (
        <div className="space-y-6">
          <Card className="border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle>表單功能說明</CardTitle>
              </div>
              <CardDescription>表單的填寫流程、段落導覽、驗證規則與提交/編輯行為</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="mb-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">1</span>
                  填寫與提交流程
                </h3>
                <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    表單資訊側欄會顯示建立時間、截止時間與表單設定（是否必填/是否允許多次提交、表單類型與狀態）。
                  </p>
                  <p className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    若表單有多個段落，可透過段落導覽在段落間切換，底部提供「上一步 / 下一步」按鈕與段落進度。
                  </p>
                  <p className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    欄位具有即時驗證與提交前驗證；未通過的欄位會顯示錯誤訊息，需修正後才能提交。
                  </p>
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    若超過截止時間，將顯示「表單已截止」，無法填寫、編輯或再次提交。
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    已提交狀態下，若允許多次提交，可再新增回應；若僅允許一次提交，可直接編輯既有回應（未逾期）。
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">2</span>
                  段落與跳題邏輯
                </h3>
                <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                  <p>表單支援多段落編排，每段落可包含多個欄位與說明文字。</p>
                  <p>單選與下拉選項可設定「跳題」行為，依使用者選擇自動跳轉至指定段落，加速填寫流程。</p>
                  <p>如該欄位為必填但尚未作答，將不會進行跳轉，以避免遺漏必要資訊。</p>
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">3</span>
                  欄位驗證與提示
                </h3>
                <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                  <p>系統內建多種驗證規則，提交前會針對當前段落與整體資料再次檢查：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>電子郵件：格式檢查，並可限制允許的網域。</li>
                    <li>身分證字號：依字首對應數字與加權計算驗證。</li>
                    <li>電話：格式與長度檢查；行動電話支援 09xx-xxx-xxx 格式。</li>
                    <li>數字：可設定必須為整數、最小值/最大值。</li>
                    <li>日期：可設定不可早於今日/不可晚於今日，或指定最小/最大日期。</li>
                    <li>多選/單選/下拉：支援選項管理與跳題。</li>
                    <li>方格題（單選/多選）：以矩陣形式呈現，儲存時會妥善序列化。</li>
                  </ul>
                  <p>欄位可設定「必填」；未填寫時會以紅色提示文字標示需補齊。</p>
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">4</span>
                  提交、再次填寫與編輯
                </h3>
                <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                  <p>提交成功後會顯示成功訊息；若允許多次提交，可在未逾期時建立新回應。</p>
                  <p>若僅允許一次提交，未逾期時可直接「編輯回覆」更新既有回應；逾期則無法編輯。</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-6 w-6 text-primary" />
                <CardTitle>欄位類型與規則</CardTitle>
              </div>
              <CardDescription>常見欄位與可用設定</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">文字類</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>短文字/長文字：可搭配 placeholder 與說明文字。</li>
                  <li>電子郵件、電話、身分證字號：套用對應格式驗證。</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">數值與日期</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>數字：支援整數限制、最小值/最大值。</li>
                  <li>日期：支援不可過去/不可未來、最小日期/最大日期。</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">選擇題</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>單選、下拉、核取方塊（多選）：可設定選項順序與狀態，並支援跳題。</li>
                  <li>單選方格 / 核取方塊格：以矩陣方式呈現多維度選擇。</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle>權限與狀態</CardTitle>
              </div>
              <CardDescription>表單狀態、是否必填、是否允許多次提交與權限預覽</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>狀態：草稿/已發布/已封存，僅「已發布」可供填寫。</li>
                <li>是否必填：標記為必填的表單可能會在首頁或清單中特別標示。</li>
                <li>允許多次提交：開啟後可重覆提交，提交成功仍可再新增回應。</li>
                <li>截止時間：逾期後會鎖定編輯與提交。</li>
                <li>權限預覽：建立或分享前可模擬不同角色視角（如大學伴/管理員）。</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 教師指南 */}
      {activeTab === "teacher" && (
        <Card>
          <CardHeader>
            <CardTitle>教師操作指南</CardTitle>
            <CardDescription>大學伴和儲備大學伴角色功能與操作流程</CardDescription>
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
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>權限說明：</strong>大學伴可查看被分配的學生；儲備大學伴可能具有有限的查看權限。
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    <strong>權限說明：</strong>大學伴可編輯被分配的學生資料；儲備大學伴通常無編輯權限；所有教師角色均無法刪除學生資料。
                  </p>
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
            <CardDescription>計畫主持人和學校負責人角色功能與操作流程</CardDescription>
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
                  <p className="text-sm text-muted-foreground">注意：您只能管理比自己權限低的用戶。計畫主持人可管理學校負責人、大學伴和儲備大學伴。</p>
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
                  <p className="text-sm text-muted-foreground">學校負責人只能分配其負責區域內的學生。</p>
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
                  <p className="text-sm text-muted-foreground">注意：請確保上傳檔案符合格式要求，包含所有必要欄位。學校負責人只能匯入其負責區域的學生。</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground mr-2 text-sm">4</span>
                  學生資料管理
                </h3>
                <div className="ml-8">
                  <p className="mb-2">計畫主持人可進行所有學生資料操作，包括新增、編輯、刪除。</p>
                  <p className="mb-2">學校負責人可管理其負責區域內的學生資料，但無法刪除學生。</p>
                  <p className="mb-2">點擊「新增學生」按鈕手動添加單個學生。</p>
                  <p className="mb-2">點擊「刪除」按鈕移除學生（不可恢復，請謹慎操作，僅計畫主持人可執行）。</p>
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
      
      {/* 系統日誌 */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                系統日誌
              </CardTitle>
              <CardDescription>記錄各版本的重大功能更新與系統發展歷程</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* 版本 2.3.0 - 新增 */}
              <div className="border-l-4 border-emerald-500 pl-4 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="bg-emerald-500 text-white">v2.3.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 8 月 10 日 - 最新版本</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">〔功能升級〕通知中心、表單功能升級、權限預覽</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 新增通知中心，統一接收系統與表單相關通知</li>
                  <li>• 表單功能升級，包含表單區段、資料驗證、提示圖片等進階功能</li>
                  <li>• 新增權限預覽，建立/分享前可模擬不同角色視角</li>
                </ul>
              </div>
              {/* 版本 2.2.0 - 新增 */}
              <div className="border-l-4 border-emerald-500 pl-4 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="bg-emerald-500 text-white">v2.2.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 6 月 3 日</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">〔重要修復〕表單編輯與權限管理優化</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 修復表單編輯造成回覆遺失的問題</li>
                  <li>• 修復表單管理 manager 權限卡控問題</li>
                </ul>
              </div>

              {/* 版本 2.1.0 */}
              <div className="border-l-4 border-emerald-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-emerald-500 text-emerald-500">v2.1.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 6 月 1 日</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">〔功能擴充〕表單題型與統計功能優化</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 新增單選方格題型，支援矩陣式選擇</li>
                  <li>• 新增核取方塊格題型，實現多重選擇</li>
                  <li>• 實作表單回應統計圖表功能</li>
                  <li>• 優化表單編輯介面與操作流程</li>
                  <li>• 修復表單編輯時的資料保存問題</li>
                </ul>
              </div>

              {/* 版本 2.0.0 - 調整狀態 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-purple-500 text-purple-600">v2.0.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 5 月 29 日</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">〔重大更新〕RBAC 系統升級與表單功能</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 實作完整的 RBAC (Role-Based Access Control) 權限系統</li>
                  <li>• 新增用戶角色權限層級管理</li>
                  <li>• 新增表單系統，支援多種回應類型</li>
                  <li>• 新增表單權限控制與存取管理</li>
                  <li>• 實作表單回應編輯與更新功能</li>
                </ul>
              </div>

              {/* 版本 1.6.0 - 最新版本 */}
              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-primary text-primary">v1.6.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 5 月底</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Docker 容器化與部署優化</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 新增 Docker 支援，實現容器化部署</li>
                  <li>• 建立 GitHub Actions 自動化工作流程</li>
                  <li>• 優化生產環境配置與環境變數管理</li>
                  <li>• 新增 Google Analytics 追蹤功能</li>
                </ul>
              </div>

              {/* 版本 1.5.0 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-blue-500 text-blue-600">v1.5.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 5 月</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">區域管理員功能與權限系統重構</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 新增「區域管理員」角色，實現分區管理</li>
                  <li>• 為學生和用戶新增區域屬性</li>
                  <li>• 實現區域管理員的學生新增規則</li>
                  <li>• 允許區域管理員訪問匯入功能</li>
                  <li>• 優化權限指南頁面，開放公開訪問</li>
                </ul>
              </div>

              {/* 版本 1.4.0 */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-green-500 text-green-600">v1.4.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 5 月</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">使用者手冊與介面優化</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 新增完整的使用者手冊頁面</li>
                  <li>• 修復標籤頁面的 Suspense 組件問題</li>
                  <li>• 優化學生資訊對話框，新增缺失欄位</li>
                  <li>• 新增學生刪除操作的提示訊息</li>
                </ul>
              </div>

              {/* 版本 1.3.0 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-purple-500 text-purple-600">v1.3.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 5 月</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">主題系統與用戶體驗提升</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 新增深色/淺色主題切換功能</li>
                  <li>• 修復新增學生頁面的類型錯誤</li>
                  <li>• 優化品牌名稱顯示</li>
                  <li>• 移除冗餘的功能卡片</li>
                </ul>
              </div>

              {/* 版本 1.2.0 */}
              <div className="border-l-4 border-orange-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-orange-500 text-orange-600">v1.2.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 5 月</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">系統分析與監控功能</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 新增用戶在線狀態顯示</li>
                  <li>• 建立儀表板面板與分析頁面</li>
                  <li>• 實現前端與後端的數據分析功能</li>
                  <li>• 優化分析頁面的角色顯示</li>
                </ul>
              </div>

              {/* 版本 1.1.0 */}
              <div className="border-l-4 border-red-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-red-500 text-red-600">v1.1.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 5 月</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">網站架構與安全性建立</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 新增首頁、隱私政策和服務條款頁面</li>
                  <li>• 建立頁尾版權聲明</li>
                  <li>• 實現白名單機制，移除受保護路由</li>
                  <li>• 設定公開頁面的訪問權限</li>
                </ul>
              </div>

              {/* 版本 1.0.0 */}
              <div className="border-l-4 border-gray-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-gray-500 text-gray-600">v1.0.0</Badge>
                  <span className="text-sm text-muted-foreground">2025 年 4 月</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">系統初始版本</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 建立基礎的興大學伴酷系統架構</li>
                  <li>• 實現基本的用戶認證與授權</li>
                  <li>• 建立學生資料的 CRUD 操作</li>
                  <li>• 設定初始的資料庫結構</li>
                </ul>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
} 