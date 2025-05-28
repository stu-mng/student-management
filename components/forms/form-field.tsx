"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card } from "@/components/ui/card"
import { FormField, FormFieldOption } from "@/app/api/types"

interface FormFieldComponentProps {
  field: FormField
  value: any
  onChange: (fieldId: string, value: any) => void
  hasError?: boolean
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
        const checkboxValues = Array.isArray(fieldValue) ? fieldValue : []
        return (
          <div className={`space-y-3 ${hasError ? 'border border-red-500 rounded p-3' : ''}`}>
            {field.form_field_options?.map((option: FormFieldOption) => (
              <div key={option.id} className="flex items-center space-x-3">
                <Checkbox
                  id={option.id}
                  checked={checkboxValues.includes(option.option_value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...checkboxValues, option.option_value]
                      : checkboxValues.filter(v => v !== option.option_value)
                    onChange(field.id, newValues)
                  }}
                  className="w-4 h-4"
                />
                <Label htmlFor={option.id} className="text-base">{option.option_label}</Label>
              </div>
            ))}
          </div>
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
    <Card className="p-4">
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
    </Card>
  )
} 