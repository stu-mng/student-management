"use client"

import type { Form, User } from "@/app/api/types"
import { useAuth } from "@/components/auth-provider"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/user-avatar"
import type { ColumnDef } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

export default function AdminNotificationsPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedFormId, setSelectedFormId] = useState<string>("none")

  // Fetch users and published forms
  useEffect(() => {
    const run = async () => {
      if (!user) return
      try {
        setLoading(true)
        const [usersRes, formsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/forms?status=active"),
        ])
        if (!usersRes.ok) throw new Error("Failed to fetch users")
        if (!formsRes.ok) throw new Error("Failed to fetch forms")
        const usersJson: { data: User[] } = await usersRes.json()
        const formsJson: { data: Form[] } = await formsRes.json()
        setUsers(usersJson.data || [])
        setForms(formsJson.data || [])
        console.log(formsJson.data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "載入資料失敗")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [user])

  // Template autofill when selecting a published form
  const computedDomain = getComputedDomain()
  const handleSelectForm = (formId: string) => {
    setSelectedFormId(formId)
    if (formId === 'none') return
    const picked = forms.find(f => f.id === formId)
    if (!picked) return
    const link = `${computedDomain}/dashboard/forms/${picked.id}`
    setTitle(`[表單提醒] 請填寫 ${picked.title}`)
    setBody(`$提醒您填寫 {picked.title}\n\n請點擊以下連結進入填寫：\n${link}\n\n如果已經填寫請忽略此信件。`)
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  const selectedCount = selectedIds.size

  const previewHtml = useMemo(() => buildPreviewHtml({ username: "使用者名稱", title, body, domain: computedDomain }), [title, body, computedDomain])

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: () => null,
      cell: ({ row }) => (
        <div className="pl-2">
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={(val) => toggleOne(row.original.id, Boolean(val))}
            aria-label="選取"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "用戶",
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-3">
            <UserAvatar user={{ id: u.id, email: u.email, name: u.name, avatar_url: u.avatar_url ?? null, last_active: u.last_active ?? null, role: u.role ? { name: u.role.name } : undefined }} size="sm" />
            <div className="flex flex-col text-xs">
              <span className="font-medium">{u.name || u.email.split("@")[0]}</span>
              <span className="text-muted-foreground">{u.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "角色",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.role?.display_name || row.original.role?.name}</span>,
    },
  ]

  const handleSend = async () => {
    if (!title || !body) {
      toast.error("標題與內文為必填")
      return
    }
    if (selectedCount === 0) {
      toast.error("請至少選取一位收件人")
      return
    }
    const recipients = users
      .filter(u => selectedIds.has(u.id))
      .map(u => ({ email: u.email, username: u.name || u.email.split("@")[0] }))

    const res = await fetch("/api/emails/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, recipients }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j.error || "寄送失敗")
      return
    }
    const result = await res.json()
    if (result.success) {
      toast.success(`寄送成功：${result.summary.succeeded}/${result.summary.total}`)
    } else {
      toast.warning(`部分失敗：成功 ${result.summary.succeeded}，失敗 ${result.summary.failed}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">通知中心</h1>
        <p className="text-muted-foreground">撰寫通知並批次寄送給選取用戶</p>
      </div>

      {/* Top: editor and preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border">
          <CardHeader className="bg-muted/50">
            <CardTitle>內容編輯</CardTitle>
            <CardDescription>選擇模板或自行撰寫通知</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">表單模板</label>
              <div className="w-full">
                <Select value={selectedFormId} onValueChange={handleSelectForm}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不使用模板</SelectItem>
                    {forms.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">標題</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="輸入信件標題" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">內文</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="輸入信件內文" className="min-h-[180px]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="bg-muted/50">
            <CardTitle>信件預覽</CardTitle>
            <CardDescription>右側顯示寄送內容的預覽</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-hidden p-0" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom: recipients table and send */}
      <Card className="border">
        <CardHeader className="bg-muted/50">
          <CardTitle>收件人</CardTitle>
          <CardDescription>選取要寄送的用戶（{selectedCount} 位已選取）</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">載入中...</div>
          ) : (
            <DataTable columns={columns} data={users} />
          )}

          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={selectedCount === 0 || !title || !body}>批次寄信</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認批次寄信</AlertDialogTitle>
                  <AlertDialogDescription>
                    將寄送給 {selectedCount} 位用戶。確定要寄出嗎？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSend}>確認寄送</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function buildPreviewHtml({ username, title, body, domain }: { username: string; title: string; body: string; domain: string }) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  const safeTitle = esc(title || "(無標題)")
  const safeUsername = esc(username || "")
  const safeBody = (body || "").split('\n').map((line) => `<p style="margin:0 0 12px 0; line-height:1.6;">${linkify(line, esc)}</p>`).join('')
  const domainBlock = domain ? `<div style="margin-top: 6px;"><a href="${domain}" target="_blank" rel="noreferrer" style="color:#2563eb; text-decoration:none;">${esc(domain.replace(/^https?:\/\//, ''))}</a></div>` : ''
  return `<!DOCTYPE html>
  <html lang="zh-Hant"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${safeTitle}</title></head>
  <body style="margin:0;padding:0;background-color:#f6f7f9;"><div style="max-width:560px;margin:0 auto;padding:0px;">
  <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #eaecf0;box-shadow:0 1px 2px rgba(16,24,40,0.06);">
  <h1 style="font-size:18px;margin:0 0 12px 0;">${safeTitle}</h1>
  <div style="margin:12px 0 16px 0;">${safeUsername} 您好，</div>
  <div style="color:#374151;font-size:14px;">${safeBody}</div>
  <div style="color:#6b7280;font-size:12px;margin-top:24px;border-top:1px solid #f3f4f6;padding-top:16px;">
  <div>祝身體健康</div>
  <div style="margin-top:6px;">興大學伴酷系統</div>
  ${domainBlock}
  </div>
  </div></div></body></html>`
}

function getComputedDomain(): string {
  const envDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN as string | undefined) || ""
  if (typeof window === "undefined") return envDomain
  return envDomain || window.location.origin
}

function linkify(input: string, esc: (s: string) => string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = urlRegex.exec(input)) !== null) {
    const [url] = match
    const start = match.index
    result += esc(input.slice(lastIndex, start))
    const safeUrl = esc(url)
    result += `<a href="${safeUrl}" target="_blank" rel="noreferrer" style="color:#2563eb; text-decoration:none;">${safeUrl}</a>`
    lastIndex = start + url.length
  }
  result += esc(input.slice(lastIndex))
  return result
}


