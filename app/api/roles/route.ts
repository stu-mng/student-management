import { ErrorResponse, RolesListResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/roles
 * 
 * 返回系統中所有角色的列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        role:roles(name)
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    // 只有管理員可以查看角色列表
    const currentUserRole = (userData.role as any)?.name;
    if (!['admin', 'root', 'manager'].includes(currentUserRole)) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    // 獲取所有角色
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 500 });
    }

    return NextResponse.json<RolesListResponse>({
      success: true,
      data: roles || []
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to get roles' },
      { status: 500 }
    );
  }
} 