import { createClient as createServerSupabase } from '@/database/supabase/server';
import type { PermissionCheckArgs, Role } from './types';
import { getPathParam } from './utils';

async function getSupabase() {
  return await createServerSupabase();
}

function isPrivileged(role: Role | null, names: Array<Role['name']>): boolean {
  return !!role && names.includes(role.name);
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
  if (isPrivileged(userRole, ['admin', 'root', 'manager'])) return true;

  const responseId = getPathParam('/api/form-responses/[id]', path, 'id');
  if (!responseId) return false;

  const supabase = await getSupabase();
  const { data: response, error: responseError } = await supabase
    .from('form_responses')
    .select('id, user_id, form:forms(id, created_by)')
    .eq('id', responseId)
    .single();
  type ResponseRow = { id: string; user_id: string; form: { id: string; created_by: string } | null };
  const row = response as unknown as ResponseRow | null;
  if (responseError || !row) return false;
  if (row.user_id === userId) return true;
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


