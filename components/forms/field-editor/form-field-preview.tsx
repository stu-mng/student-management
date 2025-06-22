"use client"

import type { FormFieldWithId } from "../form-context"

interface FormFieldPreviewProps {
  field: FormFieldWithId
}

export function FormFieldPreview({ field }: FormFieldPreviewProps) {
  const getFieldTypeDescription = (fieldType: string) => {
    const typeMap = {
      'text': '單行文字輸入',
      'textarea': '多行文字輸入',
      'number': '數字輸入',
      'email': '電子郵件輸入',
      'phone': '電話號碼輸入',
      'taiwan_id': '身分證字號輸入',
      'radio': '單選題',
      'checkbox': '多選題',
      'select': '下拉選單',
      'multi-select': '多選下拉選單',
      'radio_grid': '單選方格',
      'checkbox_grid': '核取方塊格'
    }
    return typeMap[fieldType as keyof typeof typeMap] || fieldType
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        {getFieldTypeDescription(field.field_type)}
      </div>
      
      {field.placeholder && (
        <div className="text-xs text-muted-foreground">
          提示文字: {field.placeholder}
        </div>
      )}
      
      {field.help_text && (
        <div className="text-xs text-muted-foreground">
          說明文字: {field.help_text}
        </div>
      )}
      
      {field.is_required && (
        <div className="text-xs text-red-600">
          * 必填欄位
        </div>
      )}

      {field.options && field.options.length > 0 && (
        <div className="text-xs text-muted-foreground">
          選項: {field.options.map(opt => opt.option_label).filter(Boolean).join(', ')}
        </div>
      )}

      {field.grid_options && (field.grid_options.rows?.length > 0 || field.grid_options.columns?.length > 0) && (
        <div className="text-xs text-muted-foreground">
          方格設定: {field.grid_options.rows?.length || 0} 列 × {field.grid_options.columns?.length || 0} 欄
        </div>
      )}
    </div>
  )
} 