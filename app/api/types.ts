// Authentication Types
export interface LoginRequest {
  token: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'teacher' | 'root';
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  email: string;
  name?: string | null;
  role: 'admin' | 'teacher' | 'root';
  avatar_url?: string | null;
}

export interface UserUpdateRequest {
  id: string;
  email?: string;
  name?: string | null;
  picture?: string | null;
}

export interface UsersListResponse {
  total: number;
  page: number;
  limit: number;
  data: User[];
}

// Student Types
export interface Student {
  id: string;
  student_id: string | null;
  name: string;
  grade?: string | null;
  class?: string | null;
  is_disadvantaged?: boolean;
  student_type?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any; // For additional properties
}

export interface StudentCreateRequest {
  student_id?: string | null;
  name: string;
  grade?: string | null;
  class?: string | null;
  is_disadvantaged?: boolean;
  student_type?: string | null;
  [key: string]: any; // For additional properties
}

export interface StudentUpdateRequest {
  student_id?: string | null;
  name?: string;
  grade?: string | null;
  class?: string | null;
  is_disadvantaged?: boolean;
  student_type?: string | null;
  [key: string]: any; // For additional properties
}

export interface StudentsListResponse {
  total: number;
  data: Student[];
}

// Permission Types
export interface TeacherStudentPermission {
  id: string;
  teacher_id: string;
  student_id: string;
  created_at: string;
  teacher?: User;
  student?: Student;
}

export interface TeacherStudentPermissionCreateRequest {
  teacher_id: string;
  student_id: string;
}

export interface BulkAssignPermissionRequest {
  teacher_id: string;
  student_ids: string[];
}

export interface BulkAssignPermissionResponse {
  success: boolean;
  count: number;
  message?: string;
}

// Error Response
export interface ErrorResponse {
  error: string;
}

// Success Response
export interface SuccessResponse {
  success: boolean;
} 