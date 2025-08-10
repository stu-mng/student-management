"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import type { FormFieldWithId, FormSectionWithId } from "../form-context"
import { FIELD_TYPES } from "../form-context"
import { FieldOptionsEditor } from "./field-options-editor"
import { GridOptionsEditor } from "./grid-options-editor"

interface FieldBasicEditorProps {
  field: FormFieldWithId
  sections: FormSectionWithId[]
  onUpdate: (updates: Partial<FormFieldWithId>) => void
}

export function FieldBasicEditor({ field, sections, onUpdate }: FieldBasicEditorProps) {
  const needsOptions = ['radio', 'checkbox', 'select', 'multi-select'].includes(field.field_type)
  const needsGrid = ['radio_grid', 'checkbox_grid'].includes(field.field_type)

  return (
    <div className="space-y-4">
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
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                基礎輸入
              </div>
              {FIELD_TYPES.filter(type => type.category === '基礎輸入').map((type) => (
                <SelectItem key={type.value} value={type.value} className="pl-4">
                  {type.label}
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-2">
                專用格式
              </div>
              {FIELD_TYPES.filter(type => type.category === '專用格式').map((type) => (
                <SelectItem key={type.value} value={type.value} className="pl-4">
                  {type.label}
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-2">
                選擇題型
              </div>
              {FIELD_TYPES.filter(type => type.category === '選擇題型').map((type) => (
                <SelectItem key={type.value} value={type.value} className="pl-4">
                  {type.label}
                </SelectItem>
              ))}
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

      <div>
        <Label htmlFor={`help-image-${field.tempId}`}>說明圖片網址</Label>
        <Input
          id={`help-image-${field.tempId}`}
          value={field.help_image_url || ''}
          onChange={(e) => onUpdate({ help_image_url: e.target.value })}
          placeholder="輸入圖片 URL (僅支援網址)"
          type="url"
        />
        {field.help_image_url && (
          <div className="mt-2">
            <Image
              src={field.help_image_url}
              alt="說明圖片預覽"
              width={640}
              height={400}
              className="h-auto max-h-40 w-auto rounded border"
              unoptimized
            />
          </div>
        )}
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
        <FieldOptionsEditor field={field} sections={sections} onUpdate={onUpdate} />
      )}

      {needsGrid && (
        <GridOptionsEditor field={field} onUpdate={onUpdate} />
      )}
    </div>
  )
}


