"use client"

import FileUpload from "@/components/file-upload"
import { useRouter } from "next/navigation"

export default function ImportPage() {
  const router = useRouter()

  const handleImportSuccess = () => {
    // 匯入成功後重定向到學生列表
    router.push("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">匯入學生資料</h1>
        <p className="text-muted-foreground">從 Excel 或 CSV 檔案批量匯入學生資料</p>
      </div>

      <FileUpload onSuccess={handleImportSuccess} />
    </div>
  )
}
