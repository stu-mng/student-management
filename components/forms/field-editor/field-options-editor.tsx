"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import type { FormFieldOptionWithId, FormFieldWithId, FormSectionWithId } from "../form-context"

interface FieldOptionsEditorProps {
  field: FormFieldWithId
  sections: FormSectionWithId[]
  onUpdate: (updates: Partial<FormFieldWithId>) => void
}

export function FieldOptionsEditor({ field, sections, onUpdate }: FieldOptionsEditorProps) {
  // 檢查是否支援跳轉功能
  const supportsJumping = field.field_type === 'radio' || field.field_type === 'select'
  
  // 檢查當前區段是否已有其他欄位設定了跳轉
  const currentSection = sections.find(s => s.fields?.some(f => f.tempId === field.tempId))
  const hasOtherFieldWithJump = currentSection?.fields?.some(f => 
    f.tempId !== field.tempId && 
    f.options?.some(opt => opt.jump_to_section_id)
  )

  const addOption = () => {
    const newOption: FormFieldOptionWithId = {
      tempId: `option-${Date.now()}`,
      option_label: '',
      option_value: '',
      display_order: field.options?.length || 0,
      is_active: true
    }
    onUpdate({
      options: [...(field.options || []), newOption]
    })
  }

  const updateOption = (index: number, updates: Partial<FormFieldOptionWithId>) => {
    const newOptions = [...(field.options || [])]
    newOptions[index] = { ...newOptions[index], ...updates }
    onUpdate({ options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || []
    onUpdate({ options: newOptions })
  }

  // 獲取可選的目標區段（排除當前區段）
  const getAvailableSections = () => {
    return sections.filter(section => section.tempId !== currentSection?.tempId)
  }

  // 取得選項的跳轉值，優先使用 section.id，沒有則使用 tempId
  const getSelectValue = (jumpToSectionId?: string) => {
    if (!jumpToSectionId) return "no-jump"
    
    // 檢查是否匹配任何可用區段的 ID 或 tempId
    const availableSections = getAvailableSections()
    const matchingSection = availableSections.find(s => 
      s.id === jumpToSectionId || s.tempId === jumpToSectionId
    )
    
    if (matchingSection) {
      return matchingSection.id || matchingSection.tempId
    }
    
    return jumpToSectionId
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>選項設定</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
        >
          <Plus className="h-4 w-4 mr-1" />
          新增選項
        </Button>
      </div>
      
      {supportsJumping && hasOtherFieldWithJump && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ 此區段已有其他欄位設定了跳轉功能，每個區段只能有一個欄位設定跳轉以避免衝突。
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {field.options?.map((option, index) => (
          <div key={option.tempId || index} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={option.option_label}
                onChange={(e) => updateOption(index, { 
                  option_label: e.target.value,
                  option_value: e.target.value
                })}
                placeholder="選項文字"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {supportsJumping && !hasOtherFieldWithJump && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  跳轉區段 (選擇此選項後將跳轉到指定區段)
                </Label>
                <Select
                  value={getSelectValue(option.jump_to_section_id)}
                  onValueChange={(value) => updateOption(index, { 
                    jump_to_section_id: value === "no-jump" ? undefined : value 
                  })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="選擇跳轉區段 (可選)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-jump">不跳轉 (預設下一區段)</SelectItem>
                    {getAvailableSections().map((section) => (
                      <SelectItem key={section.tempId} value={section.id || section.tempId}>
                        {section.title || '未命名區段'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 