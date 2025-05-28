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

// Student Types
export interface Student {
  id: string;
  student_id: string | null;
  name: string;
  grade?: string | null;
  class?: string | null;
  is_disadvantaged?: boolean;
  student_type?: string | null;
  region?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any; // For additional properties
}

export interface StudentUpdateRequest {
  student_id?: string | null;
  name?: string;
  grade?: string | null;
  class?: string | null;
  is_disadvantaged?: boolean;
  student_type?: string | null;
  region?: string | null;
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

// Form Permission Types
export interface RolePermission {
  role: Role;
  access_type: 'read' | 'edit' | null;
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