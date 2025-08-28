"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClientSilent } from "@/lib/api-utils"
import { cn } from "@/lib/utils"
import { AlertTriangle, Calendar, CheckCircle, FileText } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface MyTask {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'active' | 'inactive' | 'archived'
  submission_deadline: string | null
  created_at: string
  creator: {
    name: string | null
    email: string
  }
  requirements: {
    id: string
    name: string
    type: 'file' | 'text' | 'textarea'
    required: boolean
    description?: string
    upload_folder_id?: string | null
  }[]
  my_response?: {
    id: string
    submission_status: 'draft' | 'submitted' | 'reviewed' | 'approved'
    submitted_at: string | null
    responses: Record<string, string | null>
  }
}

interface TaskStats {
  total: number
  completed: number
  pending: number
  overdue: number
}

const statusColors = {
  none: "bg-gray-100 text-gray-600",
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-800",
  reviewed: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800"
}

const statusLabels = {
  none: "未提交",
  draft: "草稿",
  submitted: "已提交",
  reviewed: "已審核",
  approved: "已核准"
}

// Reusable EmptyState component
function EmptyState({ 
  title, 
  description, 
  icon: Icon 
}: { 
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return <Card>
    <CardContent className="p-8 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
}

// Reusable TaskCard component
function TaskCard({ 
  task, 
  variant = "default",
  showCreator = false,
  showStatus = true
}: { 
  task: MyTask
  variant?: "default" | "pending" | "completed" | "overdue"
  showCreator?: boolean
  showStatus?: boolean
}) {
  const isTaskOverdue = task.submission_deadline && new Date(task.submission_deadline) < new Date()
  const responseStatus = task.my_response?.submission_status || 'none'
  
  const getCardStyles = () => {
    switch (variant) {
      case "overdue":
        return "border-red-200 hover:shadow-md transition-shadow cursor-pointer"
      case "completed":
        return "opacity-75"
      case "pending":
        return "hover:shadow-md transition-shadow cursor-pointer"
      default:
        return "hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
    }
  }
  
  const getTitleStyles = () => {
    if (variant === "overdue") return "text-red-700"
    return ""
  }
  
  const getStatusBadge = () => {
    if (!showStatus) return null
    
    switch (variant) {
      case "overdue":
        return <Badge variant="destructive">逾期</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>
      default:
        return (
          <Badge className={cn("shrink-0", statusColors[responseStatus])}>
            {statusLabels[responseStatus]}
          </Badge>
        )
    }
  }
  
  const getContentIcon = () => {
    switch (variant) {
      case "completed":
        return <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
      case "overdue":
        return <AlertTriangle className="h-4 w-4 mr-1" />
      default:
        return <Calendar className="h-4 w-4 mr-2" />
    }
  }
  
  const getContentText = () => {
    switch (variant) {
      case "completed":
        return `已於 ${formatDate(task.my_response?.submitted_at || null)} 提交`
      case "overdue":
        return `逾期於 ${formatDate(task.submission_deadline)}`
      default:
        return formatDate(task.submission_deadline)
    }
  }
  
  const getContentStyles = () => {
    if (variant === "overdue") return "text-red-600"
    if (isTaskOverdue && task.status === 'active' && variant === "default") return "text-red-600 font-medium"
    return "text-muted-foreground"
  }

  return (
    <div key={task.id}>
      <Link href={`/dashboard/tasks/${task.id}`}>
        <Card className={getCardStyles()}>
          <CardHeader className={variant === "default" ? "pb-4" : ""}>
            <div className="flex items-start justify-between">
              <div className={cn("space-y-2", variant === "default" ? "flex-1 pr-4" : "")}>
                <CardTitle className={cn("text-lg", variant === "default" ? "font-semibold leading-tight" : "", getTitleStyles())}>
                  {task.title}
                </CardTitle>
                {task.description && (
                  <CardDescription className={variant === "default" ? "text-sm line-clamp-2" : ""}>
                    {task.description}
                  </CardDescription>
                )}
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className={variant === "default" ? "pt-0" : ""}>
            <div className={cn(
              "flex items-center",
              variant === "default" ? "justify-between text-sm" : "space-y-3"
            )}>
              <div className={cn("flex items-center text-sm", getContentStyles())}>
                {getContentIcon()}
                <span className={getContentStyles()}>
                  {getContentText()}
                  {isTaskOverdue && task.status === 'active' && variant === "default" && (
                    <span className="ml-1 text-red-600">（已逾期）</span>
                  )}
                </span>
              </div>
              {showCreator && variant === "default" && (
                <div className="text-muted-foreground text-xs">
                  由 {task.creator.name || task.creator.email} 指派
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

// Utility functions
const formatDate = (dateString: string | null) => {
  if (!dateString) return "無截止期限"
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOverdue = (dateString: string | null) => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch my assigned tasks
  const fetchMyTasks = async () => {
    try {
      const response = await apiClientSilent.get<{ tasks: MyTask[]; stats: TaskStats }>('/api/tasks/my')
      const data = response.data
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Failed to fetch my tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyTasks()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex space-x-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded px-4 animate-pulse w-24"></div>
            ))}
          </div>
          
          {/* Task Cards Skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的任務</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            查看並完成分配給我的教學任務
          </p>
        </div>
      </div>

      {/* Tasks List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">全部 {tasks.length}</TabsTrigger>
          <TabsTrigger value="pending">待處理 {tasks.filter(task => !task.my_response || task.my_response.submission_status === 'draft').length}</TabsTrigger>
          <TabsTrigger value="completed">已完成 {tasks.filter(task => task.my_response?.submission_status === 'submitted').length}</TabsTrigger>
          <TabsTrigger value="overdue">逾期 {tasks.filter(task => isOverdue(task.submission_deadline) && task.status === 'active' && (!task.my_response || task.my_response.submission_status !== 'submitted')).length}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tasks.length === 0 ? (
            <EmptyState
              title="沒有分配的任務"
              description="目前沒有分配給您的任務"
              icon={FileText}
            />
          ) : (
            tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                variant="default"
                showCreator={true}
                showStatus={true}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {tasks.filter(task => !task.my_response || task.my_response.submission_status === 'draft').map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                variant="pending"
                showCreator={false}
                showStatus={false}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {tasks.filter(task => task.my_response?.submission_status === 'submitted').map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                variant="completed"
                showCreator={false}
                showStatus={true}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overdue">
          <div className="space-y-4">
            {tasks.filter(task => 
              isOverdue(task.submission_deadline) && 
              task.status === 'active' &&
              (!task.my_response || task.my_response.submission_status !== 'submitted')
            ).map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                variant="overdue"
                showCreator={false}
                showStatus={true}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
