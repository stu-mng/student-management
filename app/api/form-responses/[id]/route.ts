import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { 
  FormResponseUpdateRequest, 
  FormResponseDetailResponse, 
  ErrorResponse,
  SuccessResponse 
} from '@/app/api/types';

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
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    const { id } = await params;

    // 獲取表單回應基本資訊
    const { data: response, error: responseError } = await supabase
      .from('form_responses')
      .select(`
        *,
        forms (
          id,
          title,
          description,
          form_type,
          target_role
        )
      `)
      .eq('id', id)
      .single();

    if (responseError) {
      if (responseError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form response not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching form response:', responseError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch form response' },
        { status: 500 }
      );
    }

    // 檢查用戶是否有權限查看此回應
    if (!['admin', 'root', 'project_manager'].includes(userData.role)) {
      if (response.respondent_id !== user.id) {
        return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
      }
    }

    // 獲取欄位回應
    const { data: fieldResponses, error: fieldResponsesError } = await supabase
      .from('form_field_responses')
      .select(`
        *,
        form_fields (
          id,
          field_name,
          field_label,
          field_type,
          display_order,
          is_required,
          form_field_options (
            id,
            option_value,
            option_label,
            display_order
          )
        )
      `)
      .eq('response_id', id)
      .order('form_fields(display_order)');

    if (fieldResponsesError) {
      console.error('Error fetching field responses:', fieldResponsesError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch field responses' },
        { status: 500 }
      );
    }

    return NextResponse.json<FormResponseDetailResponse>({
      success: true,
      data: {
        ...response,
        field_responses: fieldResponses || [],
      },
    });

  } catch (error) {
    console.error('Error in GET /api/form-responses/[id]:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    const { id } = await params;
    const body: FormResponseUpdateRequest = await request.json();
    const {
      submission_status,
      field_responses = [],
      review_notes,
      reviewed_by,
      metadata
    } = body;

    // 檢查表單回應是否存在
    const { data: existingResponse, error: checkError } = await supabase
      .from('form_responses')
      .select('id, submission_status, form_id, respondent_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form response not found' },
          { status: 404 }
        );
      }
      console.error('Error checking form response existence:', checkError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to check form response' },
        { status: 500 }
      );
    }

    // 檢查用戶是否有權限更新此回應
    if (!['admin', 'root', 'project_manager'].includes(userData.role)) {
      if (existingResponse.respondent_id !== user.id) {
        return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
      }
    }

    // 準備更新資料
    const updateData: any = {};
    
    if (submission_status !== undefined) {
      updateData.submission_status = submission_status;
      
      // 如果狀態變為 submitted，設定提交時間
      if (submission_status === 'submitted' && existingResponse.submission_status !== 'submitted') {
        updateData.submitted_at = new Date().toISOString();
      }
      
      // 如果狀態變為 reviewed、approved 或 rejected，設定審核時間
      if (['reviewed', 'approved', 'rejected'].includes(submission_status)) {
        updateData.reviewed_at = new Date().toISOString();
        if (reviewed_by) {
          updateData.reviewed_by = reviewed_by;
        }
      }
    }
    
    if (review_notes !== undefined) updateData.review_notes = review_notes;
    if (reviewed_by !== undefined) updateData.reviewed_by = reviewed_by;
    if (metadata !== undefined) updateData.metadata = metadata;

    // 更新表單回應
    const { data: updatedResponse, error: updateError } = await supabase
      .from('form_responses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating form response:', updateError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to update form response' },
        { status: 500 }
      );
    }

    // 如果提供了欄位回應資料，更新欄位回應
    if (field_responses.length > 0) {
      // 先刪除現有的欄位回應
      const { error: deleteError } = await supabase
        .from('form_field_responses')
        .delete()
        .eq('response_id', id);

      if (deleteError) {
        console.error('Error deleting existing field responses:', deleteError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to update field responses' },
          { status: 500 }
        );
      }

      // 創建新的欄位回應
      const fieldResponsesData = field_responses.map((fieldResponse) => ({
        response_id: id,
        field_id: fieldResponse.field_id,
        field_value: fieldResponse.field_value,
        field_values: fieldResponse.field_values,
      }));

      const { error: insertError } = await supabase
        .from('form_field_responses')
        .insert(fieldResponsesData);

      if (insertError) {
        console.error('Error inserting field responses:', insertError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to update field responses' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json<FormResponseDetailResponse>({
      success: true,
      data: updatedResponse,
    });

  } catch (error) {
    console.error('Error in PUT /api/form-responses/[id]:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    const { id } = await params;

    // 檢查表單回應是否存在
    const { data: existingResponse, error: checkError } = await supabase
      .from('form_responses')
      .select('id, respondent_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form response not found' },
          { status: 404 }
        );
      }
      console.error('Error checking form response existence:', checkError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to check form response' },
        { status: 500 }
      );
    }

    // 檢查用戶是否有權限刪除此回應
    if (!['admin', 'root', 'project_manager'].includes(userData.role)) {
      if (existingResponse.respondent_id !== user.id) {
        return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
      }
    }

    // 刪除表單回應（CASCADE 會自動刪除相關的欄位回應）
    const { error: deleteError } = await supabase
      .from('form_responses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting form response:', deleteError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to delete form response' },
        { status: 500 }
      );
    }

    return NextResponse.json<SuccessResponse & { message: string }>({
      success: true,
      message: 'Form response deleted successfully',
    });

  } catch (error) {
    console.error('Error in DELETE /api/form-responses/[id]:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 