"use client"

import { useAuth } from "@/components/auth-provider"
import type { FormFieldWithId, FormSectionWithId } from "@/components/forms"
import { FORM_TYPES, FormCreatePermissionsModal, FormFieldCard, FormProvider, FormSectionEditor, FormSectionNavigation } from "@/components/forms"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { hasFormManagePermission } from "@/lib/utils"
import type { DroppableProvided, DropResult } from "@hello-pangea/dnd"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { Plus } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface RolePermission {
  role: string
  access_type: 'read' | 'edit' | null
}

function FormCreateContent() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Form basic info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formType, setFormType] = useState('')
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false)
  const [submissionDeadline, setSubmissionDeadline] = useState('')
  
  // Sections and fields
  const [sections, setSections] = useState<FormSectionWithId[]>([])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  
  // Permissions
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([])
  
  // UI state
  const [isPreview, setIsPreview] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null)

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetch('/api/roles')
        if (response.ok) {
          const data = await response.json()
          setRoles(data.roles || [])
          
          // Initialize permissions for all roles
          const initialPermissions = (data.roles || []).map((role: { value: string; label: string }) => ({
            role: role.value,
            access_type: ['admin', 'manager', 'root'].includes(role.value) ? 'edit' as const : null
          }))
          setPermissions(initialPermissions)
        }
      } catch (error) {
        console.error('Failed to load roles:', error)
      }
    }
    
    loadRoles()
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!title.trim()) {
      newErrors.title = '表單標題為必填'
    }
    
    if (!formType) {
      newErrors.formType = '表單類型為必填'
    }
    
    if (sections.length === 0) {
      newErrors.sections = '至少需要一個段落'
    }
    
    sections.forEach((section, sectionIndex) => {
      if (!section.fields || section.fields.length === 0) {
        newErrors[`section-${sectionIndex}-fields`] = `段落 ${sectionIndex + 1} 至少需要一個欄位`
      }
      
      section.fields?.forEach((field, fieldIndex) => {
        if (!field.field_label.trim()) {
          newErrors[`section-${sectionIndex}-field-${fieldIndex}-label`] = '欄位標籤為必填'
        }
      })
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      // 計算全域 display_order
      let globalDisplayOrder = 0
      
      const formData = {
        title,
        description,
        form_type: formType,
        is_required: false,
        allow_multiple_submissions: allowMultipleSubmissions,
        submission_deadline: submissionDeadline || null,
        sections: sections.map((section, sectionIndex) => ({
          title: section.title,
          description: section.description,
          order: sectionIndex + 1,
          fields: section.fields?.map((field, fieldIndex) => {
            const fieldData = {
              field_name: field.field_name || `field_${sectionIndex}_${fieldIndex}`,
              field_label: field.field_label,
              field_type: field.field_type,
              display_order: globalDisplayOrder++, // 使用全域順序
              is_required: field.is_required || false,
              is_active: true,
              placeholder: field.placeholder || '',
              help_text: field.help_text || '',
              help_image_url: field.help_image_url || undefined,
              options: field.options?.map((opt, optIndex) => ({
                option_value: opt.option_value || opt.option_label || `option_${optIndex}`,
                option_label: opt.option_label,
                display_order: optIndex,
                is_active: true,
                jump_to_section_id: opt.jump_to_section_id
              })) || [],
              grid_options: field.grid_options || { rows: [], columns: [] }
            }
            return fieldData
          }) || []
        }))
      }
      
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'draft' })
      })
      
      if (response.ok) {
        toast.success('草稿已儲存')
        router.push('/dashboard/forms')
      } else {
        const errorData = await response.json()
        console.error('Save error:', errorData)
        toast.error(errorData.error || '儲存失敗')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('儲存失敗')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishForm = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      // 計算全域 display_order
      let globalDisplayOrder = 0
      
      const formData = {
        title,
        description,
        form_type: formType,
        is_required: false,
        allow_multiple_submissions: allowMultipleSubmissions,
        submission_deadline: submissionDeadline || null,
        sections: sections.map((section, sectionIndex) => ({
          title: section.title,
          description: section.description,
          order: sectionIndex + 1,
          fields: section.fields?.map((field, fieldIndex) => {
            const fieldData = {
              field_name: field.field_name || `field_${sectionIndex}_${fieldIndex}`,
              field_label: field.field_label,
              field_type: field.field_type,
              display_order: globalDisplayOrder++, // 使用全域順序
              is_required: field.is_required || false,
              is_active: true,
              placeholder: field.placeholder || '',
              help_text: field.help_text || '',
              help_image_url: field.help_image_url || undefined,
              options: field.options?.map((opt, optIndex) => ({
                option_value: opt.option_value || opt.option_label || `option_${optIndex}`,
                option_label: opt.option_label,
                display_order: optIndex,
                is_active: true,
                jump_to_section_id: opt.jump_to_section_id
              })) || [],
              grid_options: field.grid_options || { rows: [], columns: [] }
            }
            return fieldData
          }) || []
        }))
      }
      
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'active' })
      })
      
      if (response.ok) {
        toast.success('表單已發布')
        router.push('/dashboard/forms')
      } else {
        const errorData = await response.json()
        console.error('Publish error:', errorData)
        toast.error(errorData.error || '發布失敗')
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('發布失敗')
    } finally {
      setIsLoading(false)
    }
  }

  const addSection = () => {
    const newSection: FormSectionWithId = {
      tempId: `section-${Date.now()}`,
      title: '',
      description: '',
      order: sections.length,
      fields: []
    }
    setSections(prev => [...prev, newSection])
    setCurrentSectionIndex(sections.length)
  }

  const updateSection = (sectionIndex: number, updates: Partial<FormSectionWithId>) => {
    setSections(prev => prev.map((section, index) => 
      index === sectionIndex ? { ...section, ...updates } : section
    ))
  }

  const removeSection = (sectionIndex: number) => {
    setSections(prev => prev.filter((_, index) => index !== sectionIndex))
    if (currentSectionIndex >= sections.length - 1) {
      setCurrentSectionIndex(Math.max(0, sections.length - 2))
    }
  }

  const addField = (sectionIndex: number) => {
    const newField: FormFieldWithId = {
      tempId: `field-${Date.now()}`,
      field_name: '',
      field_label: '',
      field_type: 'text',
      display_order: 0,
      is_required: false,
      is_active: true,
      placeholder: '',
      help_text: '',
      options: [],
      grid_options: { rows: [], columns: [] }
    }
    
    setSections(prev => prev.map((section, index) => 
      index === sectionIndex 
        ? { ...section, fields: [...(section.fields || []), newField] }
        : section
    ))
    
    // 自動 focus 新建的欄位
    setFocusedFieldId(newField.tempId)
  }

  const updateField = (sectionIndex: number, fieldIndex: number, updates: Partial<FormFieldWithId>) => {
    setSections(prev => prev.map((section, sIndex) => 
      sIndex === sectionIndex 
        ? {
            ...section,
            fields: section.fields?.map((field, fIndex) => 
              fIndex === fieldIndex ? { ...field, ...updates } : field
            )
          }
        : section
    ))
  }

  const removeField = (sectionIndex: number, fieldIndex: number) => {
    const fieldToRemove = sections[sectionIndex]?.fields?.[fieldIndex]
    if (fieldToRemove && focusedFieldId === fieldToRemove.tempId) {
      setFocusedFieldId(null)
    }
    
    setSections(prev => prev.map((section, sIndex) => 
      sIndex === sectionIndex 
        ? { ...section, fields: section.fields?.filter((_, fIndex) => fIndex !== fieldIndex) }
        : section
    ))
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    
    const { source, destination } = result
    const sectionIndex = parseInt(source.droppableId.split('-')[1])
    
    setSections(prev => prev.map((section, index) => {
      if (index !== sectionIndex) return section
      
      const newFields = Array.from(section.fields || [])
      const [reorderedField] = newFields.splice(source.index, 1)
      newFields.splice(destination.index, 0, reorderedField)
      
      return { ...section, fields: newFields }
    }))
  }

  const currentSection = sections[currentSectionIndex]

  if (!user || !hasFormManagePermission(user.role)) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">您沒有權限創建表單</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <FormProvider>
      <div className="container mx-auto p-6 space-y-6" onClick={() => setFocusedFieldId(null)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">創建表單</h1>
            <p className="text-muted-foreground">設計您的自訂表單</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? '編輯模式' : '預覽模式'}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isLoading}
            >
              儲存草稿
            </Button>
            <Button
              onClick={handlePublishForm}
              disabled={isLoading}
            >
              發布表單
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                {Object.values(errors).map((error, index) => (
                  <p key={index} className="text-sm text-red-600">• {error}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!isPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Form Settings */}
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">表單標題 *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="輸入表單標題"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="description">表單描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="輸入表單描述"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="form-type">表單類型 *</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger className={errors.formType ? 'border-red-500' : ''}>
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
                  <Label htmlFor="deadline">提交截止時間</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={submissionDeadline}
                    onChange={(e) => setSubmissionDeadline(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>表單設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="multiple">允許多次提交</Label>
                  <Switch
                    id="multiple"
                    checked={allowMultipleSubmissions}
                    onCheckedChange={setAllowMultipleSubmissions}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>權限設定</CardTitle>
              </CardHeader>
              <CardContent>
                <FormCreatePermissionsModal
                  permissions={permissions}
                  onPermissionsChange={setPermissions}
                  roles={roles}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Navigation */}
            <FormSectionNavigation
              sections={sections}
              currentSectionIndex={currentSectionIndex}
              onSectionChange={setCurrentSectionIndex}
              onAddSection={addSection}
              showAddButton={true}
            />

            {/* Section Editor */}
            {currentSection && (
              <FormSectionEditor
                section={currentSection}
                sections={sections}
                onUpdate={(updates) => updateSection(currentSectionIndex, updates)}
                onRemove={() => removeSection(currentSectionIndex)}
                canRemove={sections.length > 1}
              />
            )}

            {/* Fields */}
            {currentSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    欄位設定
                    <Button
                      onClick={(e) => { e.stopPropagation(); addField(currentSectionIndex) }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新增欄位
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!currentSection.fields || currentSection.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      尚未新增任何欄位
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId={`section-${currentSectionIndex}`}>
                        {(provided: DroppableProvided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {(currentSection.fields || []).map((field, fieldIndex) => (
                              <FormFieldCard
                                key={field.tempId}
                                field={field}
                                fieldIndex={fieldIndex}
                                sections={sections}
                                form={null}
                                isFocused={focusedFieldId === field.tempId}
                                onUpdate={(updates) => updateField(currentSectionIndex, fieldIndex, updates)}
                                onRemove={() => removeField(currentSectionIndex, fieldIndex)}
                                onFocus={() => setFocusedFieldId(field.tempId)}
                                isDraggable={true}
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        ) : (
          <div className="space-y-6">
            <FormSectionNavigation
              sections={sections}
              currentSectionIndex={currentSectionIndex}
              onSectionChange={setCurrentSectionIndex}
              onAddSection={() => {}}
              showAddButton={false}
            />

            <Card>
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{title || '未命名表單'}</CardTitle>
                    {description && <CardDescription className="mt-2 whitespace-pre-line text-sm">{description}</CardDescription>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsPreview(false)}>
                    編輯
                  </Button>
                </div>
                {sections.length > 0 && sections[currentSectionIndex] && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-medium text-lg">{sections[currentSectionIndex].title || '未命名段落'}</h3>
                    {sections[currentSectionIndex].description && (
                      <p className="text-sm text-muted-foreground mt-1">{sections[currentSectionIndex].description}</p>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {(!currentSection?.fields || currentSection.fields.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-lg">此段落沒有欄位</p>
                  </div>
                ) : (
                  currentSection.fields.map((field) => (
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
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </FormProvider>
  )
}

export default function FormCreatePage() {
  return <FormCreateContent />
} 