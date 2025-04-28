"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function NewStudentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    grade: "1",
    class: "",
    family_background: "",
    is_disadvantaged: "否",
    cultural_disadvantage_factors: "",
    personal_background_notes: "",
    registration_motivation: "",
    student_type: "新生",
    account_username: "",
    account_password: "",
    email: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast("錯誤", {
        description: "姓名為必填欄位",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 處理弱勢生狀態轉換為布林值
      const studentData = {
        ...formData,
      }

      // 呼叫 API 新增學生
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "新增學生時發生錯誤")
      }

      const result = await response.json()

      toast("成功", {
        description: "學生資料已成功新增",
      })

      router.push("/dashboard")
    } catch (error: any) {
      console.error("新增學生錯誤:", error)

      toast("錯誤", {
        description: error.message || "新增學生時發生錯誤",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">新增學生</h1>
        <p className="text-muted-foreground">添加新的學生資料到系統</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>學生資料</CardTitle>
            <CardDescription>請填寫學生的基本資料</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* 基本資料區段 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本資料</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">性別</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: string) => handleSelectChange("gender", value)}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="選擇性別" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grade">年級</Label>
                  <Select
                    value={formData.grade}
                    onValueChange={(value: string) => {
                      const gradeValue = value as '1' | '2' | '3' | '4' | '5' | '6';
                      handleSelectChange("grade", gradeValue);
                    }}
                  >
                    <SelectTrigger id="grade">
                      <SelectValue placeholder="選擇年級" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">一年級</SelectItem>
                      <SelectItem value="2">二年級</SelectItem>
                      <SelectItem value="3">三年級</SelectItem>
                      <SelectItem value="4">四年級</SelectItem>
                      <SelectItem value="5">五年級</SelectItem>
                      <SelectItem value="6">六年級</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="class">班級</Label>
                  <Select
                    value={formData.class}
                    onValueChange={(value: string) => handleSelectChange("class", value)}
                  >
                    <SelectTrigger id="class">
                      <SelectValue placeholder="選擇班級" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">一班</SelectItem>
                      <SelectItem value="2">二班</SelectItem>
                      <SelectItem value="3">三班</SelectItem>
                      <SelectItem value="4">四班</SelectItem>
                      <SelectItem value="5">五班</SelectItem>
                      <SelectItem value="6">六班</SelectItem>
                      <SelectItem value="7">七班</SelectItem>
                      <SelectItem value="8">八班</SelectItem>
                      <SelectItem value="9">九班</SelectItem>
                      <SelectItem value="10">十班</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">常用電子郵件</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
              </div>
            </div>
            
            {/* 後台帳號區段 */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">後台帳號設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_username">帳號</Label>
                  <Input id="account_username" name="account_username" value={formData.account_username} onChange={handleChange} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account_password">密碼</Label>
                  <div className="flex">
                    <Input 
                      id="account_password" 
                      name="account_password" 
                      type={showPassword ? "text" : "password"} 
                      value={formData.account_password} 
                      onChange={handleChange} 
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="ml-2" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 學生分類區段 */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">學生背景</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>新舊生</Label>
                  <RadioGroup
                    value={formData.student_type}
                    onValueChange={(value: string) => {
                      const typeValue = value as '新生' | '舊生';
                      handleSelectChange("student_type", typeValue);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="新生" id="student_type_new" />
                      <Label htmlFor="student_type_new">新生</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="舊生" id="student_type_old" />
                      <Label htmlFor="student_type_old">舊生</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>弱勢生狀態</Label>
                  <RadioGroup
                    value={formData.is_disadvantaged}
                    onValueChange={(value: string) => {
                      const isDisValue = value as '是' | '否';
                      handleSelectChange("is_disadvantaged", isDisValue);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="是" id="is_disadvantaged_yes" />
                      <Label htmlFor="is_disadvantaged_yes">是</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="否" id="is_disadvantaged_no" />
                      <Label htmlFor="is_disadvantaged_no">否</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cultural_disadvantage_factors">文化不利因素</Label>
                  <Input id="cultural_disadvantage_factors" name="cultural_disadvantage_factors" value={formData.cultural_disadvantage_factors} onChange={handleChange} />
                  <p className="text-xs text-muted-foreground">若學生為弱勢生，請詳細說明文化不利因素</p>
                </div>
              </div>
            </div>
            
            {/* 申請資料區段 */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">申請資料</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="family_background">家庭背景</Label>
                  <Textarea id="family_background" name="family_background" value={formData.family_background} onChange={handleChange} rows={3} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="personal_background_notes">個人背景補充</Label>
                  <Textarea id="personal_background_notes" name="personal_background_notes" value={formData.personal_background_notes} onChange={handleChange} rows={3} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="registration_motivation">報名動機</Label>
                  <Textarea id="registration_motivation" name="registration_motivation" value={formData.registration_motivation} onChange={handleChange} rows={3} />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              取消
            </Button>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "新增學生"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
