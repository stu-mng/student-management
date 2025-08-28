"use client"

import { LoadingSkeleton } from "@/components/admin/tasks/loading-skeleton"
import { PageHeader } from "@/components/admin/tasks/page-header"
import { TaskTabs } from "@/components/admin/tasks/task-tabs"
import type { Task, TaskStats } from "@/components/admin/tasks/types"
import { useAuth } from "@/components/auth-provider"
import { apiClientSilent } from "@/lib/api-utils"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function TaskManagementPage() {
  useAuth() // Ensures authentication
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("overview")

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      const response = await apiClientSilent.get<{ tasks: Task[]; stats: TaskStats }>('/api/tasks')
      const data = response.data
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      toast.error('獲取任務列表失敗')
    } finally {
      setLoading(false)
    }
  }

  // Delete task function
  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClientSilent.delete(`/api/tasks/${taskId}`)
      
      // Remove task from local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
      
      toast.success('任務刪除成功')
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
      
      throw error // Re-throw to let the component handle loading state
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <PageHeader />
      <TaskTabs 
        tasks={tasks}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  )
}
