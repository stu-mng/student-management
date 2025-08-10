"use client"

import type { FormField, FormFieldOption } from "@/app/api/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DateValidationRules, EmailValidationRules, FormFieldValidationRules, NumberValidationRules } from "@/types"
import { X } from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"

// 台灣身分證字號驗證函數
const validateTaiwanId = (id: string): boolean => {
  // 檢查格式：1個英文字母 + 9個數字
  const idRegex = /^[A-Z][0-9]{9}$/
  if (!idRegex.test(id)) {
    return false
  }

  // 英文字母對應數字表
  const letterToNumber: { [key: string]: number } = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18,
    K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27,
    U: 28, V: 29, W: 30, X: 31, Y: 32, Z: 33
  }

  const firstLetter = id.charAt(0)
  const letterNumber = letterToNumber[firstLetter]
  
  // 將英文字母轉換為兩位數字
  const firstDigit = Math.floor(letterNumber / 10)
  const secondDigit = letterNumber % 10

  // 取得後面的9個數字
  const digits = id.substring(1).split('').map(Number)

  // 計算檢查碼
  let sum = firstDigit * 1 + secondDigit * 9
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (8 - i)
  }

  const remainder = sum % 10
  const checkDigit = remainder === 0 ? 0 : 10 - remainder

  return checkDigit === digits[8]
}

// 台灣手機號碼驗證函數
const validatePhoneNumber = (phone: string): boolean => {
  // 檢查格式：09xx-xxx-xxx
  const phoneRegex = /^09\d{2}-\d{3}-\d{3}$/
  return phoneRegex.test(phone)
}

// Email 格式驗證函數
const validateEmail = (email: string): boolean => {
  // 基本 Email 格式驗證：必須包含 @ 符號，且 @ 前後都有內容
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface FormFieldComponentProps {
  field: FormField
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (fieldId: string, value: any) => void
  hasError?: boolean
}

// Grid組件
interface GridComponentProps {
  field: FormField
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const fieldValue = value || ''
  const errorClass = hasError ? 'border-red-500 focus:border-red-500' : ''
  const [multiSelectOpen, setMultiSelectOpen] = useState(false)

  // Extract typed validation rules
  const validationRules = (field.validation_rules as unknown as FormFieldValidationRules | undefined)
  const numberRules = useMemo(() => (validationRules && validationRules.type === 'number' ? (validationRules as NumberValidationRules) : undefined), [validationRules])
  const emailRules = useMemo(() => (validationRules && validationRules.type === 'email' ? (validationRules as EmailValidationRules) : undefined), [validationRules])
  const dateRules = useMemo(() => (validationRules && validationRules.type === 'date' ? (validationRules as DateValidationRules) : undefined), [validationRules])

  const renderFieldInput = () => {
    switch (field.field_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required || false}
            className={`text-base ${errorClass}`}
          />
        )

      case 'email':
        return (
          <div className="space-y-2">
            <Input
              type="email"
              value={fieldValue}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder || 'example@email.com'}
              required={field.is_required || false}
              className={`text-base ${errorClass}`}
            />
            {fieldValue && (!validateEmail(fieldValue) || (emailRules?.allowedDomains && !emailRules.allowedDomains.some(d => fieldValue.toLowerCase().endsWith(`@${d.toLowerCase()}`)))) && (
              <p className="text-sm text-red-600">
                {!validateEmail(fieldValue)
                  ? '電子郵件格式不正確（必須包含 @ 符號）'
                  : `僅允許以下網域：${emailRules?.allowedDomains?.join('、')}`}
              </p>
            )}
          </div>
        )

      case 'taiwan_id':
        return (
          <div className="space-y-2">
            <Input
              type="text"
              value={fieldValue}
              onChange={(e) => {
                const value = e.target.value.toUpperCase()
                onChange(field.id, value)
              }}
              placeholder={field.placeholder || 'A123456789'}
              required={field.is_required || false}
              className={`text-base ${errorClass}`}
              maxLength={10}
            />
            {fieldValue && !validateTaiwanId(fieldValue) && (
              <p className="text-sm text-red-600">身分證字號格式不正確</p>
            )}
          </div>
        )

      case 'phone':
        return (
          <div className="space-y-2">
            <Input
              type="text"
              value={fieldValue}
              onChange={(e) => {
                let value = e.target.value.replace(/[^\d]/g, '') // 只保留數字
                // 自動格式化：09xx-xxx-xxx
                if (value.length > 4) {
                  value = value.slice(0, 4) + '-' + value.slice(4)
                }
                if (value.length > 8) {
                  value = value.slice(0, 8) + '-' + value.slice(8, 11)
                }
                onChange(field.id, value)
              }}
              placeholder={field.placeholder || '0912-345-678'}
              required={field.is_required || false}
              className={`text-base ${errorClass}`}
              maxLength={12}
            />
            {fieldValue && !validatePhoneNumber(fieldValue) && (
              <p className="text-sm text-red-600">手機號碼格式不正確（應為 09xx-xxx-xxx）</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              value={fieldValue}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              required={field.is_required || false}
              className={`text-base ${errorClass}`}
            />
            {(() => {
              if (fieldValue === '') return null
              const n = Number(fieldValue)
              if (Number.isNaN(n)) return <p className="text-sm text-red-600">必須為數字</p>
              if (numberRules?.integerOnly && !Number.isInteger(n)) return <p className="text-sm text-red-600">必須為整數</p>
              if (typeof numberRules?.min === 'number' && n < numberRules.min) return <p className="text-sm text-red-600">不得小於 {numberRules.min}</p>
              if (typeof numberRules?.max === 'number' && n > numberRules.max) return <p className="text-sm text-red-600">不得大於 {numberRules.max}</p>
              return null
            })()}
          </div>
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

      case 'date':
        return (
          <div className="space-y-2">
            <DatePicker
              value={fieldValue ? new Date(fieldValue) : undefined}
              onChange={(date) => onChange(field.id, date?.toISOString() || '')}
              placeholder={field.placeholder || '請選擇日期'}
              disabled={false}
              className={errorClass}
            />
            {(() => {
              if (!fieldValue) return null
              const d = new Date(fieldValue)
              if (Number.isNaN(d.getTime())) return <p className="text-sm text-red-600">無效的日期</p>
              const today = new Date()
              const toYMD = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
              const dY = toYMD(d).getTime()
              if (dateRules?.noPast && dY < toYMD(today).getTime()) return <p className="text-sm text-red-600">不可為過去日期</p>
              if (dateRules?.noFuture && dY > toYMD(today).getTime()) return <p className="text-sm text-red-600">不可為未來日期</p>
              if (dateRules?.minDate) {
                const min = toYMD(new Date(dateRules.minDate)).getTime()
                if (dY < min) return <p className="text-sm text-red-600">日期不得早於 {dateRules.minDate}</p>
              }
              if (dateRules?.maxDate) {
                const max = toYMD(new Date(dateRules.maxDate)).getTime()
                if (dY > max) return <p className="text-sm text-red-600">日期不得晚於 {dateRules.maxDate}</p>
              }
              return null
            })()}
          </div>
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

      case 'multi-select': {
        const selectedValues = Array.isArray(value) ? value : []
        const availableOptions = field.form_field_options?.filter(
          option => !selectedValues.includes(option.option_value)
        ) || []
        
        return (
          <div className="space-y-2">
            {/* 已選擇的標籤 */}
            <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border rounded-md bg-muted/30">
              {selectedValues.length === 0 ? (
                <span className="text-sm text-muted-foreground">尚未選擇任何選項</span>
              ) : (
                selectedValues.map((selectedValue: string) => {
                  const option = field.form_field_options?.find(opt => opt.option_value === selectedValue)
                  return (
                    <Badge key={selectedValue} variant="secondary" className="group cursor-pointer">
                      <span className="mr-1">{option?.option_label || selectedValue}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newValues = selectedValues.filter(v => v !== selectedValue)
                          onChange(field.id, newValues)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )
                })
              )}
            </div>
            
            {/* 選項下拉選單 */}
            {availableOptions.length > 0 && (
              <Select
                open={multiSelectOpen}
                onOpenChange={setMultiSelectOpen}
                onValueChange={(val) => {
                  const newValues = [...selectedValues, val]
                  onChange(field.id, newValues)
                  setMultiSelectOpen(false)
                }}
              >
                <SelectTrigger className={`text-base ${errorClass}`}>
                  <SelectValue placeholder={field.placeholder || '點擊選擇選項'} />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.map((option: FormFieldOption) => (
                    <SelectItem key={option.id} value={option.option_value} className="text-base">
                      {option.option_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {availableOptions.length === 0 && selectedValues.length > 0 && (
              <p className="text-sm text-muted-foreground">所有選項都已選擇</p>
            )}
          </div>
        )
      }

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

        {field.help_image_url && (
          <div>
            <Image src={field.help_image_url} alt="說明圖片" width={800} height={450} className="h-auto max-h-56 w-auto rounded border" unoptimized />
          </div>
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