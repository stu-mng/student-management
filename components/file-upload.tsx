"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { parseStudentFile, StudentImportData } from "@/lib/utils/file-parser"
import type { ColumnDef } from "@tanstack/react-table"
import { RefreshCw, Upload } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"

interface FileUploadProps {
  onSuccess?: () => void
}

export default function FileUpload({ onSuccess }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<StudentImportData[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsProcessing(true)
    setShowPreview(false)

    try {
      const students = await parseStudentFile(file)
      setParsedData(students)
      setIsProcessing(false)
      setShowPreview(true)
    } catch (error) {
      console.error("解析檔案錯誤:", error)
      toast.error("錯誤", {
        description: "無法解析檔案，請確保檔案格式正確",
      })
      setFileName(null)
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error("錯誤", {
        description: "沒有資料可以上傳",
      })
      return
    }

    setIsUploading(true)

    try {
      const response = await fetch("/api/students/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedData),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "上傳失敗")
      }

      const result = await response.json()
      
      toast.success("成功", {
        description: `已成功上傳 ${parsedData.length} 筆學生資料`,
      })

      // 重置表單
      setFileName(null)
      setParsedData([])
      setShowPreview(false)
      if (fileInputRef.current) fileInputRef.current.value = ""

      // 呼叫成功回調
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("上傳資料錯誤:", error)

      toast.error("錯誤", {
        description: error.message || "上傳資料時發生錯誤",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setFileName(null)
    setParsedData([])
    setShowPreview(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const columns: ColumnDef<StudentImportData>[] = [
    {
      accessorKey: "name",
      header: '姓名'
    },
    {
      accessorKey: "gender",
      header: '性別'
    },
    {
      accessorKey: "grade",
      header: '年級'
    },
    {
      accessorKey: "class",
      header: '班級'
    },
    {
      accessorKey: "email",
      header: '電子郵件'
    },
    {
      accessorKey: "student_type",
      header: '學生類型'
    },
    {
      accessorKey: "is_disadvantaged",
      header: '是否弱勢生'
    },
  ]

  // 使用 useMemo 來避免不必要的重新計算
  const searchableColumns = useMemo(
    () => [
      {
        id: "name",
        title: "姓名",
      },
      {
        id: "email",
        title: "電子郵件",
      },
    ],
    [],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>匯入學生資料</CardTitle>
        <CardDescription>上傳 Excel 或 CSV 檔案以批量匯入學生資料</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showPreview && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              選擇檔案
            </Button>
            {fileName && <p className="mt-2 text-sm text-muted-foreground">已選擇: {fileName}</p>}
          </div>
        )}

        {isProcessing && (
          <div>
            <p className="text-sm font-medium mb-2">正在解析檔案...</p>
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {showPreview && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">預覽匯入資料</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重新選擇檔案
                </Button>
                <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-1" />
                  {isUploading ? "匯入中..." : "確認匯入"}
                </Button>
              </div>
            </div>
            <DataTable
              columns={columns}
              data={parsedData}
            />
          </div>
        )}

        {!showPreview && !isProcessing && (
          <Card>
            <CardHeader>
              <CardTitle>檔案格式說明</CardTitle>
              <CardDescription>請確保您的檔案符合以下格式要求</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">必要欄位</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>name - 姓名 (必填)</li>
                  <li>gender - 性別 (必填，限「男」或「女」)</li>
                  <li>grade - 年級 (必填)</li>
                  <li>class - 班級 (必填)</li>
                  <li>student_type - 學生類型 (必填，限「新生」或「舊生」)</li>
                  <li>is_disadvantaged - 是否為弱勢生 (必填，限「是」或「否」)</li>
                  <li>email - 電子郵件 (必填)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium">選填欄位</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>family_background - 家庭背景描述</li>
                  <li>cultural_disadvantage_factors - 文化不利因素描述</li>
                  <li>personal_background_notes - 個人背景補充說明</li>
                  <li>registration_motivation - 報名動機</li>
                  <li>account_username - 系統帳號</li>
                  <li>account_password - 系統密碼</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium">注意事項</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>性別欄位僅接受「男」或「女」</li>
                  <li>學生類型欄位僅接受「新生」或「舊生」</li>
                  <li>是否為弱勢生欄位僅接受「是」或「否」</li>
                  <li>支援的檔案格式: .xlsx, .xls, .csv</li>
                  <li>請確保第一行為欄位名稱</li>
                  <li>如果學生電子郵件已存在，系統將更新該學生的資料</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
