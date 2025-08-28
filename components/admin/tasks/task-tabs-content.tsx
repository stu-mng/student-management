import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { CheckCircle, FileText, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { AssignedUser, TaskDetail, TaskResponse } from "./types"
import { responseStatusColors, responseStatusLabels } from "./types"

interface TaskTabsContentProps {
  task: TaskDetail
  responses: TaskResponse[]
  assignedUsers: AssignedUser[]
  onPreviewSubmission: (response: TaskResponse) => void
  onViewAllSubmissions?: (initialIndex?: number) => void
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "未提交"
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function TaskTabsContent({ 
  task, 
  responses, 
  assignedUsers, 
  onPreviewSubmission: _onPreviewSubmission,
  onViewAllSubmissions
}: TaskTabsContentProps) {
  return (
    <>
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4">
          {responses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">還沒有提交記錄</h3>
                <p className="text-muted-foreground">
                  任務分配後，提交記錄會顯示在這裡
                </p>
              </CardContent>
            </Card>
          ) : (
            responses
              .filter(response => response.submission_status === 'submitted')
              .map((response) => (
                <div key={response.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{response.user.name || response.user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(response.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(responseStatusColors[response.submission_status])}>
                    {responseStatusLabels[response.submission_status]}
                  </Badge>
                </div>
              ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="responses" className="space-y-4">
        {/* View All Submissions Button */}
        {responses.length > 0 && onViewAllSubmissions && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => onViewAllSubmissions(0)}
            >
              <Users className="h-4 w-4 mr-2" />
              查看所有提交
            </Button>
          </div>
        )}
        
        {responses.map((response, index) => (
          <Card key={response.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {response.user.name || response.user.email}
                  </CardTitle>
                  <CardDescription>
                    {response.user.role.display_name}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <Badge className={cn(responseStatusColors[response.submission_status])}>
                      {responseStatusLabels[response.submission_status]}
                    </Badge>
                    {response.submitted_at && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(response.submitted_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {response.responses.map((resp) => (
                  <div key={resp.requirement_id} className="border-l-2 border-gray-200 pl-4">
                    <p className="font-medium text-sm">{resp.requirement_name}</p>
                    {resp.file_url ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <a 
                          href={resp.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          查看檔案
                        </a>
                      </div>
                    ) : resp.value ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        {resp.value}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        未填寫
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {responses.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">還沒有提交記錄</h3>
              <p className="text-muted-foreground">
                任務分配後，提交記錄會顯示在這裡
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="requirements" className="space-y-4">
        {task.requirements.map((req, _index) => (
          <Card key={req.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {_index + 1}. {req.name}
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge variant="outline">
                    {req.type === 'file' ? '檔案上傳' : 
                     req.type === 'textarea' ? '多行文字' : '單行文字'}
                  </Badge>
                  {req.required && (
                    <Badge variant="destructive">必填</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            {req.description && (
              <CardContent>
                <p className="text-muted-foreground">{req.description}</p>
              </CardContent>
            )}
            {req.help_image_url && (
              <CardContent className="pt-0">
                <div className="relative min-w-48 h-48 rounded-lg border shadow-sm bg-muted/10 overflow-hidden">
                  <Image
                    src={req.help_image_url}
                    alt={`${req.name} 提示圖片`}
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        
        {task.requirements.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">沒有任務要求</h3>
              <p className="text-muted-foreground">
                此任務沒有設定具體要求
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="assignments" className="space-y-4">
        {assignedUsers.map((assignment) => (
          <Card key={assignment.user_id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {assignment.user?.name || assignment.user?.email || '未知用戶'}
              </CardTitle>
              <CardDescription>
                {assignment.user?.role.display_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  用戶ID: {assignment.user_id}
                </div>
                <Link href={`/dashboard/profile/${assignment.user_id}`}>
                  <Button variant="outline" size="sm">
                    查看檔案
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {assignedUsers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">還沒有分配用戶</h3>
              <p className="text-muted-foreground">
                點擊上方的「管理分配」來分配任務給用戶
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </>
  )
}
