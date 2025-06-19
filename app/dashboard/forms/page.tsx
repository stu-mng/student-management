"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText } from "lucide-react"
import { useEffect, useState } from "react"
import type { Form } from "@/app/api/types"
import { FormCard } from "@/components/forms"

interface FormWithSubmitStatus extends Form {
  submitted: boolean
}

export default function FormsPage() {
  const { user } = useAuth()
  const [forms, setForms] = useState<FormWithSubmitStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch('/api/forms')
        if (!response.ok) {
          throw new Error('Failed to fetch forms')
        }
        const data = await response.json()
        setForms(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchForms()
    }
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">表單填寫</h1>
          <p className="text-muted-foreground mt-2">查看並填寫可用的表單</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">表單填寫</h1>
          <p className="text-muted-foreground mt-2">查看並填寫可用的表單</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>載入表單時發生錯誤：{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">表單填寫</h1>
        <p className="text-muted-foreground mt-2">查看並填寫可用的表單</p>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>目前沒有可用的表單</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              variant="user"
            />
          ))}
        </div>
      )}
    </div>
  )
} 