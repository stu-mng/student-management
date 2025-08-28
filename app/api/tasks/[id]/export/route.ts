import { createClient } from '@/database/supabase/server';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { id } = await params;
    console.log('Exporting task:', id);

    // 獲取任務詳情（任務存儲在 forms 表中）
    const { data: task, error: taskError } = await supabase
      .from('forms')
      .select(`
        id,
        title,
        description,
        status,
        submission_deadline,
        created_at
      `)
      .eq('id', id)
      .single();

    if (taskError) {
      console.error('Task fetch error:', taskError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    console.log('Task found:', task.title);

    // 獲取任務回應（通過 form_responses 表）
    const { data: responses, error: responsesError } = await supabase
      .from('form_responses')
      .select(`
        id,
        respondent_id,
        submission_status,
        submitted_at,
        users!form_responses_respondent_id_fkey (
          id,
          name,
          email,
          role:roles(display_name)
        )
      `)
      .eq('form_id', id);

    if (responsesError) {
      console.error('Responses fetch error:', responsesError);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    console.log('Responses found:', responses?.length || 0);

    // 獲取表單欄位回應（通過 form_field_responses 表）
    const { data: fieldResponses, error: fieldResponsesError } = await supabase
      .from('form_field_responses')
      .select(`
        response_id,
        field_id,
        field_value,
        form_fields (
          field_label,
          field_name,
          field_type
        )
      `)
      .in('response_id', responses?.map(r => r.id) || []);

    if (fieldResponsesError) {
      console.error('Field responses fetch error:', fieldResponsesError);
      return NextResponse.json({ error: 'Failed to fetch field responses' }, { status: 500 });
    }

    console.log('Field responses found:', fieldResponses?.length || 0);

    // 獲取表單欄位（任務要求）
    const { data: formFields, error: fieldsError } = await supabase
      .from('form_fields')
      .select(`
        id,
        field_label,
        field_name,
        field_type,
        is_required,
        help_text
      `)
      .eq('form_id', id)
      .eq('is_active', true)
      .order('display_order');

    if (fieldsError) {
      console.error('Form fields fetch error:', fieldsError);
      return NextResponse.json({ error: 'Failed to fetch form fields' }, { status: 500 });
    }

    console.log('Form fields found:', formFields?.length || 0);

    // 準備匯出數據
    const exportData: Record<string, any>[] = [];
    
    // 為每個回應創建一行數據
    responses?.forEach((response) => {
      const user = response.users as any;
      
      const row: any = {
        '用戶ID': response.respondent_id,
        '姓名': user?.name || '',
        '電子郵件': user?.email || '',
        '角色': user?.role?.display_name || '未知',
        '提交狀態': response.submission_status === 'draft' ? '草稿' :
                   response.submission_status === 'submitted' ? '已提交' :
                   response.submission_status === 'reviewed' ? '已審核' :
                   response.submission_status === 'approved' ? '已核准' : '未知',
        '提交時間': response.submitted_at ? new Date(response.submitted_at).toLocaleString('zh-TW') : '',
      };

      // 添加表單欄位回應
      formFields?.forEach((field) => {
        const fieldResponse = fieldResponses?.find(fr => 
          fr.response_id === response.id && fr.field_id === field.id
        );
        
        if (fieldResponse) {
          if (field.field_type === 'file_upload ') {
            row[`${field.field_label}`] = `https://drive.google.com/file/d/${fieldResponse.field_value}`;
          } else {
            row[`${field.field_label}`] = fieldResponse.field_value;
          }
        } else {
          row[`${field.field_label}`] = '';
        }
      });

      exportData.push(row);
    });

    console.log('Export data prepared:', exportData.length, 'rows');

    // 檢查是否有數據要匯出
    if (exportData.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 400 });
    }

    // 創建 Excel 工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 設置列寬
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '任務結果');

    // 生成 Excel 檔案
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // 設置響應頭
    const filename = `${task.title}_任務結果_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    console.log('Excel file generated, size:', excelBuffer.length);
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
