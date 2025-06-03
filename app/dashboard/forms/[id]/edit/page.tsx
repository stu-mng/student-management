"use client"

import { useAuth } from "@/components/auth-provider"
import type { FormFieldWithId } from "@/components/forms"
import { FIELD_TYPES, FORM_TYPES, PermissionsModal, useFormContext } from "@/components/forms"
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
import type { DraggableProvided, DroppableProvided } from "@hello-pangea/dnd"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { format } from "date-fns"
import { CalendarIcon, Eye, GripVertical, Pen, Plus, Trash2, X } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

// 權限顯示組件
function PermissionsBadges({ permissions }: { permissions?: any[] }) {
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
  const { user } = useAuth()
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
    // 欄位操作
    addField,
    updateField,
    removeField,
    addOption,
    updateOption,
    removeOption,
    onDragEnd,
  } = useFormContext()

  // 檢查用戶權限
  const hasEditPerm = hasEditPermission()

  // 處理權限更新
  const handlePermissionsUpdate = async () => {
    try {
      await refetchForm()
    } catch (error) {
      console.error('Failed to refetch form after permissions update:', error)
    }
  }

  // 渲染欄位編輯器
  const renderFieldEditor = (field: FormFieldWithId, index: number) => {
    const isFocused = focusedFieldId === field.tempId
    const needsOptions = ['select', 'radio', 'checkbox'].includes(field.field_type)
    const needsGridOptions = ['radio_grid', 'checkbox_grid'].includes(field.field_type)

    return (
      <Draggable key={field.tempId} draggableId={field.tempId} index={index}>
        {(provided: DraggableProvided) => (
          <Card 
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`border transition-all duration-200 cursor-pointer relative ${
              isFocused ? 'border-l-4 border-l-purple-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (!isFocused) {
                setFocusedFieldId(field.tempId)
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <Badge variant="outline" className="text-xs">
                    {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                  </Badge>
                  {field.is_required && (
                    <p className="text-red-500">*</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeField(field.tempId)
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 基本設定 - 始終顯示 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`field-label-${field.tempId}`}>欄位標題 *</Label>
                    <Input
                      id={`field-label-${field.tempId}`}
                      value={field.field_label}
                      onChange={(e) => updateField(field.tempId, { field_label: e.target.value })}
                      placeholder="請輸入欄位標題"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`field-type-${field.tempId}`}>欄位類型</Label>
                    <Select
                      value={field.field_type}
                      onValueChange={(value) => updateField(field.tempId, { field_type: value })}
                    >
                      <SelectTrigger onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`field-placeholder-${field.tempId}`}>提示文字</Label>
                  <Input
                    id={`field-placeholder-${field.tempId}`}
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(field.tempId, { placeholder: e.target.value })}
                    placeholder="請輸入提示文字"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <Label htmlFor={`field-help-${field.tempId}`}>說明文字</Label>
                  <Textarea
                    id={`field-help-${field.tempId}`}
                    value={field.help_text || ''}
                    onChange={(e) => updateField(field.tempId, { help_text: e.target.value })}
                    placeholder="請輸入說明文字"
                    rows={2}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`field-required-${field.tempId}`}
                    checked={field.is_required || false}
                    onCheckedChange={(checked) => updateField(field.tempId, { is_required: checked })}
                  />
                  <Label htmlFor={`field-required-${field.tempId}`}>必填欄位</Label>
                </div>

                {/* 選項設定 - 只在focused時顯示 */}
                {needsOptions && isFocused && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>選項設定</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          addOption(field.tempId)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        新增選項
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {field.options?.map((option) => (
                        <div key={option.tempId} className="flex items-center gap-2">
                          <Input
                            value={option.option_label}
                            onChange={(e) => updateOption(field.tempId, option.tempId, { option_label: e.target.value })}
                            placeholder="選項標籤"
                            className="flex-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeOption(field.tempId, option.tempId)
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid配置 - 只在focused時顯示 */}
                {needsGridOptions && isFocused && (
                  <div className="space-y-4">
                    <div>
                      <Label>行配置</Label>
                      <div className="space-y-2 mt-2">
                        {field.grid_options?.rows?.map((row, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={row.label}
                              onChange={(e) => {
                                const newRows = [...(field.grid_options?.rows || [])]
                                newRows[index] = { ...row, label: e.target.value }
                                updateField(field.tempId, { 
                                  grid_options: { 
                                    rows: newRows,
                                    columns: field.grid_options?.columns || []
                                  } 
                                })
                              }}
                              placeholder="行標籤"
                              className="flex-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                const newRows = [...(field.grid_options?.rows || [])]
                                newRows.splice(index, 1)
                                updateField(field.tempId, { 
                                  grid_options: { 
                                    rows: newRows,
                                    columns: field.grid_options?.columns || []
                                  } 
                                })
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )) || []}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newRows = [...(field.grid_options?.rows || []), { value: `row_${Date.now()}`, label: '' }]
                            updateField(field.tempId, { 
                              grid_options: { 
                                rows: newRows,
                                columns: field.grid_options?.columns || []
                              } 
                            })
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          新增行
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>列配置</Label>
                      <div className="space-y-2 mt-2">
                        {field.grid_options?.columns?.map((column, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={column.label}
                              onChange={(e) => {
                                const newColumns = [...(field.grid_options?.columns || [])]
                                newColumns[index] = { ...column, label: e.target.value }
                                updateField(field.tempId, { 
                                  grid_options: { 
                                    rows: field.grid_options?.rows || [],
                                    columns: newColumns 
                                  } 
                                })
                              }}
                              placeholder="列標籤"
                              className="flex-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                const newColumns = [...(field.grid_options?.columns || [])]
                                newColumns.splice(index, 1)
                                updateField(field.tempId, { 
                                  grid_options: { 
                                    rows: field.grid_options?.rows || [],
                                    columns: newColumns 
                                  } 
                                })
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )) || []}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newColumns = [...(field.grid_options?.columns || []), { value: `col_${Date.now()}`, label: '' }]
                            updateField(field.tempId, { 
                              grid_options: { 
                                rows: field.grid_options?.rows || [],
                                columns: newColumns 
                              } 
                            })
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          新增列
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </Draggable>
    )
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
    <div className="space-y-6" onClick={() => setFocusedFieldId(null)}>
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

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={isRequired}
                      onCheckedChange={setIsRequired}
                    />
                    <Label htmlFor="required">必填表單</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="multiple"
                      checked={allowMultipleSubmissions}
                      onCheckedChange={setAllowMultipleSubmissions}
                    />
                    <Label htmlFor="multiple">允許多次提交</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 表單欄位編輯 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>表單欄位</CardTitle>
                    <CardDescription>點擊欄位來編輯，拖拽來調整順序</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>尚未新增任何欄位</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="fields">
                      {(provided: DroppableProvided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {fields.map((field, index) => renderFieldEditor(field, index))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
                
                {/* 新增欄位按鈕 - 放在最下面 */}
                <div className="mt-4 pt-4 border-t border-dashed">
                  <Button 
                    onClick={() => addField()} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新增欄位
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* 預覽模式 */
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title || '未命名表單'}</CardTitle>
            {description && <CardDescription className="text-lg mt-2 whitespace-pre-line text-sm">{description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">表單尚未新增任何欄位</p>
              </div>
            ) : (
              fields.map((field: FormFieldWithId) => (
                <div key={field.tempId} className="space-y-3 py-4 border-b border-gray-100 last:border-b-0">
                  <Label className="text-lg font-medium">
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.help_text && (
                    <p className="text-base text-muted-foreground">{field.help_text}</p>
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
                  {field.field_type === 'select' && (
                    <Select disabled>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder={field.placeholder || '請選擇'} />
                      </SelectTrigger>
                    </Select>
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
      )}
    </div>
  )
}

// 編輯頁面包裝組件，提供編輯特有的 context
export default function FormEditPage() {
  return <FormEditContent />
} 