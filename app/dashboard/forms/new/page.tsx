"use client"

import type { FormCreateRequest, FormFieldCreateRequest, FormFieldOptionCreateRequest } from "@/app/api/types"
import { useAuth } from "@/components/auth-provider"
import { FIELD_TYPES } from "@/components/forms/form-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn, hasFormManagePermission } from "@/lib/utils"
import type { DraggableProvided, DropResult, DroppableProvided } from "@hello-pangea/dnd"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { format } from "date-fns"
import { ArrowLeft, CalendarIcon, Eye, GripVertical, Plus, Save, Send, Shield, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface FormFieldWithId extends FormFieldCreateRequest {
  tempId: string
  options?: FormFieldOptionWithId[]
}

interface FormFieldOptionWithId extends FormFieldOptionCreateRequest {
  tempId: string
}

interface RolePermission {
  role: string
  access_type: 'read' | 'edit' | null
}

const FORM_TYPES = [
  { value: 'registration', label: '報名表' },
  { value: 'profile', label: '個人資料' },
  { value: 'survey', label: '問卷調查' },
  { value: 'feedback', label: '意見回饋' },
  { value: 'application', label: '申請表' },
]

const ACCESS_TYPES = [
  { value: null, label: '無權限' },
  { value: 'read', label: '檢視' },
  { value: 'edit', label: '編輯' },
]

function PermissionsModal({ permissions, onPermissionsChange, roles }: { 
  permissions: RolePermission[]
  onPermissionsChange: (permissions: RolePermission[]) => void
  roles: { value: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [localPermissions, setLocalPermissions] = useState<RolePermission[]>(permissions)

  useEffect(() => {
    setLocalPermissions(permissions)
  }, [permissions])

  const updatePermission = (role: string, accessType: 'read' | 'edit' | null) => {
    setLocalPermissions(prev => 
      prev.map(p => 
        p.role === role ? { ...p, access_type: accessType } : p
      )
    )
  }

  const savePermissions = () => {
    onPermissionsChange(localPermissions)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Shield className="h-4 w-4 mr-2" />
          權限設定
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>權限設定</DialogTitle>
          <DialogDescription>
            設定表單的角色權限
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {localPermissions.map((permission) => {
            const roleLabel = roles.find(r => r.value === permission.role)?.label || permission.role
            const isAdminRole = ['admin', 'manager', 'root'].includes(permission.role)
            
            return (
              <div key={permission.role} className="flex items-center justify-between">
                <Label className="text-sm font-medium">{roleLabel}</Label>
                <Select
                  value={permission.access_type || 'null'}
                  onValueChange={(value) => 
                    !isAdminRole && updatePermission(permission.role, value === 'null' ? null : value as 'read' | 'edit')
                  }
                  disabled={isAdminRole}
                >
                  <SelectTrigger className={`w-32 ${isAdminRole ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_TYPES.map((type) => (
                      <SelectItem key={type.value || 'null'} value={type.value || 'null'}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
          
          <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/50 rounded">
            註：管理員角色（區域管理員、全域管理員、系統管理員）預設為編輯權限且無法修改
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={savePermissions}>
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function FormCreatePage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // 表單基本資訊
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formType, setFormType] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false)
  const [submissionDeadline, setSubmissionDeadline] = useState<Date | undefined>(undefined)
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([])
  
  // 表單欄位
  const [fields, setFields] = useState<FormFieldWithId[]>([])
  
  // 狀態管理
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // 載入角色列表
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetch('/api/roles')
        if (response.ok) {
          const result = await response.json()
          const rolesList = result.data.map((role: { name: string; display_name?: string }) => ({
            value: role.name,
            label: role.display_name || role.name
          }))
          setRoles(rolesList)
          // 設定權限預設值，管理員角色預設為編輯權限
          setPermissions(rolesList.map((role: { value: string; label: string }) => ({
            role: role.value,
            access_type: ['admin', 'manager', 'root'].includes(role.value) ? 'edit' as const : null
          })))
        }
      } catch (err) {
        console.error('Failed to load roles:', err)
        // 使用預設角色作為後備
        const defaultRoles = [
          { value: 'teacher', label: '大學伴' },
          { value: 'manager', label: '區域管理員' },
          { value: 'admin', label: '全域管理員' },
          { value: 'root', label: '系統管理員' }
        ]
        setRoles(defaultRoles)
        setPermissions(defaultRoles.map(role => ({
          role: role.value,
          access_type: ['admin', 'manager', 'root'].includes(role.value) ? 'edit' as const : null
        })))
      }
    }

    loadRoles()
  }, [])

  // 檢查用戶權限
  const hasCreatePermission = hasFormManagePermission(user?.role)

  if (!hasCreatePermission) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">新增表單</h1>
          <p className="text-muted-foreground mt-2">建立新的表單</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>您沒有權限建立表單</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 生成臨時 ID
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 生成隨機選項值
  const generateRandomOptionValue = () => `option_${Math.random().toString(36).substr(2, 6)}`

  // 添加新欄位
  const addField = () => {
    const newField: FormFieldWithId = {
      tempId: generateTempId(),
      field_name: '',
      field_label: '',
      field_type: 'text',
      display_order: fields.length,
      is_required: false,
      is_active: true,
      placeholder: '',
      help_text: '',
      options: [],
      grid_options: undefined
    }
    setFields([...fields, newField])
  }

  // 更新欄位
  const updateField = (tempId: string, updates: Partial<FormFieldWithId>) => {
    setFields(fields.map(field => 
      field.tempId === tempId ? { ...field, ...updates } : field
    ))
  }

  // 刪除欄位
  const removeField = (tempId: string) => {
    setFields(fields.filter(field => field.tempId !== tempId))
  }

  // 添加選項（用於 select, radio, checkbox）
  const addOption = (fieldTempId: string) => {
    const newOption: FormFieldOptionWithId = {
      tempId: generateTempId(),
      option_value: generateRandomOptionValue(),
      option_label: '',
      display_order: 0,
      is_active: true
    }
    
    updateField(fieldTempId, {
      options: [...(fields.find(f => f.tempId === fieldTempId)?.options || []), newOption]
    })
  }

  // 更新選項
  const updateOption = (fieldTempId: string, optionTempId: string, updates: Partial<FormFieldOptionWithId>) => {
    const field = fields.find(f => f.tempId === fieldTempId)
    if (!field) return

    const updatedOptions = field.options?.map(option =>
      option.tempId === optionTempId ? { ...option, ...updates } : option
    ) || []

    updateField(fieldTempId, { options: updatedOptions })
  }

  // 刪除選項
  const removeOption = (fieldTempId: string, optionTempId: string) => {
    const field = fields.find(f => f.tempId === fieldTempId)
    if (!field) return

    const updatedOptions = field.options?.filter(option => option.tempId !== optionTempId) || []
    updateField(fieldTempId, { options: updatedOptions })
  }

  // 拖拽排序
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // 更新 display_order
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }))

    setFields(updatedItems)
  }

  // 驗證表單
  const validateForm = () => {
    if (!title.trim()) {
      toast.error('請輸入表單標題')
      return false
    }
    if (!formType) {
      toast.error('請選擇表單類型')
      return false
    }

    // 驗證欄位
    for (const field of fields) {
      if (!field.field_label.trim()) {
        toast.error('所有欄位都必須有標題')
        return false
      }
      if (!field.field_name.trim()) {
        // 自動生成 field_name
        field.field_name = field.field_label.replace(/\s+/g, '_').toLowerCase()
      }

      // 驗證有選項的欄位
      if (['select', 'radio', 'checkbox'].includes(field.field_type)) {
        if (!field.options || field.options.length === 0) {
          toast.error(`欄位「${field.field_label}」需要至少一個選項`)
          return false
        }
        for (const option of field.options) {
          if (!option.option_label.trim()) {
            toast.error(`欄位「${field.field_label}」的所有選項都必須有標籤`)
            return false
          }
          // 選項值已經自動生成，不需要驗證
        }
      }

      // 驗證 grid 類型欄位
      if (['radio_grid', 'checkbox_grid'].includes(field.field_type)) {
        if (!field.grid_options || !field.grid_options.rows || !field.grid_options.columns) {
          toast.error(`欄位「${field.field_label}」需要配置行列選項`)
          return false
        }
        if (field.grid_options.rows.length === 0) {
          toast.error(`欄位「${field.field_label}」需要至少一個行`)
          return false
        }
        if (field.grid_options.columns.length === 0) {
          toast.error(`欄位「${field.field_label}」需要至少一個列`)
          return false
        }
        // 驗證行標籤
        for (const row of field.grid_options.rows) {
          if (!row.label.trim()) {
            toast.error(`欄位「${field.field_label}」的所有行都必須有標籤`)
            return false
          }
        }
        // 驗證列標籤
        for (const column of field.grid_options.columns) {
          if (!column.label.trim()) {
            toast.error(`欄位「${field.field_label}」的所有列都必須有標籤`)
            return false
          }
        }
      }
    }

    return true
  }

  // 創建表單的通用函數
  const createForm = async (status: 'draft' | 'active') => {
    if (!validateForm()) return null

    const formData: FormCreateRequest = {
      title,
      description,
      form_type: formType,
      status,
      is_required: isRequired,
      allow_multiple_submissions: allowMultipleSubmissions,
      submission_deadline: submissionDeadline ? submissionDeadline.toISOString() : undefined,
      fields: fields.map(field => {
        const mappedField = {
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          display_order: field.display_order,
          is_required: field.is_required,
          is_active: field.is_active,
          placeholder: field.placeholder,
          help_text: field.help_text,
          default_value: field.default_value,
          min_length: field.min_length,
          max_length: field.max_length,
          pattern: field.pattern,
          grid_options: field.grid_options,
          options: field.options?.map((option, index) => ({
            option_value: option.option_value,
            option_label: option.option_label,
            display_order: index,
            is_active: option.is_active
          }))
        }
        
        // 調試：檢查 grid 類型欄位的 grid_options
        if (['radio_grid', 'checkbox_grid'].includes(field.field_type)) {
          console.log('Grid field mapping:', {
            field_type: field.field_type,
            field_label: field.field_label,
            grid_options: field.grid_options,
            mapped_grid_options: mappedField.grid_options
          })
        }
        
        return mappedField
      })
    }

    console.log('Form data being sent to API:', JSON.stringify(formData, null, 2))

    const response = await fetch('/api/forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error('Failed to create form')
    }

    const result = await response.json()
    const formId = result.data.id

    // 設定權限
    const validPermissions = permissions.filter(p => p.access_type !== null)
    if (validPermissions.length > 0) {
      const permissionsResponse = await fetch(`/api/forms/${formId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (!permissionsResponse.ok) {
        console.warn('Failed to set permissions, but form was created')
      }
    }

    return formId
  }

  // 保存草稿
  const saveDraft = async () => {
    setSaving(true)
    try {
      const formId = await createForm('draft')
      if (formId) {
        toast.success('草稿已保存')
        router.push(`/dashboard/forms/${formId}/edit`)
      }
    } catch (err) {
      toast.error('保存草稿時發生錯誤')
      console.error('Error saving draft:', err)
    } finally {
      setSaving(false)
    }
  }

  // 發布表單
  const publishForm = async () => {
    setPublishing(true)
    try {
      const formId = await createForm('active')
      if (formId) {
        toast.success('表單已發布')
        router.push(`/dashboard/forms/${formId}`)
      }
    } catch (err) {
      toast.error('發布表單時發生錯誤')
      console.error('Error publishing form:', err)
    } finally {
      setPublishing(false)
    }
  }

  // 渲染欄位編輯器
  const renderFieldEditor = (field: FormFieldWithId, index: number) => {
    const needsOptions = ['select', 'multi-select', 'radio', 'checkbox'].includes(field.field_type)
    const needsGridOptions = ['radio_grid', 'checkbox_grid'].includes(field.field_type)

    return (
      <Draggable key={field.tempId} draggableId={field.tempId} index={index}>
        {(provided: DraggableProvided) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="mb-4"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div {...provided.dragHandleProps}>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </div>
                  <Badge variant="outline">
                    {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(field.tempId)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`field-label-${field.tempId}`}>欄位標題 *</Label>
                  <Input
                    id={`field-label-${field.tempId}`}
                    value={field.field_label}
                    onChange={(e) => updateField(field.tempId, { field_label: e.target.value })}
                    placeholder="請輸入欄位標題"
                  />
                </div>
                <div>
                  <Label htmlFor={`field-type-${field.tempId}`}>欄位類型</Label>
                  <Select
                    value={field.field_type}
                    onValueChange={(value) => {
                      const updates: Partial<FormFieldWithId> = { field_type: value }
                      
                      // 當切換到 grid 類型且沒有 grid_options 時，初始化
                      if (['radio_grid', 'checkbox_grid'].includes(value) && !field.grid_options) {
                        updates.grid_options = {
                          rows: [{ value: `row_${Date.now()}`, label: '' }],
                          columns: [{ value: `col_${Date.now()}`, label: '' }]
                        }
                      }
                      
                      updateField(field.tempId, updates)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* 基礎輸入 */}
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
                        基礎輸入
                      </div>
                      {FIELD_TYPES.filter(type => type.category === '基礎輸入').map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                      
                      {/* 專用格式 */}
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b mt-1">
                        專用格式
                      </div>
                      {FIELD_TYPES.filter(type => type.category === '專用格式').map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                      
                      {/* 選擇題型 */}
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b mt-1">
                        選擇題型
                      </div>
                      {FIELD_TYPES.filter(type => type.category === '選擇題型').map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                      
                      {/* 高級題型 */}
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b mt-1">
                        高級題型
                      </div>
                      {FIELD_TYPES.filter(type => type.category === '高級題型').map((type) => (
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

              {needsOptions && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>選項設定</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(field.tempId)}
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
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(field.tempId, option.tempId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {needsGridOptions && (
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
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
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
                        onClick={() => {
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
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
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
                        onClick={() => {
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

              <div>
                <Label htmlFor={`field-permissions-${field.tempId}`}>權限設定說明</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  {field.field_type === 'taiwan_id' && (
                    <p>此欄位將驗證台灣身分證字號格式（1個英文字母 + 9個數字）</p>
                  )}
                  {field.field_type === 'phone' && (
                    <p>此欄位將驗證手機號碼格式（09xx-xxx-xxx）</p>
                  )}
                  {field.field_type === 'multi-select' && (
                    <p>此欄位允許使用者選擇多個選項</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </Draggable>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/forms/manage">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">新增表單</h1>
            <p className="text-muted-foreground mt-2">建立新的表單</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? '編輯模式' : '預覽模式'}
          </Button>
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存草稿'}
          </Button>
          <Button
            onClick={publishForm}
            disabled={publishing}
          >
            <Send className="h-4 w-4 mr-2" />
            {publishing ? '發布中...' : '發布表單'}
          </Button>
        </div>
      </div>

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
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="請輸入表單標題"
                  />
                </div>

                <div>
                  <Label htmlFor="description">表單描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="請輸入表單描述"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="form-type">表單類型 *</Label>
                  <Select value={formType} onValueChange={setFormType}>
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
                  <Label>權限設定</Label>
                  <PermissionsModal 
                    permissions={permissions}
                    onPermissionsChange={setPermissions}
                    roles={roles}
                  />
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
                    <CardDescription>拖拽欄位來調整順序</CardDescription>
                  </div>
                  <Button onClick={addField}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增欄位
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>尚未新增任何欄位</p>
                    <Button onClick={addField} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      新增第一個欄位
                    </Button>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="fields">
                      {(provided: DroppableProvided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {fields.map((field, index) => renderFieldEditor(field, index))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* 預覽模式 */
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title || '未命名表單'}</CardTitle>
            {description && <CardDescription className="text-lg mt-2">{description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">表單尚未新增任何欄位</p>
              </div>
            ) : (
              fields.map((field) => (
                <Card key={field.tempId} className="p-4">
                  <div className="space-y-3">
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
                    {field.field_type === 'multi-select' && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border rounded-md bg-muted/30">
                          <span className="text-sm text-muted-foreground">已選擇的選項會顯示在這裡...</span>
                        </div>
                        <Select disabled>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder={field.placeholder || '點擊選擇多個選項'} />
                          </SelectTrigger>
                        </Select>
                      </div>
                    )}
                    {field.field_type === 'taiwan_id' && (
                      <Input 
                        placeholder={field.placeholder || 'A123456789'} 
                        disabled 
                        className="text-base" 
                      />
                    )}
                    {field.field_type === 'phone' && (
                      <Input 
                        placeholder={field.placeholder || '0912-345-678'} 
                        disabled 
                        className="text-base" 
                      />
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
                                          name={`preview_${field.tempId}_row_${idx}`}
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
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 