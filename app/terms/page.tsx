"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TermsPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">使用者條款</h1>
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => router.back()}
            >
              返回
            </Button>
        </div>
        
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-4">最後更新日期：2025 年 04 月 29 日</p>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. 服務介紹</h2>
            <p>歡迎使用興大學伴酷系統（以下簡稱「本服務」）。本服務旨在提供學生資訊管理、課程安排及學習進度追蹤等功能。使用本服務前，請詳閱以下條款。</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. 使用條件</h2>
            <p>2.1 用戶必須使用真實、合法的身份信息及符合資格的 Google 帳戶登入本系統。</p>
            <p>2.2 用戶在使用過程中應遵守相關法律法規及本條款的規定。</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. 帳戶安全</h2>
            <p>3.1 用戶應妥善保管自己的帳戶信息，確保帳戶安全。</p>
            <p>3.2 如發現任何未經授權使用帳戶的情況，請立即通知系統管理員。</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. 資料使用</h2>
            <p>4.1 本系統收集的學生資料僅用於教育管理相關目的。</p>
            <p>4.2 用戶應確保輸入系統的資料真實、準確且不侵犯他人權益。</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. 免責聲明</h2>
            <p>5.1 本服務在法律允許的最大範圍內提供「按現狀」及「按可用性」原則。</p>
            <p>5.2 系統管理者不對因系統故障、資料丟失等情況承擔責任。</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">6. 條款修改</h2>
            <p>我們保留隨時修改使用條款的權利，修改後的條款將在本頁面公佈。重大變更將通過系統通知提醒用戶。</p>
          </section>
          
          <div className="mt-8 text-center">
            <p>如您對本條款有任何疑問，請聯繫系統管理員。</p>
            <p className="mt-4">
              <Link href="/privacy" className="text-blue-600 hover:underline">
                查看隱私條款
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 