"use client"

import {
  AllSubmissionsPreview,
  SubmissionPreview,
  TaskDetailHeader,
  TaskDetailSkeleton,
  TaskInfoCard,
  TaskProgressCard,
  TaskQuickActions,
  TaskTabsContent
} from "@/components/admin/tasks"
import type { AssignedUser, TaskDetail, TaskResponse } from "@/components/admin/tasks/types"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, apiClientSilent } from "@/lib/api-utils"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

export default function TaskDetailPage() {
  const params = useParams()  
  const taskId = params.id as string

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [responses, setResponses] = useState<TaskResponse[]>([])
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [previewResponse, setPreviewResponse] = useState<TaskResponse | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showAllSubmissions, setShowAllSubmissions] = useState(false)

  const fetchTaskDetail = useCallback(async () => {
    try {
      const [taskResponse, responsesResponse, assignmentsResponse] = await Promise.all([
        apiClientSilent.get<{ task: TaskDetail }>(`/api/tasks/${taskId}`),
        apiClientSilent.get<{ responses: TaskResponse[] }>(`/api/tasks/${taskId}/responses`),
        apiClientSilent.get<{ assignments: AssignedUser[] }>(`/api/tasks/${taskId}/assignments`)
      ])

      const taskData = taskResponse.data
      setTask(taskData.task)

      const responsesData = responsesResponse.data
      setResponses(responsesData.responses || [])

      const assignmentsData = assignmentsResponse.data
      setAssignedUsers(assignmentsData.assignments || [])
    } catch (error) {
      console.error('Failed to fetch task details:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    if (taskId) {
      fetchTaskDetail()
    }
  }, [taskId, fetchTaskDetail])

  const updateTaskStatus = async (newStatus: string) => {
    setActionLoading(true)
    try {
      await apiClient.patch(`/api/tasks/${taskId}`, { status: newStatus })
      await fetchTaskDetail()
    } catch (error) {
      console.error('Error updating task status:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const sendTaskNotification = async (includeUnsubmittedOnly: boolean = false) => {
    setNotificationLoading(true)
    try {
      await apiClient.post(`/api/tasks/${taskId}/notify`, {
        include_unsubmitted_only: includeUnsubmittedOnly
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    } finally {
      setNotificationLoading(false)
    }
  }

  const handlePreviewSubmission = (response: TaskResponse) => {
    setPreviewResponse(response)
    setShowPreview(true)
  }

  const handleViewAllSubmissions = () => {
    setShowAllSubmissions(true)
  }

  const closePreview = () => {
    setShowPreview(false)
    setPreviewResponse(null)
  }

  const closeAllSubmissions = () => {
    setShowAllSubmissions(false)
  }

  // Delete task function
  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient.delete(`/api/tasks/${taskId}`)
      
      // Redirect to tasks list after successful deletion
      window.location.href = '/dashboard/admin/tasks'
    } catch (error: unknown) {
      console.error('Failed to delete task:', error)
      
      // Handle specific error messages
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } }
        if (apiError.response?.data?.error) {
          toast.error(apiError.response.data.error)
        } else {
          toast.error('刪除任務失敗')
        }
      } else {
        toast.error('刪除任務失敗')
      }
      
      throw error
    }
  }

  if (loading) {
    return <TaskDetailSkeleton />
  }

  if (!task) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">任務不存在</h1>
        <Link href="/dashboard/admin/tasks">
          <Button>返回任務列表</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <TaskDetailHeader 
        task={task}
        taskId={taskId}
        actionLoading={actionLoading}
        onUpdateStatus={updateTaskStatus}
        onDelete={handleDeleteTask}
      />

      {/* Title Section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
        {task.description && (
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {task.description}
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tabs and Progress */}
        <div className="lg:col-span-2 space-y-6">
          <TaskProgressCard assignedUsers={assignedUsers} responses={responses} />
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">總覽</TabsTrigger>
              <TabsTrigger value="responses">提交記錄</TabsTrigger>
              <TabsTrigger value="requirements">任務要求</TabsTrigger>
              <TabsTrigger value="assignments">分配用戶</TabsTrigger>
            </TabsList>

            <TaskTabsContent 
              task={task}
              responses={responses}
              assignedUsers={assignedUsers}
              onPreviewSubmission={handlePreviewSubmission}
              onViewAllSubmissions={handleViewAllSubmissions}
            />
          </Tabs>
        </div>

        {/* Right Column - Task Info and Quick Actions */}
        <div className="space-y-6">
          <TaskInfoCard task={task} />
          <TaskQuickActions 
            task={task}
            taskId={taskId}
            notificationLoading={notificationLoading}
            onSendNotification={sendTaskNotification}
          />
        </div>
      </div>

      {/* Submission Preview Modal */}
      {showPreview && previewResponse && (
        <SubmissionPreview
          response={previewResponse}
          onClose={closePreview}
        />
      )}

      {/* All Submissions Preview Modal */}
      {showAllSubmissions && responses.length > 0 && (
        <AllSubmissionsPreview
          responses={responses}
          onClose={closeAllSubmissions}
        />
      )}
    </div>
  )
}
