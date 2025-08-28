import { createClient as createServerSupabase } from '../../database/supabase/server';
import { hasEqualOrHigherPermission, hasUserManagePermission, isManager } from '../utils';
import { isPrivileged } from './checks';
import { ADMINS } from './configs';
import type { PermissionCheckArgs } from './types';
import { getPathParam } from './utils';

async function getSupabase() {
  return await createServerSupabase();
}

/**
 * Complex permission check for viewing user details
 * Allows: 1. Users with user manage permissions 2. Self-access
 */
export async function checkUserViewAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;

  const targetUserId = getPathParam('/api/users/[id]', path, 'id');
  if (!targetUserId) return false;

  // Self-access allowed
  if (targetUserId === userId) return true;

  // Check if user has manage permissions
  return hasUserManagePermission(userRole);
}

/**
 * Complex permission check for viewing user profile
 * Allows: 1. Admins (root, admin, manager, class-teacher) to view all profiles 2. Self-access
 */
export async function checkUserProfileAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;

  const targetUserId = getPathParam('/api/users/[id]/profile', path, 'id');
  if (!targetUserId) return false;

  // Self-access allowed
  if (targetUserId === userId) return true;

  // Admins can view all profiles
  if (ADMINS.includes(userRole.name)) {
    return true;
  }

  return false;
}

/**
 * Complex permission check for updating user details
 * Allows: 1. Users with equal or higher permissions than target 2. Self-access for basic fields
 */
export async function checkUserUpdateAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;

  const targetUserId = getPathParam('/api/users/[id]', path, 'id');
  if (!targetUserId) return false;

  // Self-access for basic updates
  if (targetUserId === userId) return true;

  const supabase = await getSupabase();
  
  // Get target user's role to check permission hierarchy
  const { data: targetUser, error: targetUserError } = await supabase
    .from('users')
    .select('role:roles(id, name, order)')
    .eq('id', targetUserId)
    .single();

  if (targetUserError || !targetUser) return false;

  const targetUserRole = Array.isArray(targetUser.role) ? targetUser.role[0] : targetUser.role;
  
  // Check if current user has equal or higher permission than target user
  return hasEqualOrHigherPermission(userRole, targetUserRole);
}

/**
 * Complex permission check for forms list access
 * Checks: 1. Creator access 2. Admin/root permissions 3. user_form_access table
 */
export async function checkFormsListAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId } = args;
  if (!userRole) return false;

  const supabase = await getSupabase();

  // Get all forms that user has access to via user_form_access table
  const { data: userRoleData, error: userRoleError } = await supabase
    .from('users')
    .select('role:roles(id, name)')
    .eq('id', userId)
    .single();

  if (userRoleError || !userRoleData) return false;

  const roleData = Array.isArray(userRoleData.role) ? userRoleData.role[0] : userRoleData.role;
  
  // Admin and root have full access
  if (['admin', 'root'].includes(roleData.name)) return true;

  // Check if user has any form access permissions
  const { data: accessData, error: accessError } = await supabase
    .from('user_form_access')
    .select('form_id')
    .eq('role_id', roleData.id)
    .limit(1);

  if (accessError) return false;

  // If user has any form access or is a form creator, allow access to forms list
  const { data: formsData, error: formsError } = await supabase
    .from('forms')
    .select('id')
    .eq('created_by', userId)
    .limit(1);

  return !formsError && (accessData.length > 0 || formsData.length > 0);
}

/**
 * Complex permission check for form responses overview
 * Checks: 1. Form creator 2. Admin/root/class-teacher 3. Edit permissions via user_form_access
 */
export async function checkFormResponsesOverviewAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;

  const formId = getPathParam('/api/forms/[id]/responses/overview', path, 'id');
  if (!formId) return false;

  const supabase = await getSupabase();

  // Check if form exists and get creator
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, created_by')
    .eq('id', formId)
    .single();

  if (formError || !form) return false;

  // Creator has access
  if (form.created_by === userId) return true;

  // Basic role check for admin, root, class-teacher
  if (['admin', 'root', 'class-teacher'].includes(userRole.name)) return true;

  // Check user_form_access for edit permissions
  const { data: userRoleData, error: userRoleError } = await supabase
    .from('users')
    .select('role:roles(id)')
    .eq('id', userId)
    .single();

  if (userRoleError || !userRoleData) return false;

  const roleData = Array.isArray(userRoleData.role) ? userRoleData.role[0] : userRoleData.role;

  const { data: accessData, error: accessError } = await supabase
    .from('user_form_access')
    .select('access_type')
    .eq('form_id', formId)
    .eq('role_id', roleData.id)
    .single();

  if (accessError || !accessData) return false;

  return accessData.access_type === 'edit';
}

/**
 * Complex permission check for viewing task details
 * Checks: 1. Task creator 2. Assigned users 3. Admin permissions 4. Form access permissions
 */
export async function checkTaskViewAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;
  if (isPrivileged(userRole, ADMINS)) return true;

  const taskId = getPathParam('/api/tasks/[id]', path, 'id');
  if (!taskId) return false;

  const supabase = await getSupabase();

  // Check if task exists and get creator
  const { data: task, error: taskError } = await supabase
    .from('forms') // Tasks are stored in forms table
    .select('id, created_by')
    .eq('id', taskId)
    .single();

  if (taskError || !task) return false;

  // Creator has access
  if (task.created_by === userId) return true;

  // Check if user is assigned to this task
  const { data: assignment, error: assignmentError } = await supabase
    .from('user_form_access')
    .select('id')
    .eq('form_id', taskId)
    .eq('user_id', userId)
    .single();

  if (assignment && !assignmentError) return true;

  // Check user_form_access for read permissions
  const { data: userRoleData, error: userRoleError } = await supabase
    .from('users')
    .select('role:roles(id)')
    .eq('id', userId)
    .single();

  if (userRoleError || !userRoleData) return false;

  const roleData = Array.isArray(userRoleData.role) ? userRoleData.role[0] : userRoleData.role;

  const { data: accessData, error: accessError } = await supabase
    .from('user_form_access')
    .select('access_type')
    .eq('form_id', taskId)
    .eq('role_id', roleData.id)
    .single();

  if (accessError || !accessData) return false;

  return ['read', 'edit'].includes(accessData.access_type);
}

/**
 * Complex permission check for task responses access
 * Checks: 1. Task creator 2. Admin/root permissions 3. user_form_access table
 * This is similar to checkFormResponsesOverviewAccess but for tasks
 */
export async function checkTaskResponsesAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;

  const taskId = getPathParam('/api/tasks/[id]/responses', path, 'id');
  if (!taskId) return false;

  const supabase = await getSupabase();

  // Check if task exists and get creator
  const { data: task, error: taskError } = await supabase
    .from('forms') // Tasks are stored in forms table
    .select('id, created_by')
    .eq('id', taskId)
    .single();

  if (taskError || !task) return false;

  // Creator has access
  if (task.created_by === userId) return true;

  // Basic role check for admin, root, class-teacher
  if (ADMINS.includes(userRole.name)) return true;

  // Check user_form_access for edit permissions
  const { data: userRoleData, error: userRoleError } = await supabase
    .from('users')
    .select('role:roles(id)')
    .eq('id', userId)
    .single();

  if (userRoleError || !userRoleData) return false;

  const roleData = Array.isArray(userRoleData.role) ? userRoleData.role[0] : userRoleData.role;

  const { data: accessData, error: accessError } = await supabase
    .from('user_form_access')
    .select('access_type')
    .eq('form_id', taskId)
    .eq('role_id', roleData.id)
    .single();

  if (accessError || !accessData) return false;

  return accessData.access_type === 'edit';
}

/**
 * Complex permission check for user form responses access
 * Checks: 1. Self-access 2. Form creator 3. Admin/root permissions
 */
export async function checkUserFormResponsesAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;

  const formId = getPathParam('/api/forms/[id]/responses/users/[userId]', path, 'id');
  const targetUserId = getPathParam('/api/forms/[id]/responses/users/[userId]', path, 'userId');
  
  if (!formId || !targetUserId) return false;

  // Self-access allowed
  if (targetUserId === userId) return true;

  const supabase = await getSupabase();

  // Check if form exists and get creator
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, created_by')
    .eq('id', formId)
    .single();

  if (formError || !form) return false;

  // Form creator has access
  if (form.created_by === userId) return true;

  // Admin and root have access
  return ['admin', 'root'].includes(userRole.name);
}

/**
 * Complex permission check for students list access
 * Checks: 1. User manage permissions 2. Manager regional access 3. Teacher-student access
 */
export async function checkStudentsListAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId } = args;
  if (!userRole) return false;

  // Admin-level users have full access
  if (hasUserManagePermission(userRole)) return true;

  const supabase = await getSupabase();

  // Check if user is a manager with regional access
  if (isManager(userRole)) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('region')
      .eq('id', userId)
      .single();

    if (userError || !userData) return false;
    
    // Manager needs to have a region assigned
    return !!userData.region;
  }

  // Check teacher-student access
  if (['teacher', 'candidate'].includes(userRole.name)) {
    const { data: accessData, error: accessError } = await supabase
      .from('teacher_student_access')
      .select('student_id')
      .eq('teacher_id', userId)
      .limit(1);

    if (accessError) return false;
    
    // Teacher has access if they have any assigned students
    return accessData.length > 0;
  }

  return false;
}

/**
 * Complex permission check for students creation
 * Checks: 1. User manage permissions 2. Manager regional constraints
 */
export async function checkStudentsCreateAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId } = args;
  if (!userRole) return false;

  // Only users with manage permissions can create students
  if (!hasUserManagePermission(userRole)) return false;

  const supabase = await getSupabase();

  // If user is a manager, check regional constraints
  if (isManager(userRole)) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('region')
      .eq('id', userId)
      .single();

    if (userError || !userData) return false;
    
    // Manager needs to have a region assigned to create students
    return !!userData.region;
  }

  return true;
}

/**
 * Complex permission check for individual student access
 * Checks: 1. User manage permissions 2. Manager regional access 3. Teacher-student relationship
 */
export async function checkStudentAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;

  const studentId = getPathParam('/api/students/[id]', path, 'id');
  if (!studentId) return false;

  const supabase = await getSupabase();

  // Admin-level users have full access
  if (hasUserManagePermission(userRole)) {
    // For managers, check regional constraints
    if (isManager(userRole)) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('region')
        .eq('id', userId)
        .single();

      if (userError || !userData) return false;

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('region')
        .eq('id', studentId)
        .single();

      if (studentError || !student) return false;

      // Manager can only access students in their region
      return userData.region === student.region;
    }
    
    return true;
  }

  // Check teacher-student access
  if (['teacher', 'candidate'].includes(userRole.name)) {
    const { data: accessData, error: accessError } = await supabase
      .from('teacher_student_access')
      .select('student_id')
      .eq('teacher_id', userId)
      .eq('student_id', studentId)
      .single();

    if (accessError && accessError.code !== 'PGRST116') return false;
    
    return !!accessData;
  }

  return false;
}

/**
 * Complex permission check for assigned students access
 * Checks: 1. Admin permissions 2. Self-access for teachers
 */
export async function checkAssignedStudentsAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;

  const targetUserId = getPathParam('/api/students/assigned/[id]', path, 'id');
  if (!targetUserId) return false;

  // Admin-level roles have full access
  if (ADMINS.includes(userRole.name)) return true;

  // Self-access for teachers to see their assigned students
  return targetUserId === userId;
}

/**
 * Complex permission check for task assignments access
 * Checks: 1. Task creator 2. Admin/root permissions 3. user_form_access table
 * This is similar to checkFormAccess but for tasks
 */
export async function checkTaskAssignmentsAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;

  const taskId = getPathParam('/api/tasks/[id]/assignments', path, 'id');
  if (!taskId) return false;

  const supabase = await getSupabase();

  // Check if task exists and get creator
  const { data: task, error: taskError } = await supabase
    .from('forms') // Tasks are stored in forms table
    .select('id, created_by')
    .eq('id', taskId)
    .single();

  if (taskError || !task) return false;

  // Creator has access
  if (task.created_by === userId) return true;

  // Basic role check for admin, root, class-teacher
  if (ADMINS.includes(userRole.name)) return true;

  // Check user_form_access for read/edit permissions
  const { data: userRoleData, error: userRoleError } = await supabase
    .from('users')
    .select('role:roles(id)')
    .eq('id', userId)
    .single();

  if (userRoleError || !userRoleData) return false;

  const roleData = Array.isArray(userRoleData.role) ? userRoleData.role[0] : userRoleData.role;

  const { data: accessData, error: accessError } = await supabase
    .from('user_form_access')
    .select('access_type')
    .eq('form_id', taskId)
    .eq('role_id', roleData.id)
    .single();

  if (accessError || !accessData) return false;

  return ['read', 'edit'].includes(accessData.access_type);
}

export async function checkTaskAssignAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;
  
  // Admins have full access
  if (ADMINS.includes(userRole.name)) {
    return true;
  }
  
  // Extract task ID from /api/tasks/[id]/assign
  const taskId = getPathParam('/api/tasks/[id]/assign', path, 'id');
  if (!taskId) return false;
  
  const supabase = await createServerSupabase();
  
  // Check if user is the task creator
  const { data: task, error: taskError } = await supabase
    .from('forms')
    .select('created_by')
    .eq('id', taskId)
    .eq('form_type', 'task')
    .single();
  
  if (taskError || !task) return false;
  
  // Allow access if user is the task creator
  if (task.created_by === userId) return true;
  
  // Check if user has edit access to this task through user_form_access
  const { data: accessData, error: accessError } = await supabase
    .from('user_form_access')
    .select('access_type')
    .eq('form_id', taskId)
    .eq('user_id', userId)
    .single();
  
  if (accessError && accessError.code !== 'PGRST116') {
    console.error('Error checking task assign access:', accessError);
    return false;
  }
  
  // If found in user_form_access, check if user has edit permission
  if (accessData) {
    return accessData.access_type === 'edit';
  }
  
  return false;
}
