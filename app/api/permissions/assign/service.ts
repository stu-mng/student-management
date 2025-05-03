import type { Student, User } from "@/lib/types";

/**
 * Response interfaces for API
 */
interface StudentsListResponse {
  total: number;
  data: Student[];
}

interface BulkAssignPermissionRequest {
  teacher_id: string;
  student_ids: string[];
}

interface BulkAssignPermissionResponse {
  success: boolean;
  count: number;
  message?: string;
}

interface TeacherStudentPermission {
  id: string;
  teacher_id: string;
  student_id: string;
  created_at: string;
}

/**
 * Fetch all users with role 'teacher'
 */
export async function fetchTeachers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users?role=teacher');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch teachers');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
}

/**
 * Fetch all students
 */
export async function fetchStudents(): Promise<Student[]> {
  try {
    const response = await fetch('/api/students');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch students');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
}

/**
 * Fetch all student IDs assigned to a specific user
 */
export async function fetchAssignedStudents(userId: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/permissions/assigned/students/${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch assigned students');
    }
    
    // API now returns an array of student IDs directly
    return await response.json();
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    throw error;
  }
}

/**
 * Bulk assign students to a teacher
 * 
 * This function sends the complete list of student IDs that should be assigned to the teacher.
 * Students who are in the current assignment but not in the new list will be unassigned.
 * Students who are in the new list but not currently assigned will be added.
 */
export async function bulkAssignStudentsToTeacher(
  teacherId: string, 
  studentIds: string[]
): Promise<BulkAssignPermissionResponse> {
  try {
    const payload: BulkAssignPermissionRequest = {
      teacher_id: teacherId,
      student_ids: studentIds
    };
    
    const response = await fetch('/api/permissions/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to assign students to teacher');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error assigning students to teacher:', error);
    throw error;
  }
} 