import { createClient } from '@/database/supabase/server';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    
    // Get user info from middleware headers
    const userInfo = getUserFromHeaders(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, userRoleName } = userInfo;
    // Verify task exists and user has permission
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .select('created_by')
      .eq('id', id)
      .eq('form_type', 'task')
      .single();

    if (taskError) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check permission: creator, admin, or assigned user
    const isCreator = task.created_by === userId;
    const isAdmin = ['admin', 'root'].includes(userRoleName);
    
    if (!isCreator && !isAdmin) {
      // Check if user is assigned to this task
      const { data: access } = await supabase
        .from('user_form_access')
        .select('id')
        .eq('form_id', id)
        .eq('user_id', userId)
        .single();

      if (!access) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get task assignments with user details
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_form_access')
      .select(`
        user_id,
        granted_at,
        access_type,
        is_active
      `)
      .eq('form_id', id)
      .eq('is_active', true)
      .order('granted_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching task assignments:', assignmentsError);
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }

    // Get user details for all assignments
    const userIds = (assignments || []).map(a => a.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        region,
        role:roles(
          id,
          name,
          display_name,
          color,
          order
        )
      `)
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
    }

    // Create a map of user details
    const userMap = new Map((users || []).map(user => [user.id, user]));

    // Transform response data to match frontend interface
    const transformedAssignments = (assignments || []).map(assignment => {
      const user = userMap.get(assignment.user_id);
      if (!user) return null;
      
      // Format role data consistently with /api/users
      const roleData = Array.isArray(user.role) ? user.role[0] : user.role;
      
      return {
        user_id: assignment.user_id,
        granted_at: assignment.granted_at,
        user: {
          name: user.name,
          email: user.email,
          role: {
            display_name: roleData?.display_name || '未知角色'
          }
        }
      };
    }).filter(assignment => assignment !== null);

    return NextResponse.json({
      assignments: transformedAssignments,
      total: transformedAssignments.length
    });

  } catch (error) {
    console.error('Error in task assignments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
