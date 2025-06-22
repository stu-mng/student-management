"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GripVertical, Trash2 } from "lucide-react"
import type { FormSectionWithId } from "./form-context"
import { useFormContext } from "./form-context"

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
  const { fields } = useFormContext()
  
  // 計算將被刪除的欄位數量
  const fieldsToDelete = fields.filter(field => 
    field.form_section_id === section.id || 
    field.form_section_id === section.tempId ||
    (!field.form_section_id && section.order === 0)
  )
  
  const displayTitle = section.title || '未命名段落'
  const fieldCount = fieldsToDelete.length

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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確定要刪除段落嗎？</AlertDialogTitle>
                  <AlertDialogDescription>
                    您即將刪除段落「{displayTitle}」
                    {fieldCount > 0 && (
                      <>，此操作將同時刪除該段落下的 <strong>{fieldCount}</strong> 個欄位</>
                    )}
                    ，且無法復原。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove} className="bg-red-600 hover:bg-red-700">
                    確認刪除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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