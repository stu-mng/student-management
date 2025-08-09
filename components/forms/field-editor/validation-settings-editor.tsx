"use client"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { DateValidationRules, EmailValidationRules, NumberValidationRules } from "@/types"
import { Plus, Trash2 } from "lucide-react"
import type { FormFieldWithId } from "../form-context"

interface FieldValidationEditorProps {
  field: FormFieldWithId
  onUpdate: (updates: Partial<FormFieldWithId>) => void
}

export function FieldValidationEditor({ field, onUpdate }: FieldValidationEditorProps) {
  const showValidationTabs = ['number', 'email', 'date'].includes(field.field_type)

  if (!showValidationTabs) {
    return <div className="text-sm text-muted-foreground">此欄位類型沒有可設定的驗證規則</div>
  }

  if (field.field_type === 'number') {
    const rules = (field.validation_rules as NumberValidationRules | undefined) || { type: 'number' }
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`min-${field.tempId}`}>最小值</Label>
            <Input
              id={`min-${field.tempId}`}
              type="number"
              value={rules.min ?? ''}
              onChange={(e) => {
                const next: NumberValidationRules = {
                  ...rules,
                  min: e.target.value === '' ? undefined : Number(e.target.value),
                  type: 'number',
                }
                onUpdate({ validation_rules: next })
              }}
            />
          </div>
          <div>
            <Label htmlFor={`max-${field.tempId}`}>最大值</Label>
            <Input
              id={`max-${field.tempId}`}
              type="number"
              value={rules.max ?? ''}
              onChange={(e) => {
                const next: NumberValidationRules = {
                  ...rules,
                  max: e.target.value === '' ? undefined : Number(e.target.value),
                  type: 'number',
                }
                onUpdate({ validation_rules: next })
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`intOnly-${field.tempId}`}>僅允許整數</Label>
          <Switch
            id={`intOnly-${field.tempId}`}
            checked={rules.integerOnly ?? false}
            onCheckedChange={(checked) => {
              const next: NumberValidationRules = {
                ...rules,
                integerOnly: checked,
                type: 'number',
              }
              onUpdate({ validation_rules: next })
            }}
          />
        </div>
      </div>
    )
  }

  if (field.field_type === 'email') {
    const rules = (field.validation_rules as EmailValidationRules | undefined) || { type: 'email' }
    const domains = rules.allowedDomains && rules.allowedDomains.length > 0 ? rules.allowedDomains : []

    const updateDomains = (nextList: string[]) => {
      const trimmed = nextList.map(d => d.trim())
      const next: EmailValidationRules = {
        type: 'email',
        // 保留空字串作為暫存輸入，避免新增後立刻被清掉
        allowedDomains: trimmed.length > 0 ? trimmed : undefined,
      }
      onUpdate({ validation_rules: next })
    }

    return (
      <div className="space-y-3">
        <Label>允許網域</Label>
        <p className="text-sm text-muted-foreground">如果不限制網域，則不需設定</p>
        <div className="space-y-2">
          {domains.length === 0 && (
            <div className="text-sm text-muted-foreground">尚未設定網域，您可以新增一個或多個</div>
          )}
          {domains.map((domain, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder="例如：gmail.com"
                value={domain}
                onChange={(e) => {
                  const next = [...domains]
                  next[idx] = e.target.value
                  updateDomains(next)
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const next = domains.filter((_, i) => i !== idx)
                  updateDomains(next)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => updateDomains([...domains, ''])}
        >
          <Plus className="h-4 w-4 mr-2" /> 新增網域
        </Button>
      </div>
    )
  }

  // date
  const rules = (field.validation_rules as DateValidationRules | undefined) || { type: 'date' }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`mindate-${field.tempId}`}>最小日期</Label>
          <DatePicker
            value={rules.minDate ? new Date(rules.minDate) : undefined}
            onChange={(date) => {
              const toYMD = (d: Date | undefined) => {
                if (!d) return undefined
                const y = d.getFullYear()
                const m = String(d.getMonth() + 1).padStart(2, '0')
                const dd = String(d.getDate()).padStart(2, '0')
                return `${y}-${m}-${dd}`
              }
              const next: DateValidationRules = { ...rules, minDate: toYMD(date), type: 'date' }
              onUpdate({ validation_rules: next })
            }}
          />
        </div>
        <div>
          <Label htmlFor={`maxdate-${field.tempId}`}>最大日期</Label>
          <DatePicker
            value={rules.maxDate ? new Date(rules.maxDate) : undefined}
            onChange={(date) => {
              const toYMD = (d: Date | undefined) => {
                if (!d) return undefined
                const y = d.getFullYear()
                const m = String(d.getMonth() + 1).padStart(2, '0')
                const dd = String(d.getDate()).padStart(2, '0')
                return `${y}-${m}-${dd}`
              }
              const next: DateValidationRules = { ...rules, maxDate: toYMD(date), type: 'date' }
              onUpdate({ validation_rules: next })
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor={`nopast-${field.tempId}`}>不可為過去日期</Label>
          <Switch
            id={`nopast-${field.tempId}`}
            checked={rules.noPast ?? false}
            onCheckedChange={(checked) => {
              const next: DateValidationRules = { ...rules, noPast: checked, type: 'date' }
              onUpdate({ validation_rules: next })
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`nofuture-${field.tempId}`}>不可為未來日期</Label>
          <Switch
            id={`nofuture-${field.tempId}`}
            checked={rules.noFuture ?? false}
            onCheckedChange={(checked) => {
              const next: DateValidationRules = { ...rules, noFuture: checked, type: 'date' }
              onUpdate({ validation_rules: next })
            }}
          />
        </div>
      </div>
    </div>
  )
}


