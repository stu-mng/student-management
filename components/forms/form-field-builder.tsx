"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import type { FormFieldWithId } from "./form-context"
import { FIELD_TYPES } from "./form-context"

interface FormFieldBuilderProps {
  field: FormFieldWithId
  onUpdate: (updates: Partial<FormFieldWithId>) => void
}

export function FormFieldBuilder({ field, onUpdate }: FormFieldBuilderProps) {
  const addOption = () => {
    const newOption = {
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

  const updateOption = (index: number, updates: any) => {
    const newOptions = [...(field.options || [])]
    newOptions[index] = { ...newOptions[index], ...updates }
    onUpdate({ options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || []
    onUpdate({ options: newOptions })
  }

  const addGridRow = () => {
    const newRow = { label: '', value: `row-${Date.now()}` }
    onUpdate({
      grid_options: {
        rows: [...(field.grid_options?.rows || []), newRow],
        columns: field.grid_options?.columns || []
      }
    })
  }

  const addGridColumn = () => {
    const newColumn = { label: '', value: `col-${Date.now()}` }
    onUpdate({
      grid_options: {
        rows: field.grid_options?.rows || [],
        columns: [...(field.grid_options?.columns || []), newColumn]
      }
    })
  }

  const updateGridRow = (index: number, updates: any) => {
    const newRows = [...(field.grid_options?.rows || [])]
    newRows[index] = { ...newRows[index], ...updates }
    onUpdate({
      grid_options: { 
        rows: newRows,
        columns: field.grid_options?.columns || []
      }
    })
  }

  const updateGridColumn = (index: number, updates: any) => {
    const newColumns = [...(field.grid_options?.columns || [])]
    newColumns[index] = { ...newColumns[index], ...updates }
    onUpdate({
      grid_options: { 
        rows: field.grid_options?.rows || [],
        columns: newColumns
      }
    })
  }

  const removeGridRow = (index: number) => {
    const newRows = field.grid_options?.rows?.filter((_, i) => i !== index) || []
    onUpdate({
      grid_options: { 
        rows: newRows,
        columns: field.grid_options?.columns || []
      }
    })
  }

  const removeGridColumn = (index: number) => {
    const newColumns = field.grid_options?.columns?.filter((_, i) => i !== index) || []
    onUpdate({
      grid_options: { 
        rows: field.grid_options?.rows || [],
        columns: newColumns
      }
    })
  }

  const needsOptions = ['radio', 'checkbox', 'select', 'multiselect'].includes(field.field_type)
  const needsGrid = ['radio_grid', 'checkbox_grid'].includes(field.field_type)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">欄位設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`label-${field.tempId}`}>欄位標籤 *</Label>
            <Input
              id={`label-${field.tempId}`}
              value={field.field_label}
              onChange={(e) => onUpdate({ 
                field_label: e.target.value,
                field_name: e.target.value.toLowerCase().replace(/\s+/g, '_')
              })}
              placeholder="輸入欄位標籤"
            />
          </div>
          <div>
            <Label htmlFor={`type-${field.tempId}`}>欄位類型</Label>
            <Select
              value={field.field_type}
              onValueChange={(value) => onUpdate({ field_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* 基礎輸入 */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                  基礎輸入
                </div>
                {FIELD_TYPES.filter(type => type.category === '基礎輸入').map((type) => (
                  <SelectItem key={type.value} value={type.value} className="pl-4">
                    {type.label}
                  </SelectItem>
                ))}
                
                {/* 專用格式 */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-2">
                  專用格式
                </div>
                {FIELD_TYPES.filter(type => type.category === '專用格式').map((type) => (
                  <SelectItem key={type.value} value={type.value} className="pl-4">
                    {type.label}
                  </SelectItem>
                ))}
                
                {/* 選擇題型 */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-2">
                  選擇題型
                </div>
                {FIELD_TYPES.filter(type => type.category === '選擇題型').map((type) => (
                  <SelectItem key={type.value} value={type.value} className="pl-4">
                    {type.label}
                  </SelectItem>
                ))}
                
                {/* 高級題型 */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-2">
                  高級題型
                </div>
                {FIELD_TYPES.filter(type => type.category === '高級題型').map((type) => (
                  <SelectItem key={type.value} value={type.value} className="pl-4">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor={`placeholder-${field.tempId}`}>提示文字</Label>
          <Input
            id={`placeholder-${field.tempId}`}
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="輸入提示文字"
          />
        </div>

        <div>
          <Label htmlFor={`help-${field.tempId}`}>說明文字</Label>
          <Textarea
            id={`help-${field.tempId}`}
            value={field.help_text || ''}
            onChange={(e) => onUpdate({ help_text: e.target.value })}
            placeholder="輸入說明文字"
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor={`required-${field.tempId}`}>必填欄位</Label>
          <Switch
            id={`required-${field.tempId}`}
            checked={field.is_required || false}
            onCheckedChange={(checked) => onUpdate({ is_required: checked })}
          />
        </div>

        {needsOptions && (
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
        )}

        {needsGrid && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>列設定</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGridRow}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  新增列
                </Button>
              </div>
              <div className="space-y-2">
                {field.grid_options?.rows?.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={row.label}
                      onChange={(e) => updateGridRow(index, { 
                        label: e.target.value,
                        value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      })}
                      placeholder="列標題"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGridRow(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>欄設定</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGridColumn}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  新增欄
                </Button>
              </div>
              <div className="space-y-2">
                {field.grid_options?.columns?.map((column, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={column.label}
                      onChange={(e) => updateGridColumn(index, { 
                        label: e.target.value,
                        value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      })}
                      placeholder="欄標題"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGridColumn(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 