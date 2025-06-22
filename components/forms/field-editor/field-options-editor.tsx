"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import type { FormFieldOptionWithId, FormFieldWithId } from "../form-context"

interface FieldOptionsEditorProps {
  field: FormFieldWithId
  onUpdate: (updates: Partial<FormFieldWithId>) => void
}

export function FieldOptionsEditor({ field, onUpdate }: FieldOptionsEditorProps) {
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
      <div className="space-y-2">
        {field.options?.map((option, index) => (
          <div key={option.tempId || index} className="flex items-center gap-2">
            <Input
              value={option.option_label}
              onChange={(e) => updateOption(index, { 
                option_label: e.target.value,
                option_value: e.target.value
              })}
              placeholder="選項文字"
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
        ))}
      </div>
    </div>
  )
} 