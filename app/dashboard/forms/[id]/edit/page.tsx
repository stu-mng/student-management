"use client"

import type { FormFieldWithId } from "@/components/forms"
import { FORM_TYPES, FormFieldCard, FormSectionEditor, FormSectionNavigation, PermissionsModal, useFormContext } from "@/components/forms"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { DroppableProvided } from "@hello-pangea/dnd"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { format } from "date-fns"
import { CalendarIcon, Eye, Pen, Plus, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

// 權限顯示組件
function PermissionsBadges({ permissions }: { permissions?: Array<{
  role: { name: string; display_name?: string | null };
  access_type: string | null;
}> }) {
  if (!permissions || permissions.length === 0) {
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        <Badge variant="outline" className="text-xs">
          <X className="h-3 w-3 mr-1" />
          無權限設定
        </Badge>
      </div>
    )
  }

  const getPermissionIcon = (accessType: string | null) => {
    switch (accessType) {
      case 'read':
        return <Eye className="h-3 w-3 mr-1" />
      case 'edit':
        return <Pen className="h-3 w-3 mr-1" />
      default:
        return <X className="h-3 w-3 mr-1" />
    }
  }

  const getPermissionColor = (accessType: string | null) => {
    switch (accessType) {
      case 'read':
        return "text-blue-600 border-blue-600"
      case 'edit':
        return "text-green-600 border-green-600"
      default:
        return "text-gray-400 border-gray-400"
    }
  }

  const validPermissions = permissions.filter(p => p.access_type !== null)
  
  if (validPermissions.length === 0) {
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        <Badge variant="outline" className="text-xs">
          <X className="h-3 w-3 mr-1" />
          無權限設定
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {validPermissions.map((permission) => {
        return (
          <Badge 
            key={permission.role.name} 
            variant="outline" 
            className={`text-xs ${getPermissionColor(permission.access_type)}`}
          >
            {getPermissionIcon(permission.access_type)}
            {permission.role.display_name || permission.role.name}
          </Badge>
        )
      })}
    </div>
  )
}

// 編輯頁面內容組件
function FormEditContent() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  
  const { 
    form, 
    loading, 
    error, 
    refetchForm, 
    hasEditPermission,
    // 編輯狀態
    title,
    description,
    formType,
    isRequired,
    allowMultipleSubmissions,
    submissionDeadline,
    sections,
    fields,
    previewMode,
    focusedFieldId,
    roles,
    // 編輯操作
    setTitle,
    setDescription,
    setFormType,
    setIsRequired,
    setAllowMultipleSubmissions,
    setSubmissionDeadline,
    setFocusedFieldId,
    // 分段操作
    addSection,
    updateSection,
    removeSection,
    // 欄位操作
    addField,
    updateField,
    removeField,
    onDragEnd,
    setPreviewMode,
  } = useFormContext()

  console.log(sections)
  console.log(fields)

  // 檢查用戶權限
  const hasEditPerm = hasEditPermission()

  // 處理新增區段並自動跳轉
  const handleAddSection = () => {
    addSection((newSectionIndex: number) => {
      setCurrentSectionIndex(newSectionIndex)
    })
  }

  // 處理段落切換
  const handleSectionChange = (index: number) => {
    if (index >= 0 && index < sections.length) {
      setCurrentSectionIndex(index)
    }
  }

  // 獲取當前段落的欄位
  const getCurrentSectionFields = () => {
    if (sections.length === 0) return fields
    
    const currentSection = sections[currentSectionIndex]
    if (!currentSection) return []
    
    return fields.filter(field => 
      field.form_section_id === currentSection.id || 
      field.form_section_id === currentSection.tempId ||
      (!field.form_section_id && currentSectionIndex === 0)
    )
  }

  const currentSectionFields = getCurrentSectionFields()

  // 處理權限更新
  const handlePermissionsUpdate = async () => {
    try {
      await refetchForm()
    } catch (error) {
      console.error('Failed to refetch form after permissions update:', error)
    }
  }

  if (!hasEditPerm) {
    return null
  }

  if (loading) {
    return null // Layout 會處理載入狀態
  }

  if (error) {
    return null // Layout 會處理錯誤狀態
  }

  if (!form) {
    return null
  }

  return (
    <div
      className="space-y-6"
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        if (target && target.closest('.form-field-card')) {
          return
        }
        setFocusedFieldId(null)
      }}
    >
      {!previewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 表單設定 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>表單設定</CardTitle>
                <CardDescription>設定表單的基本資訊</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">表單標題 *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                    }}
                    placeholder="請輸入表單標題"
                  />
                </div>

                <div>
                  <Label htmlFor="description">表單描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                    }}
                    placeholder="請輸入表單描述"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="form-type">表單類型 *</Label>
                  <Select value={formType} onValueChange={(value) => {
                    setFormType(value)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇表單類型" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>發布狀態</Label>
                  <div className="mt-2">
                    {form?.status === 'active' ? (
                      <Badge className="bg-green-100 hover:bg-green-100 text-green-800">
                        已發布
                      </Badge>
                    ) : form?.status === 'draft' ? (
                      <Badge variant="secondary">
                        未發布
                      </Badge>
                    ) : form?.status === 'archived' ? (
                      <Badge variant="outline">
                        已封存
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {form?.status || '未知'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label>權限設定</Label>
                  <PermissionsBadges permissions={form?.permissions} />
                  <div className="mt-2">
                    <PermissionsModal 
                      form={form} 
                      onPermissionsUpdate={handlePermissionsUpdate}
                      roles={roles}
                    />
                  </div>
                </div>

                <div>
                  <Label>截止日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !submissionDeadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {submissionDeadline ? format(submissionDeadline, "yyyy/MM/dd") : "選擇截止日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={submissionDeadline}
                        onSelect={setSubmissionDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="is-required">必填表單</Label>
                  <Switch
                    id="is-required"
                    checked={isRequired}
                    onCheckedChange={setIsRequired}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-multiple">允許多次提交</Label>
                  <Switch
                    id="allow-multiple"
                    checked={allowMultipleSubmissions}
                    onCheckedChange={setAllowMultipleSubmissions}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 表單編輯區 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Navigation */}
            {sections.length > 0 && (
              <FormSectionNavigation
                sections={sections}
                currentSectionIndex={currentSectionIndex}
                onSectionChange={handleSectionChange}
                onAddSection={handleAddSection}
                showAddButton={true}
              />
            )}

            {/* Section Editor - 只在有段落時顯示 */}
            {sections.length > 0 && sections[currentSectionIndex] && (
              <FormSectionEditor
                section={sections[currentSectionIndex]}
                sections={sections}
                onUpdate={(updates) => updateSection(sections[currentSectionIndex].tempId, updates)}
                onRemove={() => {
                  const currentSection = sections[currentSectionIndex]
                  removeSection(currentSection.tempId)
                  
                  // 刪除後調整當前索引
                  if (sections.length > 1) {
                    const newIndex = currentSectionIndex >= sections.length - 1 ? 
                      sections.length - 2 : currentSectionIndex
                    setCurrentSectionIndex(Math.max(0, newIndex))
                  } else {
                    setCurrentSectionIndex(0)
                  }
                }}
                canRemove={sections.length > 1}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>表單欄位編輯</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    預覽
                  </Button>
                </CardTitle>
                {sections.length > 0 && sections[currentSectionIndex] && (
                  <CardDescription>
                    編輯段落：{sections[currentSectionIndex].title || '未命名段落'}
                    {sections[currentSectionIndex].description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {sections[currentSectionIndex].description}
                      </div>
                    )}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {currentSectionFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-lg">此段落尚未新增任何欄位</p>
                    <p className="text-sm mt-2">點擊下方按鈕開始新增欄位</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="fields">
                      {(provided: DroppableProvided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {currentSectionFields.map((field, index) => (
                            <FormFieldCard
                              key={field.tempId}
                              field={field}
                              fieldIndex={index}
                              sections={sections}
                              form={form}
                              isFocused={focusedFieldId === field.tempId}
                              onFocus={() => setFocusedFieldId(field.tempId)}
                              onUpdate={(updates) => updateField(field.tempId, updates)}
                              onRemove={() => removeField(field.tempId)}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
                
                {/* 新增欄位按鈕 - 放在最下面 */}
                <div className="mt-4 pt-4 border-t border-dashed">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation()
                      const currentSection = sections[currentSectionIndex]
                      addField(currentSection?.tempId)
                    }} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新增欄位到{sections.length > 0 && sections[currentSectionIndex] ? 
                      (sections[currentSectionIndex].title || '當前段落') : '表單'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* 預覽模式 */
        <div className="space-y-6">
          {/* Section Navigation in Preview */}
          {sections.length > 0 && (
            <FormSectionNavigation
              sections={sections}
              currentSectionIndex={currentSectionIndex}
              onSectionChange={handleSectionChange}
              onAddSection={() => {}} // No add in preview
              showAddButton={false}
            />
          )}

          <Card>
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{title || '未命名表單'}</CardTitle>
                  {description && <CardDescription className="mt-2 whitespace-pre-line text-sm">{description}</CardDescription>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(false)}
                >
                  <Pen className="h-4 w-4 mr-2" />
                  編輯
                </Button>
              </div>
              {sections.length > 0 && sections[currentSectionIndex] && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium text-lg">
                    {sections[currentSectionIndex].title || '未命名段落'}
                  </h3>
                  {sections[currentSectionIndex].description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {sections[currentSectionIndex].description}
                    </p>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSectionFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-lg">此段落沒有欄位</p>
                </div>
              ) : (
                currentSectionFields.map((field: FormFieldWithId) => (
                  <div key={field.tempId} className="space-y-3 py-4 border-b border-gray-100 last:border-b-0">
                    <Label className="text-lg font-medium">
                      {field.field_label}
                      {field.is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.help_text && (
                      <p className="text-base text-muted-foreground">{field.help_text}</p>
                    )}
                    {field.help_image_url && (
                      <div>
                        <Image src={field.help_image_url} alt="說明圖片" width={800} height={450} className="h-auto max-h-56 w-auto rounded border" unoptimized />
                      </div>
                    )}
                    
                    {/* 根據欄位類型渲染預覽 */}
                    {field.field_type === 'text' && (
                      <Input placeholder={field.placeholder} disabled className="text-base" />
                    )}
                    {field.field_type === 'textarea' && (
                      <Textarea placeholder={field.placeholder} disabled rows={3} className="text-base" />
                    )}
                    {field.field_type === 'email' && (
                      <Input type="email" placeholder={field.placeholder} disabled className="text-base" />
                    )}
                    {field.field_type === 'number' && (
                      <Input type="number" placeholder={field.placeholder} disabled className="text-base" />
                    )}
                    {field.field_type === 'taiwan_id' && (
                      <Input placeholder={field.placeholder || '請輸入身分證字號'} disabled className="text-base" />
                    )}
                    {field.field_type === 'phone' && (
                      <Input placeholder={field.placeholder || '請輸入電話號碼'} disabled className="text-base" />
                    )}
                    {field.field_type === 'date' && (
                      <div className="border rounded-md p-3 bg-muted/30">
                        <div className="text-sm text-muted-foreground">日期選擇器預覽</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          支援西元年/民國年轉換
                        </div>
                      </div>
                    )}
                    {field.field_type === 'select' && (
                      <Select disabled>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder={field.placeholder || '請選擇'} />
                        </SelectTrigger>
                      </Select>
                    )}
                    {field.field_type === 'multi-select' && (
                      <div className="space-y-2">
                        <Select disabled>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder={field.placeholder || '點擊選擇選項'} />
                          </SelectTrigger>
                        </Select>
                        <div className="text-sm text-muted-foreground">
                          多選下拉選單預覽 ({field.options?.length || 0} 個選項)
                        </div>
                      </div>
                    )}
                    {field.field_type === 'radio' && (
                      <div className="space-y-3">
                        {field.options?.map((option) => (
                          <div key={option.tempId} className="flex items-center space-x-3">
                            <input type="radio" disabled className="w-4 h-4" />
                            <Label className="text-base">{option.option_label}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                    {field.field_type === 'checkbox' && (
                      <div className="space-y-3">
                        {field.options?.map((option) => (
                          <div key={option.tempId} className="flex items-center space-x-3">
                            <input type="checkbox" disabled className="w-4 h-4" />
                            <Label className="text-base">{option.option_label}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                    {field.field_type === 'radio_grid' && (
                      <div className="border rounded p-2">
                        <div className="text-sm text-gray-600 mb-2">單選方格預覽</div>
                        {field.grid_options?.rows && field.grid_options?.columns ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse text-sm">
                              <thead>
                                <tr>
                                  <th className="border border-gray-300 p-3 bg-gray-50 min-w-0 w-fit"></th>
                                  {field.grid_options.columns.map((col, idx) => (
                                    <th key={idx} className="border border-gray-300 p-3 bg-gray-50 whitespace-nowrap text-center font-medium min-w-[120px]">
                                      {col.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {field.grid_options.rows.map((row, idx) => (
                                  <tr key={idx}>
                                    <td className="border border-gray-300 p-3 bg-gray-50 whitespace-nowrap font-medium min-w-[150px]">
                                      {row.label}
                                    </td>
                                    {field.grid_options!.columns.map((col, colIdx) => (
                                      <td key={colIdx} className="border border-gray-300 p-3 text-center min-w-[120px]">
                                        <input 
                                          type="radio" 
                                          name={`${field.tempId}_row_${idx}`}
                                          value={col.value}
                                          disabled 
                                          className="w-4 h-4" 
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">請配置行列選項</div>
                        )}
                      </div>
                    )}
                    {field.field_type === 'checkbox_grid' && (
                      <div className="border rounded p-2">
                        <div className="text-sm text-gray-600 mb-2">核取方塊格預覽</div>
                        {field.grid_options?.rows && field.grid_options?.columns ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse text-sm">
                              <thead>
                                <tr>
                                  <th className="border border-gray-300 p-3 bg-gray-50 min-w-0 w-fit"></th>
                                  {field.grid_options.columns.map((col, idx) => (
                                    <th key={idx} className="border border-gray-300 p-3 bg-gray-50 whitespace-nowrap text-center font-medium min-w-[120px]">
                                      {col.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {field.grid_options.rows.map((row, idx) => (
                                  <tr key={idx}>
                                    <td className="border border-gray-300 p-3 bg-gray-50 whitespace-nowrap font-medium min-w-[150px]">
                                      {row.label}
                                    </td>
                                    {field.grid_options!.columns.map((col, colIdx) => (
                                      <td key={colIdx} className="border border-gray-300 p-3 text-center min-w-[120px]">
                                        <input type="checkbox" disabled className="w-4 h-4" />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">請配置行列選項</div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// 編輯頁面包裝組件，提供編輯特有的 context
export default function FormEditPage() {
  return <FormEditContent />
} 