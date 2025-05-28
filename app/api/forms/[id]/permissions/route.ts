import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { ErrorResponse, RolePermission } from '@/app/api/types';

interface PermissionsUpdateRequest {
  permissions: {
    role: string;
    access_type: 'read' | 'edit' | null;
  }[];
}

export async function PUT(
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

    // 只有管理員和 root 可以修改權限設定
    const currentUserRole = (userData.role as any)?.name;
    if (!['admin', 'root'].includes(currentUserRole)) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = await params;
    const body: PermissionsUpdateRequest = await request.json();
    const { permissions } = body;

    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
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

    // 刪除現有權限
    const { error: deleteError } = await supabase
      .from('user_form_access')
      .delete()
      .eq('form_id', id);

    if (deleteError) {
      console.error('Error deleting existing permissions:', deleteError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to update permissions' },
        { status: 500 }
      );
    }


    if (permissions.length > 0) {
      // 首先獲取角色名稱對應的 role_id
      const roleNames = permissions.map(p => p.role);
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, name')
        .in('name', roleNames);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to fetch roles' },
          { status: 500 }
        );
      }

      // 將角色名稱轉換為 role_id
      const permissionsWithRoleId = permissions.map(p => {
        const roleData = rolesData?.find(r => r.name === p.role);
        if (!roleData) {
          throw new Error(`Role not found: ${p.role}`);
        }
        return {
          form_id: id,
          role_id: roleData.id,
          access_type: p.access_type,
        };
      });

      const { error: insertError } = await supabase
        .from('user_form_access')
        .insert(permissionsWithRoleId);

      if (insertError) {
        console.error('Error inserting new permissions:', insertError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to update permissions' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('Error in PUT /api/forms/[id]/permissions:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 