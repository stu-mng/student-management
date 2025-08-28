import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">任務管理</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          管理教學任務的建立、分配和進度追蹤
        </p>
      </div>
      <Link href="/dashboard/admin/tasks/new">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新增任務
        </Button>
      </Link>
    </div>
  )
}

