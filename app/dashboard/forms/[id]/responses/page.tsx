"use client"

import type { Form } from "@/app/api/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/utils"
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface FormResponse {
  id: string
  created_at: string
  submission_status: string
  respondent: {
    id: string
    name: string
    email: string
  }
  field_responses: Array<{
    id: string
    field_value: string | null
    field_values: string[] | null
    field: {
      id: string
      field_label: string
      field_type: string
    }
  }>
}

interface FieldOverview {
  field_id: string
  field_label: string
  field_type: string
  display_order: number
  responses: Array<{
    response_id: string
    respondent_name: string
    respondent_email: string
    field_value: string | null
    field_values: string[] | null
    created_at: string
    submission_status: string
  }>
  total_responses: number
}

interface AccessData {
  hasAccess: boolean
  accessType: 'read' | 'edit' | null
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function FormResponsesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const formId = params.id as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [overview, setOverview] = useState<FieldOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [responsesLoading, setResponsesLoading] = useState(false)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responsesError, setResponsesError] = useState<string | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [accessData, setAccessData] = useState<AccessData | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [gridStatsMode, setGridStatsMode] = useState<'row' | 'column'>('row')
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // 從 URL 參數獲取當前 tab 和頁碼
  const currentTab = searchParams.get('tab') || 'overview'
  const currentPage = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    const fetchFormAndAccess = async () => {
      try {
        // 同時獲取表單資料和權限資料
        const [formResponse, accessResponse] = await Promise.all([
          fetch(`/api/forms/${formId}`),
          fetch(`/api/forms/${formId}/access`)
        ])

        if (!formResponse.ok) {
          throw new Error('Failed to fetch form')
        }

        const formData = await formResponse.json()
        setForm(formData.data)

        if (accessResponse.ok) {
          const accessData = await accessResponse.json()
          setAccessData(accessData.data)
        } else {
          setAccessData({ hasAccess: false, accessType: null })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
        setCheckingAccess(false)
      }
    }

    if (formId) {
      fetchFormAndAccess()
    }
  }, [formId])

  // 載入總覽數據
  const fetchOverview = useCallback(async () => {
    if (!accessData?.accessType || accessData.accessType !== 'edit') {
      return
    }

    setOverviewLoading(true)
    setOverviewError(null)
    
    try {
      const response = await fetch(`/api/forms/${formId}/responses/overview`)
      if (!response.ok) {
        throw new Error('Failed to fetch overview')
      }
      
      const data = await response.json()
      setOverview(data.data || [])
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : 'Failed to load overview')
    } finally {
      setOverviewLoading(false)
    }
  }, [accessData?.accessType, formId])

  // 載入單一回應數據（帶分頁）
  const fetchResponses = useCallback(async (page: number = currentPage) => {
    if (!accessData?.accessType || accessData.accessType !== 'edit') {
      return
    }

    setResponsesLoading(true)
    setResponsesError(null)
    
    try {
      const response = await fetch(`/api/forms/${formId}/responses?page=${page}&limit=${pagination.limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch responses')
      }
      
      const data = await response.json()
      setResponses(data.data || [])
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: Math.ceil(data.total / data.limit)
      })
    } catch (err) {
      setResponsesError(err instanceof Error ? err.message : 'Failed to load responses')
    } finally {
      setResponsesLoading(false)
    }
  }, [accessData?.accessType, formId, currentPage, pagination.limit])

  useEffect(() => {
    if (accessData?.accessType === 'edit') {
      if (currentTab === 'overview') {
        fetchOverview()
      } else if (currentTab === 'individual') {
        fetchResponses(currentPage)
      }
    }
  }, [accessData, currentTab, currentPage, fetchOverview, fetchResponses])

  // 更新 URL 參數
  const updateUrlParams = (tab: string, page?: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', tab)
    if (page) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // 處理 tab 切換
  const handleTabChange = (tab: string) => {
    updateUrlParams(tab)
  }

  // 處理分頁
  const handlePageChange = (page: number) => {
    updateUrlParams(currentTab, page)
  }

  const renderResponseValue = (fieldResponse: {
    field_value: string | null
    field_values: string[] | null
    field: {
      field_type: string
      id: string
    }
  }) => {
    // 處理 grid 類型欄位
    if (['radio_grid', 'checkbox_grid'].includes(fieldResponse.field.field_type)) {
      return renderGridResponseValue(fieldResponse)
    }
    
    if (fieldResponse.field_values && Array.isArray(fieldResponse.field_values)) {
      return fieldResponse.field_values.join(', ')
    }
    return fieldResponse.field_value || '-'
  }

  const renderOverviewValue = (response: {
    field_value: string | null
    field_values: string[] | null
  }, fieldType?: string, fieldId?: string) => {
    // 處理 grid 類型欄位
    if (fieldType && ['radio_grid', 'checkbox_grid'].includes(fieldType) && fieldId) {
      return renderGridOverviewValue(response, fieldId)
    }
    
    if (response.field_values && Array.isArray(response.field_values)) {
      return response.field_values.join(', ')
    }
    return response.field_value || '-'
  }

  // 渲染 grid 回應值 - 用於單一回應頁面
  const renderGridResponseValue = (fieldResponse: {
    field_value: string | null
    field: {
      id: string
      field_type: string
    }
  }) => {
    if (!form?.fields || !fieldResponse.field_value) {
      return '-'
    }
    
    const field = form.fields.find(f => f.id === fieldResponse.field.id)
    if (!field?.grid_options) {
      return '-'
    }
    
    try {
      let gridData
      if (typeof fieldResponse.field_value === 'string') {
        gridData = JSON.parse(fieldResponse.field_value)
      } else {
        gridData = fieldResponse.field_value
      }
      
      if (!gridData || typeof gridData !== 'object') {
        return '-'
      }
      
      const { rows, columns } = field.grid_options
      const result = []
      
      for (const [rowValue, columnValue] of Object.entries(gridData)) {
        const row = rows?.find(r => r.value === rowValue)
        
        if (fieldResponse.field.field_type === 'checkbox_grid' && Array.isArray(columnValue)) {
          // 多選方格
          const selectedColumns = columnValue
            .map(val => columns?.find(c => c.value === val)?.label)
            .filter(Boolean)
            .join(', ')
          
          if (selectedColumns && row?.label) {
            result.push(`${row.label}: ${selectedColumns}`)
          }
        } else {
          // 單選方格
          const column = columns?.find(c => c.value === columnValue)
          if (row?.label && column?.label) {
            result.push(`${row.label}: ${column.label}`)
          }
        }
      }
      
      return result.length > 0 ? result.join('\n') : '-'
    } catch (error) {
      console.error('Error parsing grid response:', error)
      return fieldResponse.field_value || '-'
    }
  }

  // 渲染 grid 總覽值 - 用於總覽頁面（顯示統計）
  const renderGridOverviewValue = (response: {
    field_value: string | null
  }, fieldId: string) => {
    if (!form?.fields || !response.field_value) {
      return '-'
    }
    
    const field = form.fields.find(f => f.id === fieldId)
    if (!field?.grid_options) {
      return '-'
    }
    
    try {
      let gridData
      if (typeof response.field_value === 'string') {
        gridData = JSON.parse(response.field_value)
      } else {
        gridData = response.field_value
      }
      
      if (!gridData || typeof gridData !== 'object') {
        return '-'
      }
      
      const { rows, columns } = field.grid_options
      const result = []
      
      for (const [rowValue, columnValue] of Object.entries(gridData)) {
        const row = rows?.find(r => r.value === rowValue)
        
        if (field.field_type === 'checkbox_grid' && Array.isArray(columnValue)) {
          // 多選方格
          const selectedColumns = columnValue
            .map(val => columns?.find(c => c.value === val)?.label)
            .filter(Boolean)
            .join(', ')
          
          if (selectedColumns && row?.label) {
            result.push(`${row.label}: ${selectedColumns}`)
          }
        } else {
          // 單選方格
          const column = columns?.find(c => c.value === columnValue)
          if (row?.label && column?.label) {
            result.push(`${row.label}: ${column.label}`)
          }
        }
      }
      
      return result.length > 0 ? result.join('\n') : '-'
    } catch (error) {
      console.error('Error parsing grid response:', error)
      return response.field_value || '-'
    }
  }

  // 計算選擇類型欄位的統計資訊 - 用於總覽頁面
  const renderChoiceStatistics = (field: FieldOverview) => {
    if (!form?.fields) {
      console.log('No form fields available for', field.field_label)
      return null
    }
    
    const formField = form.fields.find(f => f.id === field.field_id)
    if (!formField) {
      console.log('Form field not found for', field.field_label, field.field_id)
      return null
    }
    
    console.log('Form field found:', formField.field_label, 'Type:', formField.field_type, 'Options:', formField.form_field_options?.length || 0)
    
    if (!formField?.form_field_options || formField.form_field_options.length === 0) {
      console.log('No options available for field', field.field_label)
      // 仍然顯示一個基本的卡片，說明沒有選項
      return (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{field.field_label}</h3>
            <p className="text-sm text-gray-500">
              {field.field_type === 'multiple_choice' || field.field_type === 'checkbox' ? '多選' : '單選'} • 
              尚未設定選項
            </p>
          </div>
          <div className="text-center py-8 text-gray-500">
            <p>此欄位尚未設定選項</p>
          </div>
        </Card>
      )
    }
    
    // 顏色配置
    const colors = [
      '#3b82f6', // blue-500
      '#10b981', // green-500
      '#f59e0b', // yellow-500
      '#8b5cf6', // purple-500
      '#ef4444', // red-500
      '#6366f1', // indigo-500
      '#ec4899', // pink-500
      '#f97316'  // orange-500
    ]
    
    // 自定義 Tooltip
    function CustomTooltip({ active, payload, label }: {
      active?: boolean
      payload?: Array<{
        value: number
        color: string
      }>
      label?: string
    }) {
      if (active && payload && payload.length) {
        const value = payload[0]?.value || 0
        const total = field.responses.filter(r => r.field_value || (r.field_values && r.field_values.length > 0)).length
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
        
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium text-gray-900 mb-2">{label}</p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: payload[0]?.color }}
                />
                <span className="text-gray-600">選擇次數:</span>
                <span className="font-medium">{value} 次</span>
              </div>
              <div className="text-gray-500">
                佔比: {percentage}%
              </div>
            </div>
          </div>
        )
      }
      return null
    }
    
    // 統計選項選擇次數 - 注意：overview API 返回的是 labels，不是 values
    const statistics: { [key: string]: number } = {}
    
    // 初始化統計對象 - 使用標籤作為 key
    formField.form_field_options.forEach((option: {
      option_label: string
      option_value: string
    }) => {
      statistics[option.option_label] = 0
    })
    
    console.log('Initialized statistics for', field.field_label, statistics)
    console.log('Processing', field.responses.length, 'responses for field', field.field_label)
    
    // 計算統計 - 匹配標籤而不是值
    field.responses.forEach((response, index) => {
      console.log(`Response ${index}:`, {
        field_value: response.field_value,
        field_values: response.field_values,
        field_type: field.field_type
      })
      
      if (field.field_type === 'multiple_choice' || field.field_type === 'checkbox') {
        // 多選欄位 - field_values 中存的是標籤
        if (response.field_values && Array.isArray(response.field_values)) {
          response.field_values.forEach(label => {
            if (statistics[label] !== undefined) {
              statistics[label]++
              console.log(`Incremented ${label} to ${statistics[label]}`)
            } else {
              console.log(`Unknown option label: ${label}`)
            }
          })
        }
      } else {
        // 單選欄位 - field_value 中存的是標籤
        if (response.field_value && statistics[response.field_value] !== undefined) {
          statistics[response.field_value]++
          console.log(`Incremented ${response.field_value} to ${statistics[response.field_value]}`)
        } else if (response.field_value) {
          console.log(`Unknown option label: ${response.field_value}`)
        }
      }
    })
    
    console.log('Final statistics for', field.field_label, statistics)
    
    // 準備圖表數據 - 使用標籤
    const chartData = formField.form_field_options.map((option: {
      option_label: string
      option_value: string
    }, index: number) => ({
      name: option.option_label,
      value: statistics[option.option_label] || 0,
      fill: colors[index % colors.length]
    }))
    
    const totalResponses = Object.values(statistics).reduce((sum, count) => sum + count, 0)
    
    console.log('Chart data for', field.field_label, chartData)
    
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{field.field_label}</h3>
          <p className="text-sm text-gray-500">
            {field.field_type === 'multiple_choice' || field.field_type === 'checkbox' ? '多選' : '單選'} • 
            總選擇次數: {totalResponses} • 
            回應人數: {field.responses.filter(r => r.field_value || (r.field_values && r.field_values.length > 0)).length}
          </p>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* 詳細統計 */}
        <div className="mt-4 space-y-2">
          <CardDescription className="font-medium text-gray-700 text-sm">詳細統計</CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {formField.form_field_options.map((option: {
              option_label: string
              option_value: string
            }, index: number) => {
              const count = statistics[option.option_label] || 0
              const percentage = totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(1) : '0.0'
              return (
                <div key={option.option_value} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-gray-700">{option.option_label}</span>
                  </div>
                  <span className="font-medium text-gray-900">{count} 次 ({percentage}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    )
  }

  // 計算 grid 欄位的統計資訊 - 用於總覽頁面
  const renderGridStatistics = (field: FieldOverview) => {
    if (!form?.fields) {
      return null
    }
    
    const formField = form.fields.find(f => f.id === field.field_id)
    if (!formField?.grid_options) {
      return null
    }
    
    const { rows, columns } = formField.grid_options
    
    // 顏色配置
    const colors = [
      '#3b82f6', // blue-500
      '#10b981', // green-500
      '#f59e0b', // yellow-500
      '#8b5cf6', // purple-500
      '#ef4444', // red-500
      '#6366f1', // indigo-500
      '#ec4899', // pink-500
      '#f97316'  // orange-500
    ]
    
    // 統計模式切換按鈕
    function StatsToggle() {
      return <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGridStatsMode('row')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              gridStatsMode === 'row'
                ? 'bg-background text-primary shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            依行統計
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGridStatsMode('column')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              gridStatsMode === 'column'
                ? 'bg-background text-primary shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            依列統計
          </Button>
        </div>
      </div>
    }

    // 自定義 Tooltip
    function CustomTooltip({ active, payload, label }: {
      active?: boolean
      payload?: Array<{
        value: number
        color: string
        name: string
      }>
      label?: string
    }) {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium text-gray-900 mb-2">{label}</p>
            {payload.map((entry: {
              value: number
              color: string
              name: string
            }, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{entry.name}:</span>
                <span className="font-medium">{entry.value} 次</span>
              </div>
            ))}
          </div>
        )
      }
      return null
    }
    
    if (gridStatsMode === 'row') {
      // 依行統計：每行一個圖表
      const statistics: { [key: string]: { [key: string]: number } } = {}
      
      // 初始化統計對象
      rows?.forEach(row => {
        statistics[row.value] = {}
        columns?.forEach(col => {
          statistics[row.value][col.value] = 0
        })
      })
      
      // 計算統計
      field.responses.forEach(response => {
        if (!response.field_value) return
        
        try {
          let gridData
          if (typeof response.field_value === 'string') {
            gridData = JSON.parse(response.field_value)
          } else {
            gridData = response.field_value
          }
          
          if (!gridData || typeof gridData !== 'object') return
          
          for (const [rowValue, columnValue] of Object.entries(gridData)) {
            if (statistics[rowValue]) {
              if (field.field_type === 'checkbox_grid' && Array.isArray(columnValue)) {
                columnValue.forEach(val => {
                  if (statistics[rowValue][val] !== undefined) {
                    statistics[rowValue][val]++
                  }
                })
              } else {
                if (statistics[rowValue][columnValue as string] !== undefined) {
                  statistics[rowValue][columnValue as string]++
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing grid response for statistics:', error)
        }
      })
      
      return (
        <div className="space-y-6">
          <StatsToggle />
          {rows?.map((row) => {
            const rowStats = statistics[row.value]
            const totalForRow = Object.values(rowStats).reduce((sum, count) => sum + count, 0)
            
            // 準備圖表數據
            const chartData = columns?.map((col, colIndex) => ({
              name: col.label,
              value: rowStats[col.value] || 0,
              fill: colors[colIndex % colors.length]
            })) || []
            
            return (
              <Card key={row.value} className="p-6">
                <div className="mb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">{row.label}</CardTitle>
                  <p className="text-sm text-gray-500">總回應數: {totalForRow}</p>
                </div>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )
          })}
        </div>
      )
    } else {
      // 依列統計：每列一個圖表
      const statistics: { [key: string]: { [key: string]: number } } = {}
      
      // 初始化統計對象
      columns?.forEach(col => {
        statistics[col.value] = {}
        rows?.forEach(row => {
          statistics[col.value][row.value] = 0
        })
      })
      
      // 計算統計
      field.responses.forEach(response => {
        if (!response.field_value) return
        
        try {
          let gridData
          if (typeof response.field_value === 'string') {
            gridData = JSON.parse(response.field_value)
          } else {
            gridData = response.field_value
          }
          
          if (!gridData || typeof gridData !== 'object') return
          
          for (const [rowValue, columnValue] of Object.entries(gridData)) {
            if (field.field_type === 'checkbox_grid' && Array.isArray(columnValue)) {
              columnValue.forEach(val => {
                if (statistics[val] && statistics[val][rowValue] !== undefined) {
                  statistics[val][rowValue]++
                }
              })
            } else {
              if (statistics[columnValue as string] && statistics[columnValue as string][rowValue] !== undefined) {
                statistics[columnValue as string][rowValue]++
              }
            }
          }
        } catch (error) {
          console.error('Error parsing grid response for statistics:', error)
        }
      })
      
      return (
        <div className="space-y-6">
          <StatsToggle />
          {columns?.map((col) => {
            const colStats = statistics[col.value]
            const totalForCol = Object.values(colStats).reduce((sum, count) => sum + count, 0)
            
            // 準備圖表數據
            const chartData = rows?.map((row, rowIndex) => ({
              name: row.label,
              value: colStats[row.value] || 0,
              fill: colors[rowIndex % colors.length]
            })) || []
            
            return (
              <Card key={col.value} className="p-6">
                <div className="mb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">{col.label}</CardTitle>
                  <p className="text-sm text-gray-500">總回應數: {totalForCol}</p>
                </div>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )
          })}
        </div>
      )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">啟用中</Badge>
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>
      case 'inactive':
        return <Badge variant="outline">停用</Badge>
      case 'archived':
        return <Badge variant="destructive">已封存</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getFormTypeBadge = (formType: string) => {
    switch (formType) {
      case 'registration':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">報名表</Badge>
      case 'profile':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">個人資料</Badge>
      case 'survey':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">問卷調查</Badge>
      case 'feedback':
        return <Badge variant="outline" className="text-green-600 border-green-600">意見回饋</Badge>
      case 'application':
        return <Badge variant="outline" className="text-red-600 border-red-600">申請表</Badge>
      default:
        return <Badge variant="outline">{formType}</Badge>
    }
  }

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="default" className="bg-green-500">已提交</Badge>
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading || checkingAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !form || !accessData?.hasAccess || accessData.accessType !== 'edit') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error || (!accessData?.hasAccess ? '您沒有權限查看此表單回應' : '找不到表單')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 表單資訊摘要 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{form.title}</CardTitle>
              {form.description && (
                <CardDescription className="mt-2 text-base whitespace-pre-line text-sm">
                  {form.description}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {getStatusBadge(form.status || 'draft')}
            {getFormTypeBadge(form.form_type)}
            {form.is_required && (
              <Badge variant="destructive" className="text-xs">必填</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* 回應統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">總回應數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">總欄位回應</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overview.reduce((acc, field) => 
                  acc + field.responses.length, 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {currentTab === 'individual' 
                ? responses.filter(r => r.submission_status === 'draft').length
                : overview.reduce((acc, field) => 
                    acc + field.responses.filter(r => r.submission_status === 'draft').length, 0
                  )
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs 內容 */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="individual">單一回應</TabsTrigger>
        </TabsList>

        {/* 總覽 Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>問題總覽</CardTitle>
              <CardDescription>
                每個問題的所有回答
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : overviewError ? (
                <div className="text-center text-red-600 py-8">
                  <p>{overviewError}</p>
                </div>
              ) : overview.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>尚未收到任何回應</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {overview.map((field) => (
                    ['radio_grid', 'checkbox_grid'].includes(field.field_type) ? (
                      /* Grid 欄位顯示統計 */
                      <div key={field.field_id} className="border rounded-lg p-4">
                        <div className="mb-4">
                          <CardTitle className="text-lg font-semibold">{field.field_label}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {field.field_type} • {field.total_responses} 個回應
                          </p>
                        </div>
                        <div>
                          {renderGridStatistics(field)}
                        </div>
                      </div>
                    ) : ['single_choice', 'multiple_choice', 'radio', 'checkbox'].includes(field.field_type) ? (
                      /* 選擇類型欄位顯示圖表統計 - 直接顯示，不需要額外包裝 */
                      <div key={field.field_id}>
                        {renderChoiceStatistics(field)}
                      </div>
                    ) : (
                      /* 其他欄位顯示個別回應 */
                      <div key={field.field_id} className="border rounded-lg p-4">
                        <div className="mb-4">
                          <CardTitle className="text-lg font-semibold">{field.field_label}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {field.field_type} • {field.total_responses} 個回應
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          {field.responses.length === 0 ? (
                            <p className="text-muted-foreground text-sm">尚無回應</p>
                          ) : (
                            field.responses.map((response) => (
                              <div key={`${response.response_id}-${field.field_id}`} 
                                   className="flex items-start justify-between p-3 bg-muted/50 rounded">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {renderOverviewValue(response, field.field_type, field.field_id)}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {response.respondent_name} • {formatDate(response.created_at)}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  {getSubmissionStatusBadge(response.submission_status)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 單一回應 Tab */}
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>單一回應</CardTitle>
                  <CardDescription>
                    共收到 {pagination.total} 份回應
                  </CardDescription>
                </div>
                
                {/* 分頁控制 */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {currentPage} 頁，共 {pagination.totalPages} 頁
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {responsesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : responsesError ? (
                <div className="text-center text-red-600 py-8">
                  <p>{responsesError}</p>
                </div>
              ) : responses.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>尚未收到任何回應</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {responses.map((response) => (
                    <Card key={response.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {response.respondent.name}
                            </CardTitle>
                            <CardDescription>
                              {response.respondent.email} • {formatDate(response.created_at)}
                            </CardDescription>
                          </div>
                          {getSubmissionStatusBadge(response.submission_status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {response.field_responses.map((fieldResponse) => (
                            <div key={fieldResponse.id} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div className="font-medium text-sm">
                                {fieldResponse.field.field_label}
                              </div>
                              <div className="md:col-span-2 text-sm whitespace-pre-line">
                                {renderResponseValue(fieldResponse)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 