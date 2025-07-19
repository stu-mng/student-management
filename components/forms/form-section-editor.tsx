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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, GripVertical, Trash2 } from "lucide-react"
import type { FormSectionWithId } from "./form-context"
import { useFormContext } from "./form-context"

interface FormSectionEditorProps {
  section: FormSectionWithId
  sections: FormSectionWithId[]
  onUpdate: (updates: Partial<FormSectionWithId>) => void
  onRemove: () => void
  canRemove?: boolean
  className?: string
}

export function FormSectionEditor({
  section,
  sections,
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
  
  // 獲取當前區段中設定了跳轉的欄位 - 使用 context 中的 fields 而不是 section.fields
  const sectionFields = fields.filter(field => 
    field.form_section_id === section.id || 
    field.form_section_id === section.tempId ||
    (!field.form_section_id && section.order === 0)
  )
  const fieldsWithJumps = sectionFields.filter(field => 
    (field.field_type === 'radio' || field.field_type === 'select') &&
    field.options?.some(option => option.jump_to_section_id)
  )
  
  const displayTitle = section.title || '未命名段落'
  const fieldCount = fieldsToDelete.length

  // 獲取跳轉目標區段的標題
  const getTargetSectionTitle = (sectionId: string) => {
    const targetSection = sections.find(s => {
      if (s.tempId.startsWith('existing_')) {
        return s.id === sectionId
      } 
      return s.tempId === sectionId
    })
    return targetSection?.title || '未命名區段'
  }

  return (
    <div className="space-y-4">
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

      {/* 跳轉邏輯顯示 */}
      {fieldsWithJumps.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              跳轉邏輯設定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fieldsWithJumps.map((field) => (
                <div key={field.tempId} className="bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{field.field_label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      ({field.field_type === 'radio' ? '單選題' : '下拉選單'})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {field.options?.filter(option => option.jump_to_section_id).map((option) => (
                      <div key={option.tempId} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">選擇</span>
                        <Badge variant="outline">{option.option_label}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">跳轉至</span>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          {getTargetSectionTitle(option.jump_to_section_id!)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                ⚠️ 每個區段只能有一個欄位設定跳轉邏輯，以避免邏輯衝突。
                當用戶選擇設定了跳轉的選項時，將直接跳轉到指定區段，否則將按順序進入下一個區段。
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 