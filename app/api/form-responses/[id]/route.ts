import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { 
  ErrorResponse,
  SuccessResponse,
  FormFieldResponseCreateRequest
} from '@/app/api/types';

interface UpdateFormResponseRequest {
  field_responses: FormFieldResponseCreateRequest[];
  submission_status?: 'draft' | 'submitted';
}

interface FormResponseUpdateResponse {
  success: boolean;
  data: any;
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

    const { id: responseId } = await params;

    // 獲取回應數據
    const { data: response, error: responseError } = await supabase
      .from('form_responses')
      .select(`
        *,
        respondent:users!form_responses_respondent_id_fkey(id, name, email),
        field_responses:form_field_responses(
          *,
          field:form_fields(
            id, 
            field_label, 
            field_type,
            form_field_options(
              option_value,
              option_label
            )
          )
        )
      `)
      .eq('id', responseId)
      .single();

    if (responseError) {
      if (responseError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Response not found' },
          { status: 404 }
        );
      }
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch response' },
        { status: 500 }
      );
    }

    // 檢查權限：只有回應者本人或有編輯權限的用戶可以查看
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

    // 獲取表單信息以檢查創建者權限
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('created_by')
      .eq('id', response.form_id)
      .single();

    if (formError) {
      return NextResponse.json<ErrorResponse>({ error: 'Failed to fetch form' }, { status: 500 });
    }

    const isOwner = user.id === response.respondent_id;
    const userRole = (userData.role as any)?.name;
    const hasEditPermission = form.created_by === user.id || ['admin', 'root', 'manager'].includes(userRole);

    if (!isOwner && !hasEditPermission) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json<FormResponseUpdateResponse>({
      success: true,
      data: response,
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

    const { id: responseId } = await params;
    const body: UpdateFormResponseRequest = await request.json();
    const { field_responses, submission_status = 'draft' } = body;

    // 檢查回應是否存在並獲取相關信息
    const { data: existingResponse, error: responseError } = await supabase
      .from('form_responses')
      .select(`
        *,
        form:forms(
          id,
          created_by,
          allow_multiple_submissions,
          status
        )
      `)
      .eq('id', responseId)
      .single();

    if (responseError) {
      if (responseError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Response not found' },
          { status: 404 }
        );
      }
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch response' },
        { status: 500 }
      );
    }

    // 檢查權限：只有回應者本人可以修改
    if (existingResponse.respondent_id !== user.id && user.role?.order < 3) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // 檢查表單狀態
    if (existingResponse.form.status !== 'active') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Form is not active' },
        { status: 400 }
      );
    }

    // 更新回應狀態
    const { data: updatedResponse, error: updateError } = await supabase
      .from('form_responses')
      .update({
        submission_status,
        submitted_at: submission_status === 'submitted' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', responseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating form response:', updateError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to update response' },
        { status: 500 }
      );
    }

    // 刪除現有的字段回應
    const { error: deleteError } = await supabase
      .from('form_field_responses')
      .delete()
      .eq('response_id', responseId);

    if (deleteError) {
      console.error('Error deleting existing field responses:', deleteError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to update field responses' },
        { status: 500 }
      );
    }

    // 創建新的字段回應
    if (field_responses && field_responses.length > 0) {
      const fieldResponsesData = field_responses.map(fr => ({
        response_id: responseId,
        field_id: fr.field_id,
        field_value: fr.field_value || null,
        field_values: fr.field_values || null,
      }));

      const { error: insertError } = await supabase
        .from('form_field_responses')
        .insert(fieldResponsesData);

      if (insertError) {
        console.error('Error inserting field responses:', insertError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to save field responses' },
          { status: 500 }
        );
      }
    }

    // 獲取更新後的完整回應數據
    const { data: finalResponse, error: finalError } = await supabase
      .from('form_responses')
      .select(`
        *,
        respondent:users!form_responses_respondent_id_fkey(id, name, email),
        field_responses:form_field_responses(
          *,
          field:form_fields(
            id, 
            field_label, 
            field_type,
            form_field_options(
              option_value,
              option_label
            )
          )
        )
      `)
      .eq('id', responseId)
      .single();

    if (finalError) {
      console.error('Error fetching updated response:', finalError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch updated response' },
        { status: 500 }
      );
    }

    return NextResponse.json<FormResponseUpdateResponse>({
      success: true,
      data: finalResponse,
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
      .select(`
        role:roles(name)
      `)
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
    const userRole = (userData.role as any)?.name;
    if (!['admin', 'root', 'project_manager'].includes(userRole)) {
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