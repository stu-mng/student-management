import type { ErrorResponse, RolesListResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/roles
 * 
 * 返回系統中所有角色的列表
 * Permission check handled by middleware
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user info from middleware headers (already authenticated and authorized)
    const userInfo = getUserFromHeaders(request);
    
    if (!userInfo) {
      // Fallback if middleware didn't process this request
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
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