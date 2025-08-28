import type { BulkAssignPermissionRequest, BulkAssignPermissionResponse, Student, User } from "@/app/api/types";
import { apiClientSilent } from '@/lib/api-utils';

/**
 * Fetch all users with role 'teacher'
 */
export async function fetchTeachers(): Promise<User[]> {
  try {
    const response = await apiClientSilent.get<{ data: User[] }>('/api/users?role=teacher');
    return response.data.data;
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
    const response = await apiClientSilent.get<{ data: Student[] }>('/api/students');
    return response.data.data;
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
    const response = await apiClientSilent.get<string[]>(`/api/students/assigned/${userId}`);
    
    // API now returns an array of student IDs directly
    return response.data;
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
    
    const response = await apiClientSilent.post<BulkAssignPermissionResponse>('/api/students/assign', payload);
    
    return response.data;
  } catch (error) {
    console.error('Error assigning students to teacher:', error);
    throw error;
  }
}
