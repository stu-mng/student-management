"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PrivacyPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">隱私條款</h1>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="text-sm"
          >
            返回
          </Button>
        </div>
        
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-4">最後更新日期：2025 年 04 月 29 日</p>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. 資料收集</h2>
            <p>學生管理系統收集以下資訊：</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>基本個人資料</li>
              <li>學業相關資料</li>
              <li>系統使用紀錄（登入時間、操作記錄等）</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. 資料使用目的</h2>
            <p>我們收集的資料將用於：</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>提供學生資訊管理服務</li>
              <li>優化系統功能與用戶體驗</li>
              <li>發送重要通知與系統更新資訊</li>
              <li>生成統計數據與報告（以匿名形式）</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. 資料保護</h2>
            <p>我們採取以下措施保護您的資料：</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>使用加密技術保護資料傳輸與儲存</li>
              <li>實施嚴格的存取控制機制</li>
              <li>定期進行安全評估與更新</li>
              <li>只允許授權人員存取學生資料</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. 第三方分享</h2>
            <p>除非法律要求或經您同意，我們不會將您的個人資料分享給任何第三方。在某些情況下，我們可能需要與以下第三方分享資料：</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>教育相關單位（如需提供學業資訊）</li>
              <li>系統維護服務提供商（僅限必要的技術支援）</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. 用戶權利</h2>
            <p>關於您的個人資料，您有權：</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>查詢或要求閱覽</li>
              <li>要求製給複製本</li>
              <li>要求補充或更正</li>
              <li>要求停止蒐集、處理或利用</li>
              <li>要求刪除（在法律允許範圍內）</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">6. Cookie 使用</h2>
            <p>本系統使用 cookies 以提升用戶體驗並記住登入狀態。您可以通過瀏覽器設置調整 cookie 接受程度，但這可能影響系統部分功能。</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">7. 隱私條款更新</h2>
            <p>我們保留隨時修改本隱私條款的權利。條款更新後，將在本頁面發布新版本，並在顯著位置標示更新日期。重大變更將通過系統通知提醒用戶。</p>
          </section>
          
          <div className="mt-8 text-center">
            <p>如您對本隱私條款有任何疑問，請聯繫系統管理員。</p>
            <p className="mt-4">
              <Link href="/terms" className="text-blue-600 hover:underline">
                查看使用者條款
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 