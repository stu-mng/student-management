export interface Task {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'active' | 'inactive' | 'archived'
  submission_deadline: string | null
  created_at: string
  created_by: string
  responses_count?: number
  total_assigned?: number
}

export interface TaskDetail {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'active' | 'inactive' | 'archived'
  submission_deadline: string | null
  created_at: string
  created_by: string
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
    help_image_url?: string
  }[]
}

export interface TaskResponse {
  id: string
  user: {
    id: string
    name: string | null
    email: string
    role: {
      display_name: string
    }
  }
  submission_status: 'draft' | 'submitted' | 'reviewed' | 'approved'
  submitted_at: string | null
  responses: {
    requirement_id: string
    requirement_name: string
    value: string | null
    file_url?: string
  }[]
}

export interface AssignedUser {
  user_id: string
  user: {
    name: string | null
    email: string
    role: {
      display_name: string
    }
  } | null
}

export interface TaskStats {
  total: number
  active: number
  completed: number
  overdue: number
}

export const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800", 
  inactive: "bg-yellow-100 text-yellow-800",
  archived: "bg-gray-100 text-gray-600"
} as const

export const statusLabels = {
  draft: "草稿",
  active: "進行中", 
  inactive: "關閉",
  archived: "已封存"
} as const

export const responseStatusColors = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-800",
  reviewed: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800"
} as const

export const responseStatusLabels = {
  draft: "草稿",
  submitted: "已提交",
  reviewed: "已審核",
  approved: "已核准"
} as const

