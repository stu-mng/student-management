"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GripVertical, Trash2 } from "lucide-react"
import type { FormSectionWithId } from "./form-context"

interface FormSectionEditorProps {
  section: FormSectionWithId
  onUpdate: (updates: Partial<FormSectionWithId>) => void
  onRemove: () => void
  canRemove?: boolean
  className?: string
}

export function FormSectionEditor({
  section,
  onUpdate,
  onRemove,
  canRemove = true,
  className = ""
}: FormSectionEditorProps) {
  return (
    <Card className={`${className} border-dashed border-2 border-blue-200 bg-blue-50/30`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-sm font-medium text-blue-700">
              區段設定
            </CardTitle>
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`section-title-${section.tempId}`}>
            區段標題
          </Label>
          <Input
            id={`section-title-${section.tempId}`}
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="請輸入區段標題（可選）"
          />
        </div>
        
        <div>
          <Label htmlFor={`section-description-${section.tempId}`}>
            區段描述
          </Label>
          <Textarea
            id={`section-description-${section.tempId}`}
            value={section.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="請輸入區段描述（可選）"
            rows={2}
          />
        </div>
        
        <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
          提示：區段用於將表單欄位分組顯示，每個區段就是一頁。如果不設定標題和描述，此區段將不會顯示導航資訊。
        </div>
      </CardContent>
    </Card>
  )
} 