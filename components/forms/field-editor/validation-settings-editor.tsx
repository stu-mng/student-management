"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { DateValidationRules, EmailValidationRules, FileValidationRules, NumberValidationRules } from "@/types"
import { CheckIcon, Plus, Trash2 } from "lucide-react"
import type { FormFieldWithId } from "../form-context"

interface FieldValidationEditorProps {
  field: FormFieldWithId
  onUpdate: (updates: Partial<FormFieldWithId>) => void
}

export function FieldValidationEditor({ field, onUpdate }: FieldValidationEditorProps) {
  const showValidationTabs = ['number', 'email', 'date', 'file_upload'].includes(field.field_type)

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

  if (field.field_type === 'file_upload') {
    const rules = (field.validation_rules as FileValidationRules | undefined) || { type: 'file' }
    const selectedExtensions = new Set(rules.allowedExtensions || [])

    // Common file type options
    const fileTypeOptions = [
      { value: '.pdf', label: 'PDF 文件' },
      { value: '.doc', label: 'Word 文件 (.doc)' },
      { value: '.docx', label: 'Word 文件 (.docx)' },
      { value: '.jpg', label: 'JPEG 圖片' },
      { value: '.jpeg', label: 'JPEG 圖片 (.jpeg)' },
      { value: '.png', label: 'PNG 圖片' },
      { value: '.gif', label: 'GIF 圖片' },
      { value: '.svg', label: 'SVG 圖片' },
      { value: '.bmp', label: 'BMP 圖片' },
      { value: '.webp', label: 'WebP 圖片' },
      { value: '.xls', label: 'Excel 文件 (.xls)' },
      { value: '.xlsx', label: 'Excel 文件 (.xlsx)' },
      { value: '.ppt', label: 'PowerPoint (.ppt)' },
      { value: '.pptx', label: 'PowerPoint (.pptx)' },
      { value: '.txt', label: '純文字檔案' },
      { value: '.rtf', label: 'RTF 文件' },
      { value: '.zip', label: 'ZIP 壓縮檔' },
      { value: '.rar', label: 'RAR 壓縮檔' },
      { value: '.7z', label: '7z 壓縮檔' },
      { value: '.mp4', label: 'MP4 影片' },
      { value: '.avi', label: 'AVI 影片' },
      { value: '.mov', label: 'MOV 影片' },
      { value: '.wmv', label: 'WMV 影片' },
      { value: '.mp3', label: 'MP3 音檔' },
      { value: '.wav', label: 'WAV 音檔' },
      { value: '.flac', label: 'FLAC 音檔' },
    ]

    const updateExtensions = (selectedValues: string[]) => {
      const next: FileValidationRules = {
        type: 'file',
        allowedExtensions: selectedValues.length > 0 ? selectedValues : undefined,
        maxFileSize: rules.maxFileSize,
      }
      onUpdate({ validation_rules: next })
    }

    return (
      <div className="space-y-4">
        <div>
          <Label>允許的檔案格式</Label>
          <p className="text-sm text-muted-foreground mb-3">選擇允許上傳的檔案類型</p>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                <Plus className="mr-2 h-4 w-4" />
                檔案格式
                {selectedExtensions.size > 0 && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                      {selectedExtensions.size}
                    </Badge>
                    <div className="hidden space-x-1 lg:flex">
                      {selectedExtensions.size > 2 ? (
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                          {selectedExtensions.size} 已選擇
                        </Badge>
                      ) : (
                        Array.from(selectedExtensions).map((ext) => (
                          <Badge variant="secondary" key={ext} className="rounded-sm px-1 font-normal">
                            {ext}
                          </Badge>
                        ))
                      )}
                    </div>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <Command>
                <CommandInput placeholder="搜尋檔案格式..." />
                <CommandList>
                  <CommandEmpty>沒有找到結果</CommandEmpty>
                  <CommandGroup>
                    {fileTypeOptions.map((option) => {
                      const isSelected = selectedExtensions.has(option.value)
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => {
                            const newSelected = new Set(selectedExtensions)
                            if (isSelected) {
                              newSelected.delete(option.value)
                            } else {
                              newSelected.add(option.value)
                            }
                            updateExtensions(Array.from(newSelected))
                          }}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                            )}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </div>
                          <span>{option.label}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  {selectedExtensions.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => updateExtensions([])}
                          className="justify-center text-center"
                        >
                          清除所有選擇
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <p className="text-xs text-muted-foreground mt-2">
            💡 如果沒有設定檔案格式，預設為無限制（允許所有檔案類型）
          </p>
        </div>

        <div>
          <Label>最大檔案大小 (MB)</Label>
          <Input
            type="number"
            value={rules.maxFileSize ? Math.round(rules.maxFileSize / (1024 * 1024)) : ''}
            onChange={(e) => {
              const mb = e.target.value === '' ? undefined : Number(e.target.value)
              const next: FileValidationRules = {
                type: 'file',
                allowedExtensions: rules.allowedExtensions,
                maxFileSize: mb ? mb * 1024 * 1024 : undefined,
              }
              onUpdate({ validation_rules: next })
            }}
            placeholder="20"
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">預設為 20MB</p>
        </div>
      </div>
    )
  }

  if (field.field_type === 'date') {
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
}


