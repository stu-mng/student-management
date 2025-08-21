import { createClient as createServerSupabase } from '../../database/supabase/server';
import { canDeleteUser } from '../utils';
import type { PermissionCheckArgs, Role } from './types';
import { getPathParam } from './utils';

async function getSupabase() {
  return await createServerSupabase();
}

function isPrivileged(role: Role | null, names: Array<Role['name']>): boolean {
  return !!role && names.includes(role.name);
}

export async function checkUserDeleteAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;
  
  // Only allow root, admin, manager, class-teacher to delete users
  if (!['root', 'admin', 'manager', 'class-teacher'].includes(userRole.name)) {
    return false;
  }
  
  // Get the target user ID from the path
  const targetUserId = getPathParam('/api/users/[id]', path, 'id');
  if (!targetUserId) return false;
  
  // Users cannot delete themselves
  if (targetUserId === userId) return false;
  
  const supabase = await getSupabase();
  
  // Get the target user's role to check if current user has higher permission
  const { data: targetUser, error: targetUserError } = await supabase
    .from('users')
    .select('role:roles(id, name, order)')
    .eq('id', targetUserId)
    .single();
  
  if (targetUserError || !targetUser) return false;
  
  const targetUserRole = Array.isArray(targetUser.role) ? targetUser.role[0] : targetUser.role;
  
  // Check if current user has higher permission than target user
  return canDeleteUser(userRole, targetUserRole);
}

export async function checkFormAccessPermission(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;
  
  // Root and admin have full access
  if (['root', 'admin'].includes(userRole.name)) {
    return true;
  }
  
  const formId = getPathParam('/api/forms/[id]/access', path, 'id');
  if (!formId) return false;
  
  const supabase = await getSupabase();
  
  // Check if user is the form creator
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, created_by')
    .eq('id', formId)
    .single();
  
  if (formError || !form) return false;
  
  if (form.created_by === userId) return true;
  
  // Check user_form_access table for role-based permissions
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role:roles(id)')
    .eq('id', userId)
    .single();
  
  if (userError || !userData) return false;
  
  // Type the role data properly
  type UserRoleData = { id: number; name?: string; order?: number } | null;
  const userRoleData = userData.role as UserRoleData | UserRoleData[];
  const userRoleId = Array.isArray(userRoleData) ? userRoleData[0]?.id : userRoleData?.id;
  
  if (userRoleId) {
    const { data: accessData, error: accessError } = await supabase
      .from('user_form_access')
      .select('access_type')
      .eq('form_id', formId)
      .eq('role_id', userRoleId)
      .single();
    
    if (accessError && accessError.code !== 'PGRST116') {
      console.error('Error checking form access:', accessError);
      return false;
    }
    
    // If found in user_form_access, user has permission
    if (accessData) {
      return true;
    }
  }
  
  return false;
}

export async function checkFormAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;
  if (isPrivileged(userRole, ['admin', 'root'])) return true;

  const formId = getPathParam('/api/forms/[id]', path, 'id');
  if (!formId) return false;

  const supabase = await getSupabase();

  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, created_by')
    .eq('id', formId)
    .single();
  if (formError || !form) return false;
  if (form.created_by === userId) return true;

  const { data: accessData, error: accessError } = await supabase
    .from('user_form_access')
    .select('access_type, role:roles(name, order)')
    .eq('form_id', formId)
    .eq('role.name', userRole.name)
    .single();
  if (accessError || !accessData) return false;
  return ['read', 'edit'].includes(accessData.access_type);
}

export async function checkFormEditAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;
  if (isPrivileged(userRole, ['admin', 'root'])) return true;

  const formId = getPathParam('/api/forms/[id]', path, 'id');
  if (!formId) return false;

  const supabase = await getSupabase();

  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, created_by')
    .eq('id', formId)
    .single();
  if (formError || !form) return false;
  if (form.created_by === userId) return true;

  const { data: accessData, error: accessError } = await supabase
    .from('user_form_access')
    .select('access_type, role:roles(name, order)')
    .eq('form_id', formId)
    .eq('role.name', userRole.name)
    .single();
  if (accessError || !accessData) return false;
  return accessData.access_type === 'edit';
}

export async function checkFormDeleteAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole } = args;
  if (!userRole) return false;
  return isPrivileged(userRole, ['admin', 'root']);
}

export async function checkFormResponseAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;
  if (isPrivileged(userRole, ['admin', 'root', 'manager', 'class-teacher'])) return true;

  const responseId = getPathParam('/api/form-responses/[id]', path, 'id');
  if (!responseId) return false;

  const supabase = await getSupabase();
  const { data: response, error: responseError } = await supabase
    .from('form_responses')
    .select('id, respondent_id, form:forms(id, created_by)')
    .eq('id', responseId)
    .single();
  
  if (responseError || !response) return false;
  
  // Type the response properly
  type ResponseRow = { 
    id: string; 
    respondent_id: string; 
    form: { id: string; created_by: string } | null 
  };
  const row = response as unknown as ResponseRow;
  
  console.log('🔍 checkFormResponseAccess Debug:', { userId, row });
  if (row.respondent_id === userId) return true;
  if (row.form?.created_by === userId) return true;
  return false;
}

export async function checkFormResponseViewAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;
  if (isPrivileged(userRole, ['admin', 'root'])) return true;

  const formId = getPathParam('/api/forms/[id]/responses', path, 'id') ?? getPathParam('/api/forms/[id]/responses/overview', path, 'id') ?? getPathParam('/api/forms/[id]', path, 'id');
  if (!formId) return false;

  const supabase = await getSupabase();
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, created_by')
    .eq('id', formId)
    .single();
  if (formError || !form) return false;
  if (form.created_by === userId) return true;
  return false;
}

export async function checkFormResponseEditAccess(args: PermissionCheckArgs): Promise<boolean> {
  const { userRole, userId, path } = args;
  if (!userRole) return false;
  if (isPrivileged(userRole, ['admin', 'root'])) return true;

  const formId = getPathParam('/api/forms/[id]/responses/users/[userId]', path, 'id') ?? getPathParam('/api/forms/[id]', path, 'id');
  const targetUserId = getPathParam('/api/forms/[id]/responses/users/[userId]', path, 'userId');
  if (!formId) return false;

  const supabase = await getSupabase();
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, created_by')
    .eq('id', formId)
    .single();
  if (formError || !form) return false;
  if (form.created_by === userId) return true;
  if (targetUserId === userId) return true;
  return false;
}


