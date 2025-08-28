import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "./empty-state"
import { TaskCard } from "./task-card"
import type { Task } from "./types"

interface TaskTabsProps {
  tasks: Task[]
  selectedTab: string
  onTabChange: (value: string) => void
  onDeleteTask?: (taskId: string) => Promise<void>
}

export function TaskTabs({ 
  tasks, 
  selectedTab, 
  onTabChange, 
  onDeleteTask
}: TaskTabsProps) {
  const activeTasks = tasks.filter(task => task.status === 'active')
  const completedTasks = tasks.filter(task => task.status === 'archived')
  const draftTasks = tasks.filter(task => task.status === 'draft')

  return (
    <Tabs value={selectedTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="overview">總覽 {tasks.length}</TabsTrigger>
        <TabsTrigger value="active">進行中 {activeTasks.length}</TabsTrigger>
        <TabsTrigger value="completed">已完成 {completedTasks.length}</TabsTrigger>
        <TabsTrigger value="draft">草稿 {draftTasks.length}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4">
          {tasks.length === 0 ? (
            <EmptyState />
          ) : (
            tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                variant="default"
                onDelete={onDeleteTask}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="active">
        <div className="grid gap-4">
          {activeTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              variant="active"
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="completed">
        <div className="grid gap-4">
          {completedTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              variant="completed"
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="draft">
        <div className="grid gap-4">
          {draftTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              variant="draft"
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}

