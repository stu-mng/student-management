import type { ErrorResponse, UserFormResponsesResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: formId, userId } = await params;

    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, created_by, allow_multiple_submissions')
      .eq('id', formId)
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

    // 檢查權限：只有用戶本人或有編輯權限的用戶可以查看
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

    const isOwner = user.id === userId;
    const userRole = (userData.role as any)?.name;
    const hasEditPermission = form.created_by === user.id || ['admin', 'root'].includes(userRole);
    
    if (!isOwner && !hasEditPermission) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // 獲取用戶在該表單的所有回應
    const { data: responses, error: responsesError } = await supabase
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
      .eq('form_id', formId)
      .eq('respondent_id', userId)
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.error('Error fetching user form responses:', responsesError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // 創建選項值到標籤的映射函數
    const createOptionMap = (options: any[]) => {
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
      field_responses: response.field_responses.map((fieldResponse: any) => {
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

    return NextResponse.json<UserFormResponsesResponse>({
      success: true,
      data: processedResponses,
      total: processedResponses.length,
    });

  } catch (error) {
    console.error('Error in GET /api/forms/[id]/responses/users/[userId]:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 