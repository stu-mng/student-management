"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { DraggableProvided } from "@hello-pangea/dnd"
import { Draggable } from "@hello-pangea/dnd"
import { GripVertical, Trash2 } from "lucide-react"
import { useEffect } from "react"
import type { FormFieldWithId, FormSectionWithId } from "../form-context"
import { FIELD_TYPES } from "../form-context"
import { FormFieldBuilder } from "./form-field-builder"
import { FormFieldPreview } from "./form-field-preview"

interface FormFieldCardProps {
  field: FormFieldWithId
  fieldIndex: number
  sections: FormSectionWithId[]
  isFocused: boolean
  onUpdate: (updates: Partial<FormFieldWithId>) => void
  onRemove: () => void
  onFocus: () => void
  isDraggable?: boolean
}

export function FormFieldCard({
  field,
  fieldIndex,
  sections,
  isFocused,
  onUpdate,
  onRemove,
  onFocus,
  isDraggable = true
}: FormFieldCardProps) {
  const fieldType = FIELD_TYPES.find(t => t.value === field.field_type)

  // Auto-focus the label input and scroll into view when this card becomes focused
  useEffect(() => {
    if (!isFocused) return
    const input = document.getElementById(`label-${field.tempId}`) as HTMLInputElement | null
    if (input) {
      try {
        input.focus({ preventScroll: true })
      } catch {
        input.focus()
      }
      if (typeof input.select === 'function') {
        input.select()
      }
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    // Fallback: focus and scroll the card itself
    const card = document.getElementById(`field-card-${field.tempId}`) as HTMLElement | null
    if (card) {
      card.setAttribute('tabindex', '-1')
      try {
        ;(card as HTMLElement).focus({ preventScroll: true })
      } catch {
        ;(card as HTMLElement).focus()
      }
      card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isFocused, field.tempId])

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!isDraggable) {
      return (
          <Card 
            id={`field-card-${field.tempId}`}
          className={`border transition-all duration-200 cursor-pointer relative ${
            isFocused ? 'border-l-4 border-l-purple-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            if (!isFocused) {
              onFocus()
            }
          }}
        >
          {children}
        </Card>
      )
    }

    return (
      <Draggable key={field.tempId} draggableId={field.tempId} index={fieldIndex}>
        {(provided: DraggableProvided) => (
          <Card 
            id={`field-card-${field.tempId}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`border transition-all duration-200 cursor-pointer relative ${
              isFocused ? 'border-l-4 border-l-purple-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (!isFocused) {
                onFocus()
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isDraggable && (
                    <div {...provided.dragHandleProps}>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <h4 className="font-medium">
                    {field.field_label || `欄位 ${fieldIndex + 1}`}
                  </h4>
                  <Badge variant="secondary">
                    {fieldType?.label || field.field_type}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {isFocused ? (
                <FormFieldBuilder field={field} sections={sections} onUpdate={onUpdate} />
              ) : (
                <FormFieldPreview field={field} />
              )}
            </CardContent>
          </Card>
        )}
      </Draggable>
    )
  }

  if (!isDraggable) {
    return (
      <Card 
        id={`field-card-${field.tempId}`}
        className={`border transition-all duration-200 cursor-pointer relative ${
          isFocused ? 'border-l-4 border-l-purple-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={(e) => {
          e.stopPropagation()
          if (!isFocused) {
            onFocus()
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">
                {field.field_label || `欄位 ${fieldIndex + 1}`}
              </h4>
              <Badge variant="secondary">
                {fieldType?.label || field.field_type}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {isFocused ? (
            <FormFieldBuilder field={field} sections={sections} onUpdate={onUpdate} />
          ) : (
            <FormFieldPreview field={field} />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Draggable key={field.tempId} draggableId={field.tempId} index={fieldIndex}>
      {(provided: DraggableProvided) => (
        <Card 
          id={`field-card-${field.tempId}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border transition-all duration-200 cursor-pointer relative ${
            isFocused ? 'border-l-4 border-l-purple-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            if (!isFocused) {
              onFocus()
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div {...provided.dragHandleProps}>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <h4 className="font-medium">
                  {field.field_label || `欄位 ${fieldIndex + 1}`}
                </h4>
                <Badge variant="secondary">
                  {fieldType?.label || field.field_type}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {isFocused ? (
              <FormFieldBuilder field={field} sections={sections} onUpdate={onUpdate} />
            ) : (
              <FormFieldPreview field={field} />
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  )
} 