"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FormFieldWithId, FormSectionWithId } from "../form-context"
import { FieldBasicEditor } from "./basic-settings-editor"
import { FieldValidationEditor } from "./validation-settings-editor"

interface FormFieldBuilderProps {
  field: FormFieldWithId
  sections: FormSectionWithId[]
  onUpdate: (updates: Partial<FormFieldWithId>) => void
}

export function FormFieldBuilder({ field, sections, onUpdate }: FormFieldBuilderProps) {
  const showValidationTabs = ['number', 'email', 'date'].includes(field.field_type)

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <Tabs defaultValue="basic" className="w-full" onClick={(e) => e.stopPropagation()}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger className="w-full" value="basic">基本</TabsTrigger>
          <TabsTrigger className="w-full" value="validation">驗證</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <FieldBasicEditor field={field} sections={sections} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          {/* Validation Rules (for number/email/date) */}
          {!showValidationTabs && (
            <div className="text-sm text-muted-foreground">此欄位類型沒有可設定的驗證規則</div>
          )}

          {showValidationTabs && (
            <FieldValidationEditor field={field} onUpdate={onUpdate} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}