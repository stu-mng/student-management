import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/database/supabase/server';
import { ErrorResponse } from '@/app/api/types';

interface FieldOverview {
  field_id: string;
  field_label: string;
  field_type: string;
  display_order: number;
  responses: Array<{
    response_id: string;
    respondent_name: string;
    respondent_email: string;
    field_value: string | null;
    field_values: string[] | null;
    created_at: string;
    submission_status: string;
  }>;
  total_responses: number;
}

interface FormOverviewResponse {
  success: boolean;
  data: FieldOverview[];
  total_responses: number;
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
        role:roles(name)
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

    // 檢查權限：只有表單創建者、管理員或 root 可以查看回應
    const userRole = (userData.role as any)?.name;
    const hasPermission = form.created_by === user.id || ['admin', 'root'].includes(userRole);
    
    if (!hasPermission) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // 獲取表單字段和選項
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select(`
        id, 
        field_label, 
        field_type, 
        display_order,
        form_field_options(
          option_value,
          option_label
        )
      `)
      .eq('form_id', id)
      .eq('is_active', true)
      .order('display_order');

    if (fieldsError) {
      console.error('Error fetching form fields:', fieldsError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch form fields' },
        { status: 500 }
      );
    }

    // 獲取所有回應和字段回應
    const { data: responses, error: responsesError } = await supabase
      .from('form_responses')
      .select(`
        id,
        submission_status,
        created_at,
        respondent:users!form_responses_respondent_id_fkey(name, email),
        field_responses:form_field_responses(
          field_id,
          field_value,
          field_values
        )
      `)
      .eq('form_id', id)
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.error('Error fetching form responses:', responsesError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // 創建選項值到標籤的映射
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

    // 組織數據：按字段分組
    const fieldOverviews: FieldOverview[] = fields.map(field => {
      const optionMap = createOptionMap(field.form_field_options || []);
      
      const fieldResponses = responses
        .filter(response => response.field_responses.some(fr => fr.field_id === field.id))
        .map(response => {
          const fieldResponse = response.field_responses.find(fr => fr.field_id === field.id);
          const respondent = Array.isArray(response.respondent) ? response.respondent[0] : response.respondent;
          
          // 轉換選項值為標籤
          let displayValue: string | null = null;
          let displayValues: string[] | null = null;
          
          if (fieldResponse?.field_values) {
            const converted = convertValueToLabel(fieldResponse.field_values, optionMap);
            displayValues = Array.isArray(converted) ? converted : null;
          } else if (fieldResponse?.field_value) {
            const converted = convertValueToLabel(fieldResponse.field_value, optionMap);
            displayValue = typeof converted === 'string' ? converted : null;
          }
          
          return {
            response_id: response.id,
            respondent_name: respondent?.name || '匿名用戶',
            respondent_email: respondent?.email || '',
            field_value: displayValue,
            field_values: displayValues,
            created_at: response.created_at,
            submission_status: response.submission_status
          };
        });

      return {
        field_id: field.id,
        field_label: field.field_label,
        field_type: field.field_type,
        display_order: field.display_order,
        responses: fieldResponses,
        total_responses: fieldResponses.length
      };
    });

    return NextResponse.json<FormOverviewResponse>({
      success: true,
      data: fieldOverviews,
      total_responses: responses.length,
    });

  } catch (error) {
    console.error('Error in GET /api/forms/[id]/responses/overview:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 