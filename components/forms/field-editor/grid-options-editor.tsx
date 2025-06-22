"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import type { FormFieldWithId } from "../form-context"

interface GridOptionsEditorProps {
  field: FormFieldWithId
  onUpdate: (updates: Partial<FormFieldWithId>) => void
}

export function GridOptionsEditor({ field, onUpdate }: GridOptionsEditorProps) {
  const addGridRow = () => {
    const newRow = { label: '', value: `row-${Date.now()}` }
    onUpdate({
      grid_options: {
        rows: [...(field.grid_options?.rows || []), newRow],
        columns: field.grid_options?.columns || []
      }
    })
  }

  const addGridColumn = () => {
    const newColumn = { label: '', value: `col-${Date.now()}` }
    onUpdate({
      grid_options: {
        rows: field.grid_options?.rows || [],
        columns: [...(field.grid_options?.columns || []), newColumn]
      }
    })
  }

  const updateGridRow = (index: number, updates: { label?: string; value?: string }) => {
    const newRows = [...(field.grid_options?.rows || [])]
    newRows[index] = { ...newRows[index], ...updates }
    onUpdate({
      grid_options: { 
        rows: newRows,
        columns: field.grid_options?.columns || []
      }
    })
  }

  const updateGridColumn = (index: number, updates: { label?: string; value?: string }) => {
    const newColumns = [...(field.grid_options?.columns || [])]
    newColumns[index] = { ...newColumns[index], ...updates }
    onUpdate({
      grid_options: { 
        rows: field.grid_options?.rows || [],
        columns: newColumns
      }
    })
  }

  const removeGridRow = (index: number) => {
    const newRows = field.grid_options?.rows?.filter((_, i) => i !== index) || []
    onUpdate({
      grid_options: { 
        rows: newRows,
        columns: field.grid_options?.columns || []
      }
    })
  }

  const removeGridColumn = (index: number) => {
    const newColumns = field.grid_options?.columns?.filter((_, i) => i !== index) || []
    onUpdate({
      grid_options: { 
        rows: field.grid_options?.rows || [],
        columns: newColumns
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Rows Configuration */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>列設定</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGridRow}
          >
            <Plus className="h-4 w-4 mr-1" />
            新增列
          </Button>
        </div>
        <div className="space-y-2">
          {field.grid_options?.rows?.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={row.label}
                onChange={(e) => updateGridRow(index, { 
                  label: e.target.value,
                  value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                })}
                placeholder="列標題"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeGridRow(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Columns Configuration */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>欄設定</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGridColumn}
          >
            <Plus className="h-4 w-4 mr-1" />
            新增欄
          </Button>
        </div>
        <div className="space-y-2">
          {field.grid_options?.columns?.map((column, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={column.label}
                onChange={(e) => updateGridColumn(index, { 
                  label: e.target.value,
                  value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                })}
                placeholder="欄標題"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeGridColumn(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 