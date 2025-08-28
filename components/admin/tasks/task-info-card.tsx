import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Users } from "lucide-react";
import type { TaskDetail } from "./types";
import { statusColors, statusLabels } from "./types";

interface TaskInfoCardProps {
  task: TaskDetail
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "無截止期限"
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOverdue = (dateString: string | null) => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

export function TaskInfoCard({ task }: TaskInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">任務資訊</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1 - Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">狀態</span>
          <Badge className={cn("shrink-0", statusColors[task.status])}>
            {statusLabels[task.status]}
          </Badge>
        </div>

        {/* Row 2 - Deadline */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">截止期限</span>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-sm",
              isOverdue(task.submission_deadline) && task.status === 'active' 
                ? "text-red-600 font-medium" 
                : "text-muted-foreground"
            )}>
              {formatDate(task.submission_deadline)}
            </p>
            {isOverdue(task.submission_deadline) && task.status === 'active' && (
              <p className="text-xs text-red-600">已逾期</p>
            )}
          </div>
        </div>

        {/* Row 3 - Creator */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">建立者</span>
          </div>
          <p className="text-sm text-muted-foreground text-right">
            {task.creator.name || task.creator.email}
          </p>
        </div>

        {/* Row 4 - Created Time */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">建立時間</span>
          <p className="text-sm text-muted-foreground">
            {formatDate(task.created_at)}
          </p>
        </div>
        
        {isOverdue(task.submission_deadline) && task.status === 'active' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <p className="text-sm font-medium text-red-800">任務已逾期</p>
            </div>
            <p className="text-xs text-red-600 mt-1">
              建議聯繫未完成的執行人員
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
