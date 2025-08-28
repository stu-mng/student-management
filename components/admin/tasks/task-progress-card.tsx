import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users } from "lucide-react"
import type { AssignedUser, TaskResponse } from "./types"

interface TaskProgressCardProps {
  assignedUsers: AssignedUser[]
  responses: TaskResponse[]
}

export function TaskProgressCard({ assignedUsers, responses }: TaskProgressCardProps) {
  const getProgressStats = () => {
    const total = assignedUsers.length
    const completed = responses.filter(r => r.submission_status === 'submitted').length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return { total, completed, percentage }
  }

  const { total, completed, percentage } = getProgressStats()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>進度統計</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>完成進度</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completed} 已完成</span>
            <span>{total - completed} 未完成</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{total}</div>
            <div className="text-xs text-muted-foreground">總分配人數</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <div className="text-xs text-muted-foreground">已完成</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{total - completed}</div>
            <div className="text-xs text-muted-foreground">待完成</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
