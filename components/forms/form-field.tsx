"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FormField, FormFieldOption, GridOptions } from "@/app/api/types"

interface FormFieldComponentProps {
  field: FormField
  value: any
  onChange: (fieldId: string, value: any) => void
  hasError?: boolean
}

// Grid組件
interface GridComponentProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  hasError?: boolean
  mode: 'radio' | 'checkbox'
}

function GridComponent({ field, value, onChange, hasError = false, mode }: GridComponentProps) {
  const gridOptions = field.grid_options
  if (!gridOptions || !gridOptions.rows || !gridOptions.columns) {
    return <div className="text-red-500">Grid配置不完整</div>
  }

  const { rows, columns } = gridOptions

  const handleRadioChange = (rowValue: string, columnValue: string) => {
    const currentValue = value || {}
    onChange({ ...currentValue, [rowValue]: columnValue })
  }

  const handleCheckboxChange = (rowValue: string, columnValue: string, checked: boolean) => {
    const currentValue = value || {}
    const rowData = currentValue[rowValue] || []
    
    if (checked) {
      const newRowData = Array.isArray(rowData) ? [...rowData, columnValue] : [columnValue]
      onChange({ ...currentValue, [rowValue]: newRowData })
    } else {
      const newRowData = Array.isArray(rowData) ? rowData.filter((v: string) => v !== columnValue) : []
      onChange({ ...currentValue, [rowValue]: newRowData })
    }
  }

  return (
    <div className={`overflow-x-auto ${hasError ? 'border border-red-500 rounded p-3' : ''}`}>
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 p-3 bg-gray-50 text-left font-medium min-w-0 w-fit">
              {/* 空白角落 */}
            </th>
            {columns.map((column) => (
              <th key={column.value} className="border border-gray-300 p-3 bg-gray-50 text-center font-medium whitespace-nowrap min-w-[120px]">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.value}>
              <td className="border border-gray-300 p-3 bg-gray-50 font-medium whitespace-nowrap min-w-[150px]">
                {row.label}
              </td>
              {columns.map((column) => (
                <td key={column.value} className="border border-gray-300 p-3 text-center min-w-[120px]">
                  {mode === 'radio' ? (
                    <input
                      type="radio"
                      name={`grid_${field.id}_${row.value}`}
                      value={column.value}
                      checked={value?.[row.value] === column.value}
                      onChange={() => handleRadioChange(row.value, column.value)}
                      className="w-4 h-4"
                    />
                  ) : (
                    <Checkbox
                      checked={Array.isArray(value?.[row.value]) && value[row.value].includes(column.value)}
                      onCheckedChange={(checked) => handleCheckboxChange(row.value, column.value, checked as boolean)}
                      className="w-4 h-4"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FormFieldComponent({ field, value, onChange, hasError = false }: FormFieldComponentProps) {
  const fieldValue = value || field.default_value || ''
  const errorClass = hasError ? 'border-red-500 focus:border-red-500' : ''

  const renderFieldInput = () => {
    switch (field.field_type) {
      case 'text':
      case 'email':
        return (
          <Input
            type={field.field_type}
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required || false}
            className={`text-base ${errorClass}`}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required || false}
            className={`text-base ${errorClass}`}
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required || false}
            rows={4}
            className={`text-base ${errorClass}`}
          />
        )

      case 'select':
        return (
          <Select
            value={fieldValue}
            onValueChange={(val) => onChange(field.id, val)}
          >
            <SelectTrigger className={`text-base ${errorClass}`}>
              <SelectValue placeholder={field.placeholder || '請選擇'} />
            </SelectTrigger>
            <SelectContent>
              {field.form_field_options?.map((option: FormFieldOption) => (
                <SelectItem key={option.id} value={option.option_value} className="text-base">
                  {option.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'radio':
        return (
          <RadioGroup
            value={fieldValue}
            onValueChange={(val) => onChange(field.id, val)}
            className={`space-y-3 ${hasError ? 'border border-red-500 rounded p-3' : ''}`}
          >
            {field.form_field_options?.map((option: FormFieldOption) => (
              <div key={option.id} className="flex items-center space-x-3">
                <RadioGroupItem value={option.option_value} id={option.id} className="w-4 h-4" />
                <Label htmlFor={option.id} className="text-base">{option.option_label}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.form_field_options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option.id}`}
                  checked={Array.isArray(value) && value.includes(option.option_value)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (checked) {
                      onChange(field.id, [...currentValues, option.option_value])
                    } else {
                      onChange(field.id, currentValues.filter(v => v !== option.option_value))
                    }
                  }}
                />
                <Label htmlFor={`${field.id}-${option.id}`} className="text-sm">
                  {option.option_label}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'radio_grid':
        return (
          <GridComponent
            field={field}
            value={value}
            onChange={(newValue) => onChange(field.id, newValue)}
            hasError={hasError}
            mode="radio"
          />
        )

      case 'checkbox_grid':
        return (
          <GridComponent
            field={field}
            value={value}
            onChange={(newValue) => onChange(field.id, newValue)}
            hasError={hasError}
            mode="checkbox"
          />
        )

      default:
        return (
          <Input
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required || false}
            className={`text-base ${errorClass}`}
          />
        )
    }
  }

  return (
    <div className="py-4">
      <div className="space-y-3">
        <Label 
          htmlFor={field.id} 
          className={`text-lg font-medium ${hasError ? 'text-red-600' : ''}`}
        >
          {field.field_label}
          {field.is_required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {field.help_text && (
          <p className="text-base text-muted-foreground whitespace-pre-wrap">{field.help_text}</p>
        )}
        
        {hasError && (
          <p className="text-sm text-red-600">此為必填字段，請填寫</p>
        )}
        
        <div className="mt-3">
          {renderFieldInput()}
        </div>
      </div>
    </div>
  )
} 