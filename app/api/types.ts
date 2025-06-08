// Import shared types from lib/types
import type { Student } from '@/lib/types';

// Re-export Student type for use in other files
export type { Student } from '@/lib/types';

// Authentication Types
export interface LoginRequest {
  token: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Role Types
export interface Role {
  id: number;
  name: string;
  display_name: string | null;
  color: string | null;
  order: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  role?: Role; // 完整角色資料
  region?: string | null;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
  last_active?: string | null;
}

export interface UserCreateRequest {
  email: string;
  name?: string | null;
  role: 'admin' | 'teacher' | 'manager' | 'root';
  avatar_url?: string | null;
  region?: string | null;
}

export interface UserUpdateRequest {
  id: string;
  email?: string;
  name?: string | null;
  picture?: string | null;
  role?: string;
  region?: string | null;
}

export interface UsersListResponse {
  total: number;
  page: number;
  limit: number;
  data: User[];
}

// Student-related response types (using Student from lib/types)
export interface StudentsListResponse {
  total: number;
  data: Student[];
}

// Student update request type
export interface StudentUpdateRequest {
  name?: string;
  gender?: string;
  grade?: '1' | '2' | '3' | '4' | '5' | '6';
  class?: string;
  region?: string;
  family_background?: string;
  is_disadvantaged?: '是' | '否';
  cultural_disadvantage_factors?: string;
  personal_background_notes?: string;
  registration_motivation?: string;
  student_type?: '新生' | '舊生';
  account_username?: string;
  account_password?: string;
  email?: string;
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

// Form Permission Types
export interface RolePermission {
  role: Role;
  access_type: 'read' | 'edit' | null;
}

// Grid field types for radio_grid and checkbox_grid
export interface GridOptions {
  rows: Array<{ value: string; label: string }>;
  columns: Array<{ value: string; label: string }>;
}

// Form Types
export interface Form {
  id: string;
  title: string;
  description?: string | null;
  form_type: string;
  status?: string | null;
  is_required?: boolean | null;
  allow_multiple_submissions?: boolean | null;
  submission_deadline?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  fields?: FormField[];
  access_type?: 'read' | 'edit' | null;
  permissions?: RolePermission[];
  submitted?: boolean;
  owner?: {
    id: string;
    name: string | null;
    email: string;
    avatar_url?: string | null;
  };
}

export interface FormField {
  id: string;
  form_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  display_order: number;
  is_required?: boolean | null;
  is_active?: boolean | null;
  placeholder?: string | null;
  help_text?: string | null;
  validation_rules?: any;
  conditional_logic?: any;
  default_value?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  pattern?: string | null;
  student_field_mapping?: string | null;
  auto_populate_from?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  form_field_options?: FormFieldOption[];
  grid_options?: GridOptions; // For radio_grid and checkbox_grid fields
}

export interface FormFieldOption {
  id: string;
  field_id: string;
  option_value: string;
  option_label: string;
  display_order: number;
  is_active?: boolean | null;
  created_at?: string | null;
}

export interface FormResponse {
  id: string;
  form_id: string;
  respondent_id?: string | null;
  respondent_type: string;
  submission_status?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  review_notes?: string | null;
  metadata?: any;
  created_at?: string | null;
  updated_at?: string | null;
  forms?: Partial<Form>;
  field_responses?: FormFieldResponse[];
}

export interface FormFieldResponse {
  id: string;
  response_id: string;
  field_id: string;
  field_value?: string | null;
  field_values?: any;
  created_at?: string | null;
  updated_at?: string | null;
  form_fields?: Partial<FormField>;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string | null;
  template_data: any;
  category?: string | null;
  is_system_template?: boolean | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Form API Request/Response Types
export interface FormCreateRequest {
  title: string;
  description?: string;
  form_type: string;
  status?: string;
  is_required?: boolean;
  allow_multiple_submissions?: boolean;
  submission_deadline?: string;
  fields?: FormFieldCreateRequest[];
}

export interface FormFieldCreateRequest {
  field_name: string;
  field_label: string;
  field_type: string;
  display_order?: number;
  is_required?: boolean;
  is_active?: boolean;
  placeholder?: string;
  help_text?: string;
  validation_rules?: any;
  conditional_logic?: any;
  default_value?: string;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  student_field_mapping?: string;
  auto_populate_from?: string;
  options?: FormFieldOptionCreateRequest[];
  grid_options?: GridOptions;
}

export interface FormFieldOptionCreateRequest {
  option_value: string;
  option_label: string;
  display_order?: number;
  is_active?: boolean;
}

export interface FormUpdateRequest {
  title?: string;
  description?: string;
  form_type?: string;
  status?: string;
  is_required?: boolean;
  allow_multiple_submissions?: boolean;
  submission_deadline?: string;
  fields?: FormFieldCreateRequest[];
}

export interface FormsListResponse {
  success: boolean;
  data: Form[];
  total: number;
  page: number;
  limit: number;
}

export interface FormDetailResponse {
  success: boolean;
  data: Form;
}

export interface FormResponseCreateRequest {
  form_id: string;
  respondent_id?: string;
  respondent_type?: string;
  submission_status?: string;
  field_responses?: FormFieldResponseCreateRequest[];
  metadata?: any;
}

export interface FormFieldResponseCreateRequest {
  field_id: string;
  field_value?: string;
  field_values?: any;
}

export interface FormResponseUpdateRequest {
  submission_status?: string;
  field_responses?: FormFieldResponseCreateRequest[];
  review_notes?: string;
  reviewed_by?: string;
  metadata?: any;
}

export interface FormResponsesListResponse {
  success: boolean;
  data: FormResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface FormResponseDetailResponse {
  success: boolean;
  data: FormResponse;
}

// Error Response
export interface ErrorResponse {
  error: string;
}

// Success Response
export interface SuccessResponse {
  success: boolean;
}

// Regions Response
export interface RegionsResponse extends SuccessResponse {
  data: string[];
}

// Analytics Types
export interface OnlineUser {
  id: string;
  name: string;
  role: string;
  roleDisplayName: string;
  roleOrder: number;
  last_active: string | null;
}

export interface UsersByRole {
  root: number;           // 系統管理員
  admin: number;          // 計畫主持人
  manager: number;        // 帶班老師
  teacher: number;        // 大學伴
  candidate: number;      // 儲備大學伴
  total: number;
}

export interface SessionsAnalyticsResponse {
  online: {
    users: OnlineUser[];
    byRole: UsersByRole;
  };
}

// Main Analytics Types
export interface AnalyticsResponse {
  studentsByGrade: Record<string, number>;
  studentsByType: Record<string, number>;
  disadvantagedCount: number;
  totalStudents: number;
  totalRoot: number;           // 系統管理員
  totalAdmins: number;         // 計畫主持人
  totalManagers: number;       // 帶班老師
  totalTeachers: number;       // 大學伴
  totalCandidates: number;     // 儲備大學伴
  teachersByActivity: Array<{
    name: string;
    studentsCount: number;
    lastActive: string;
  }>;
  teachersStudentCounts: Array<{
    name: string;
    studentCount: number;
  }>;
  studentsOverTime: Array<{
    month: string;
    studentCount: number;
  }>;
}

// API Routes Types
export interface FormResponseData {
  id: string;
  form_id: string;
  respondent_id: string | null;
  respondent_type: string;
  submission_status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  respondent?: {
    id: string;
    name: string;
    email: string;
  };
  field_responses: FormFieldResponseData[];
}

export interface FormFieldResponseData {
  id: string;
  response_id: string;
  field_id: string;
  field_value: string | null;
  field_values: string[] | null;
  field: {
    id: string;
    field_label: string;
    field_type: string;
    form_field_options?: FormFieldOption[];
  };
}

export interface FormResponsesResponse {
  success: boolean;
  data: FormResponseData[];
  total: number;
  page: number;
  limit: number;
}

export interface UserRole {
  id: number;
  name: string;
  display_name: string;
  color: string | null;
  order: number;
}

export interface UserData {
  role: UserRole | null;
}

export interface FormResponseCreateData {
  form_id: string;
  respondent_id?: string;
  respondent_type: string;
  submission_status: string;
  metadata?: Record<string, unknown>;
  submitted_at?: string;
}

export interface FieldResponseCreateData {
  response_id: string;
  field_id: string;
  field_value?: string | null;
  field_values?: string[] | null;
}

// Additional API Routes Types
export interface RolesListResponse {
  success: boolean;
  data: Role[];
}

export interface AccessResponse {
  success: boolean;
  data: {
    hasAccess: boolean;
    accessType: 'read' | 'edit' | null;
  };
}

export interface PermissionsUpdateRequest {
  permissions: {
    role: string;
    access_type: 'read' | 'edit' | null;
  }[];
}

export interface UpdateFormResponseRequest {
  field_responses: FormFieldResponseCreateRequest[];
  submission_status?: 'draft' | 'submitted';
}

export interface FormResponseUpdateResponse {
  success: boolean;
  data: any;
}

export interface UserProfileResponse {
  user: User;
  formResponses?: FormResponse[];
}

export interface FieldOverview {
  field_id: string;
  field_label: string;
  field_type: string;
  display_order: number;
  responses: Array<{
    response_id: string;
    respondent_name: string;
    respondent_email: string;
    field_value: string | null;
    field_values: string[] | null;
    created_at: string;
    submission_status: string;
  }>;
  total_responses: number;
}

export interface FormOverviewResponse {
  success: boolean;
  data: FieldOverview[];
  total_responses: number;
}

export interface UserFormResponsesResponse {
  success: boolean;
  data: any[];
  total: number;
}

// Extended types for specific use cases
export interface ExtendedFormFieldOption extends FormFieldOption {
  option_type?: string;
  row_label?: string;
  column_label?: string;
} 