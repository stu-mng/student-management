import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-utils"
import { Bell, Download, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

interface TaskQuickActionsProps {
  task: any
  taskId: string
  notificationLoading: boolean
  onSendNotification: (includeUnsubmittedOnly: boolean) => void
}

export function TaskQuickActions({ 
  task, 
  taskId, 
  notificationLoading, 
  onSendNotification 
}: TaskQuickActionsProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await apiClient.get(`/api/tasks/${taskId}/export`, {
        responseType: 'blob'
      })
      console.log(response)
      
      // 創建 blob 並下載
      const blob = new Blob([response.data as BlobPart], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${task.title || '任務'}_任務結果_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('匯出成功')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('匯出失敗，請稍後再試')
    } finally {
      setExporting(false)
    }
  }

  if (task.status !== 'active') {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>快速操作</CardTitle>
      </CardHeader>
      <CardContent className="px-6 space-y-2">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? '匯出中...' : '匯出結果'}
        </Button>

        <div>
          <Link href={`/dashboard/admin/tasks/${taskId}/assign`}>
            <Button variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              管理分配
            </Button>
          </Link>
        </div> 

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => onSendNotification(false)}
          disabled={notificationLoading}
        >
          <Bell className="h-4 w-4 mr-2" />
          {notificationLoading ? '發送中...' : '通知所有人'}
        </Button>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => onSendNotification(true)}
          disabled={notificationLoading}
        >
          <Bell className="h-4 w-4 mr-2" />
          {notificationLoading ? '發送中...' : '通知未提交者'}
        </Button>
      </CardContent>
    </Card>
  )
}
