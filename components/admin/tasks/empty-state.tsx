import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Plus } from "lucide-react"
import Link from "next/link"

export function EmptyState() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">還沒有任務</h3>
        <p className="text-muted-foreground mb-4">
          開始建立第一個任務來管理教學進度
        </p>
        <Link href="/dashboard/admin/tasks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新增任務
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

