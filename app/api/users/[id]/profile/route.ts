import { ErrorResponse, User, FormResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { hasEqualOrHigherPermission } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

interface UserProfileResponse {
  user: User;
  formResponses?: FormResponse[];
}

/**
 * GET /api/users/[id]/profile
 * 
 * 獲取用戶的個人資料頁面資訊
 * 如果當前用戶擁有比查看用戶更高（或一樣）的權限，則顯示表單作答記錄
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 獲取當前用戶的認證資料
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取當前用戶的角色
    const { data: currentUserData, error: currentUserError } = await supabase
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

    if (currentUserError || !currentUserData) {
      return NextResponse.json<ErrorResponse>({ error: 'Failed to get current user role' }, { status: 500 });
    }

    // 獲取目標用戶的完整資料，包含 role 資料
    const { data: targetUserData, error: targetUserError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        region,
        created_at,
        updated_at,
        avatar_url,
        last_active,
        role:roles(
          id,
          name,
          display_name,
          color,
          order
        )
      `)
      .eq('id', id)
      .single();

    if (targetUserError) {
      if (targetUserError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json<ErrorResponse>({ error: targetUserError.message }, { status: 500 });
    }

    // 格式化目標用戶資料
    const formattedUser: User = {
      ...targetUserData,
      role: Array.isArray(targetUserData.role) ? targetUserData.role[0] : targetUserData.role
    };

    const currentUserRole = Array.isArray(currentUserData.role) ? currentUserData.role[0] : currentUserData.role;
    const targetUserRole = Array.isArray(targetUserData.role) ? targetUserData.role[0] : targetUserData.role;

    // 檢查是否有權限查看表單作答記錄
    // 如果當前用戶擁有比目標用戶更高（或一樣）的權限，則可以查看表單作答記錄
    const canViewFormResponses = hasEqualOrHigherPermission(currentUserRole, targetUserRole);

    let formResponses: FormResponse[] = [];

    if (canViewFormResponses) {
      // 獲取目標用戶的表單作答記錄
      const { data: responsesData, error: responsesError } = await supabase
        .from('form_responses')
        .select(`
          id,
          form_id,
          respondent_id,
          respondent_type,
          submission_status,
          submitted_at,
          reviewed_at,
          reviewed_by,
          review_notes,
          metadata,
          created_at,
          updated_at,
          forms (
            id,
            title,
            description,
            form_type,
            status,
            is_required,
            submission_deadline,
            created_by,
            created_at
          )
        `)
        .eq('respondent_id', id)
        .order('created_at', { ascending: false });

      if (responsesError) {
        console.error('Error fetching form responses:', responsesError);
        // 如果獲取表單回應失敗，不影響用戶資料的返回，只是不顯示表單記錄
      } else {
        // 格式化回應資料以符合 FormResponse 類型
        formResponses = (responsesData || []).map(response => ({
          ...response,
          forms: Array.isArray(response.forms) ? response.forms[0] : response.forms
        }));
      }
    }

    const response: UserProfileResponse = {
      user: formattedUser,
      ...(canViewFormResponses && { formResponses })
    };

    return NextResponse.json<UserProfileResponse>(response);
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
} 