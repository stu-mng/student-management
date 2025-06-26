import type {
  ErrorResponse,
  FieldResponseCreateData,
  FormFieldOption,
  FormFieldResponseData,
  FormResponseCreateData,
  FormResponseCreateRequest,
  FormResponseDetailResponse,
  FormResponsesResponse,
  UserData
} from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
        role:roles(id, name)
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

    // 檢查權限：表單創建者、管理員、root、class-teacher 以及有表單編輯權限的用戶可以查看回應
    const userRole = (userData as unknown as UserData).role;
    const userRoleName = userRole?.name || '';
    const userRoleId = userRole?.id;
    let hasPermission = false;

    // 1. 檢查基本權限：表單創建者、管理員、root、class-teacher
    if (form.created_by === user.id || ['admin', 'root', 'class-teacher'].includes(userRoleName)) {
      hasPermission = true;
    }
    // 2. 檢查表單編輯權限
    else if (userRoleId) {
      const { data: userAccess, error: accessError } = await supabase
        .from('user_form_access')
        .select('access_type')
        .eq('form_id', id)
        .eq('role_id', userRoleId)
        .single();

      if (!accessError && userAccess && userAccess.access_type === 'edit') {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 獲取表單回應
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: responses, error: responsesError, count } = await supabase
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
      `, { count: 'exact' })
      .eq('form_id', id)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.error('Error fetching form responses:', responsesError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // 創建選項值到標籤的映射函數
    const createOptionMap = (options: FormFieldOption[]) => {
      const map = new Map<string, string>();
      options.forEach(option => {
        map.set(option.option_value, option.option_label);
      });
      return map;
    };

    // 轉換選項值為標籤
    const convertValueToLabel = (value: string | string[] | null, optionMap: Map<string, string>): string | string[] | null => {
      if (!value) return null;
      
      if (Array.isArray(value)) {
        return value.map(v => optionMap.get(v) || v);
      } else {
        return optionMap.get(value) || value;
      }
    };

    // 處理回應數據，轉換選項值為標籤
    const processedResponses = responses?.map(response => ({
      ...response,
      field_responses: response.field_responses.map((fieldResponse: FormFieldResponseData) => {
        const optionMap = createOptionMap(fieldResponse.field?.form_field_options || []);
        
        let displayValue: string | null = null;
        let displayValues: string[] | null = null;
        
        if (fieldResponse.field_values) {
          const converted = convertValueToLabel(fieldResponse.field_values, optionMap);
          displayValues = Array.isArray(converted) ? converted : null;
        } else if (fieldResponse.field_value) {
          const converted = convertValueToLabel(fieldResponse.field_value, optionMap);
          displayValue = typeof converted === 'string' ? converted : null;
        }
        
        return {
          ...fieldResponse,
          field_value: displayValue,
          field_values: displayValues,
          field: {
            id: fieldResponse.field.id,
            field_label: fieldResponse.field.field_label,
            field_type: fieldResponse.field.field_type
          }
        };
      })
    })) || [];

    return NextResponse.json<FormResponsesResponse>({
      success: true,
      data: processedResponses,
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error in GET /api/forms/[id]/responses:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { id: form_id } = await params;
    const body: FormResponseCreateRequest = await request.json();
    const {
      respondent_id,
      respondent_type = 'user',
      submission_status = 'draft',
      field_responses = [],
      metadata
    } = body;

    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, status, allow_multiple_submissions')
      .eq('id', form_id)
      .single();

    if (formError) {
      if (formError.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      console.error('Error checking form:', formError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to check form' },
        { status: 500 }
      );
    }

    // 檢查表單狀態
    if (form.status !== 'active') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Form is not active' },
        { status: 400 }
      );
    }

    // 如果不允許多次提交，檢查是否已有回應
    if (!form.allow_multiple_submissions && respondent_id) {
      const { data: existingResponse, error: checkError } = await supabase
        .from('form_responses')
        .select('id')
        .eq('form_id', form_id)
        .eq('respondent_id', respondent_id)
        .eq('respondent_type', respondent_type)
        .single();

      if (existingResponse) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Multiple submissions not allowed for this form' },
          { status: 400 }
        );
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing response:', checkError);
      }
    }

    // 創建表單回應
    const responseData: FormResponseCreateData = {
      form_id,
      respondent_type,
      submission_status,
      metadata
    };

    if (respondent_id) {
      responseData.respondent_id = respondent_id;
    }

    if (submission_status === 'submitted') {
      responseData.submitted_at = new Date().toISOString();
    }

    const { data: formResponse, error: responseError } = await supabase
      .from('form_responses')
      .insert(responseData)
      .select()
      .single();

    if (responseError) {
      console.error('Error creating form response:', responseError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to create form response' },
        { status: 500 }
      );
    }

    // 創建欄位回應
    if (field_responses.length > 0) {
      const fieldResponsesData: FieldResponseCreateData[] = field_responses.map((fieldResponse) => ({
        response_id: formResponse.id,
        field_id: fieldResponse.field_id,
        field_value: fieldResponse.field_value,
        field_values: fieldResponse.field_values,
      }));

      const { error: fieldResponsesError } = await supabase
        .from('form_field_responses')
        .insert(fieldResponsesData);

      if (fieldResponsesError) {
        console.error('Error creating field responses:', fieldResponsesError);
        // 如果欄位回應創建失敗，刪除已創建的表單回應
        await supabase.from('form_responses').delete().eq('id', formResponse.id);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to create field responses' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json<FormResponseDetailResponse>({
      success: true,
      data: formResponse,
    });

  } catch (error) {
    console.error('Error in POST /api/forms/[id]/responses:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 