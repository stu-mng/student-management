import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { ErrorResponse } from '@/app/api/types';

interface AccessResponse {
  success: boolean;
  data: {
    hasAccess: boolean;
    accessType: 'read' | 'edit' | null;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        role:roles(
          id,
          name,
          display_name,
          color,
          order
        )
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    const { id } = await params;

    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (formError) {
      if (formError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch form' },
        { status: 500 }
      );
    }

    const currentUserRole = (userData.role as any)?.name;
    const currentUserRoleId = (userData.role as any)?.id;

    // 檢查用戶是否為表單創建者
    if (form.created_by === user.id) {
      return NextResponse.json<AccessResponse>({
        success: true,
        data: {
          hasAccess: true,
          accessType: 'edit'
        }
      });
    }

    // 管理員和 root 用戶有完整權限
    if (['admin', 'root'].includes(currentUserRole)) {
      return NextResponse.json<AccessResponse>({
        success: true,
        data: {
          hasAccess: true,
          accessType: 'edit'
        }
      });
    }

    // 檢查 user_form_access 表中的權限
    if (currentUserRoleId) {
      const { data: accessData, error: accessError } = await supabase
        .from('user_form_access')
        .select('access_type')
        .eq('form_id', id)
        .eq('role_id', currentUserRoleId)
        .single();

      if (accessError && accessError.code !== 'PGRST116') {
        console.error('Error checking form access:', accessError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to check access' },
          { status: 500 }
        );
      }

      // 如果在 user_form_access 中找到權限記錄
      if (accessData) {
        return NextResponse.json<AccessResponse>({
          success: true,
          data: {
            hasAccess: true,
            accessType: accessData.access_type as 'read' | 'edit'
          }
        });
      }
    }

    // 沒有權限
    return NextResponse.json<AccessResponse>({
      success: true,
      data: {
        hasAccess: false,
        accessType: null
      }
    });

  } catch (error) {
    console.error('Error in GET /api/forms/[id]/access:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 