"use client"

import type React from "react"

import type { Student, StudentUpdateRequest } from "@/app/api/types"
import { useAuth } from "@/components/auth-provider"
import { RestrictedCard } from "@/components/restricted-card"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<Partial<Student>>({
    name: "",
    gender: "",
    grade: "1",
    class: "",
    family_background: "",
    is_disadvantaged: false,
    cultural_disadvantage_factors: "",
    personal_background_notes: "",
    registration_motivation: "",
    student_type: "新生",
    account_username: "",
    account_password: "",
    email: "",
  })

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setIsLoading(true)
        const studentId = (await params).id
        
        // Call the API to get student data
        const response = await fetch(`/api/students/${studentId}`)
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to fetch student data')
        }
        
        const student = await response.json()
        
        setFormData({
          id: student.id,
          name: student.name,
          gender: student.gender,
          grade: student.grade,
          class: student.class,
          family_background: student.family_background,
          is_disadvantaged: student.is_disadvantaged,
          cultural_disadvantage_factors: student.cultural_disadvantage_factors,
          personal_background_notes: student.personal_background_notes,
          registration_motivation: student.registration_motivation,
          student_type: student.student_type,
          account_username: student.account_username,
          account_password: student.account_password,
          email: student.email,
        })
      } catch (error) {
        console.error("獲取學生數據錯誤:", error)
        toast("錯誤", {
          description: error instanceof Error ? error.message : "無法獲取學生資料",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchStudent()
    }
  }, [user, router, params])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string | boolean) => {
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
      const studentId = (await params).id
      
      // Prepare data for API
      const updateData: StudentUpdateRequest = {
        name: formData.name,
        gender: formData.gender,
        grade: formData.grade,
        class: formData.class,
        email: formData.email,
        is_disadvantaged: formData.is_disadvantaged,
        cultural_disadvantage_factors: formData.cultural_disadvantage_factors,
        personal_background_notes: formData.personal_background_notes,
        registration_motivation: formData.registration_motivation,
        student_type: formData.student_type,
        account_username: formData.account_username,
        account_password: formData.account_password,
      }
      
      // Call the API to update student
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update student')
      }
      
      toast("成功", {
        description: "學生資料已成功更新",
      })

      router.push("/dashboard")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("更新學生錯誤:", error)

      toast("錯誤", {
        description: error?.message || "更新學生時發生錯誤",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">編輯學生</h1>
          <p className="text-muted-foreground">更新學生的資料</p>
        </div>

        <RestrictedCard allowedRoles={["admin", "root"]}>
          <CardHeader>
            <CardTitle>學生資料</CardTitle>
            <CardDescription>編輯學生的基本資料</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </RestrictedCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">編輯學生</h1>
        <p className="text-muted-foreground">更新學生的資料</p>
      </div>

      <RestrictedCard allowedRoles={["admin", "root"]}>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>學生資料</CardTitle>
                <CardDescription>編輯學生的基本資料</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* 基本資料區段 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本資料</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">性別</Label>
                  <Select
                    value={formData.gender || ""}
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
                    value={formData.grade || ""}
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
                    value={formData.class || ""}
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
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">常用電子郵件</Label>
                  <Input id="email" name="email" type="email" value={formData.email || ""} onChange={handleChange} />
                </div>
              </div>
            </div>
            
            {/* 後台帳號區段 */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">後台帳號設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_username">帳號</Label>
                  <Input id="account_username" name="account_username" value={formData.account_username || ""} onChange={handleChange} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account_password">密碼</Label>
                  <div className="flex">
                    <Input 
                      id="account_password" 
                      name="account_password" 
                      type={showPassword ? "text" : "password"} 
                      value={formData.account_password || ""} 
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
                    value={formData.student_type || "新生"}
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
                    value={formData.is_disadvantaged ? "是" : "否"}
                    onValueChange={(value: string) => {
                      const isDisadvantaged = value === "是";
                      handleSelectChange("is_disadvantaged", isDisadvantaged);
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
                  <Input id="cultural_disadvantage_factors" name="cultural_disadvantage_factors" value={formData.cultural_disadvantage_factors || ""} onChange={handleChange} />
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
                  <Textarea id="family_background" name="family_background" value={formData.family_background || ""} onChange={handleChange} rows={3} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="personal_background_notes">個人背景補充</Label>
                  <Textarea id="personal_background_notes" name="personal_background_notes" value={formData.personal_background_notes || ""} onChange={handleChange} rows={3} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="registration_motivation">報名動機</Label>
                  <Textarea id="registration_motivation" name="registration_motivation" value={formData.registration_motivation || ""} onChange={handleChange} rows={3} />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              取消
            </Button>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "更新中..." : "更新學生"}
            </Button>
          </CardFooter>
        </form>
      </RestrictedCard>
    </div>
  )
}
