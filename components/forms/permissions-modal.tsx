"use client"

import type { Form, Role } from "@/app/api/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface RolePermission {
  role: Role
  access_type: 'read' | 'edit' | null
}

interface PermissionsModalProps {
  form: Form
  onPermissionsUpdate: (formId: string, permissions: RolePermission[]) => void
  roles?: { value: string; label: string }[]
}

const DEFAULT_ROLES = [
  { value: 'teacher', label: '大學伴' },
  { value: 'manager', label: '區域管理員' },
  { value: 'admin', label: '全域管理員' },
  { value: 'root', label: '系統管理員' },
]

const ACCESS_TYPES = [
  { value: null, label: '無權限' },
  { value: 'read', label: '檢視' },
  { value: 'edit', label: '編輯' },
]

export function PermissionsModal({ form, onPermissionsUpdate, roles = DEFAULT_ROLES }: PermissionsModalProps) {
  const [open, setOpen] = useState(false)
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [saving, setSaving] = useState(false)
  const [availableRoles, setAvailableRoles] = useState(roles)

  // 載入角色列表
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetch('/api/roles')
        if (response.ok) {
          const result = await response.json()
          const rolesList = result.data.map((role: any) => ({
            value: role.name,
            label: role.display_name || role.name
          }))
          setAvailableRoles(rolesList)
        }
      } catch (err) {
        console.error('Failed to load roles:', err)
        // 使用預設角色作為後備
        setAvailableRoles(DEFAULT_ROLES)
      }
    }

    loadRoles()
  }, [])

  // 初始化權限狀態
  useEffect(() => {
    if (open) {
      // 使用表單中的權限資料，或初始化為空權限
      const existingPermissions = form.permissions || []
      const allPermissions = availableRoles.map(role => {
        const existing = existingPermissions.find((p: RolePermission) => p.role.name === role.value)
        return {
          role: { 
            id: 0, 
            name: role.value, 
            display_name: role.label, 
            color: null, 
            order: 0 
          } as Role,
          access_type: existing ? existing.access_type : null
        }
      })
      setPermissions(allPermissions)
    }
  }, [open, form.permissions, availableRoles])

  const updatePermission = (roleName: string, accessType: 'read' | 'edit' | null) => {
    setPermissions(prev => 
      prev.map(p => 
        p.role.name === roleName ? { ...p, access_type: accessType } : p
      )
    )
  }

  const savePermissions = async () => {
    setSaving(true)
    try {
      // 轉換為 API 期望的格式（role 名稱字符串）
      const apiPermissions = permissions.map(p => ({
        role: p.role.name,
        access_type: p.access_type
      }))

      const response = await fetch(`/api/forms/${form.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions: apiPermissions }),
      })

      if (!response.ok) {
        throw new Error('Failed to save permissions')
      }

      toast.success('權限設定已保存')
      onPermissionsUpdate(form.id, permissions)
      setOpen(false)
      // 不再需要重新載入頁面，使用回調函數來更新資料
    } catch (err) {
      toast.error('保存權限設定時發生錯誤')
      console.error('Error saving permissions:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          編輯權限
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>權限設定</DialogTitle>
          <DialogDescription>
            設定「{form.title}」的角色權限
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {permissions.map((permission) => {
            const roleLabel = availableRoles.find(r => r.value === permission.role.name)?.label || permission.role.name
            return (
              <div key={permission.role.name} className="flex items-center justify-between">
                <Label className="text-sm font-medium">{roleLabel}</Label>
                <Select
                  value={permission.access_type || 'null'}
                  onValueChange={(value) => 
                    updatePermission(permission.role.name, value === 'null' ? null : value as 'read' | 'edit')
                  }
                >
                  <SelectTrigger className="w-32">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={savePermissions} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 