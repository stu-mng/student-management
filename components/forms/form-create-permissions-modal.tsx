"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield } from "lucide-react"
import { useEffect, useState } from "react"

interface RolePermission {
  role: string
  access_type: 'read' | 'edit' | null
}

interface FormCreatePermissionsModalProps {
  permissions: RolePermission[]
  onPermissionsChange: (permissions: RolePermission[]) => void
  roles: { value: string; label: string }[]
}

const ACCESS_TYPES = [
  { value: null, label: '無權限' },
  { value: 'read', label: '檢視' },
  { value: 'edit', label: '編輯' },
]

export function FormCreatePermissionsModal({ 
  permissions, 
  onPermissionsChange, 
  roles 
}: FormCreatePermissionsModalProps) {
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