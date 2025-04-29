"use client"

import { Button } from "@/components/ui/button"
import {
    Card, CardContent, CardDescription, CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"
import { toast } from "sonner"

interface AnalyticsData {
  studentsByGrade: Record<string, number>
  studentsByType: Record<string, number>
  disadvantagedCount: number
  totalStudents: number
  teachersByActivity: Array<{
    name: string
    studentsCount: number
    lastActive: string
  }>
  teachersStudentCounts: Array<{
    name: string
    studentCount: number
  }>
  studentsOverTime: Array<{
    month: string
    studentCount: number
  }>
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
  "#8884D8", "#83A6ED", "#8DD1E1", "#A4DE6C"
]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      toast("錯誤", {
        description: "無法獲取分析數據",
      })
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  // Transform data for charts
  const gradeChartData = data ? Object.entries(data.studentsByGrade).map(([grade, count]) => ({
    grade,
    count
  })) : []

  const typeChartData = data ? Object.entries(data.studentsByType).map(([type, count]) => ({
    type,
    count
  })) : []
  
  // Format month for display
  const formatMonthLabel = (month: string) => {
    if (!month) return '';
    const [year, monthNum] = month.split('-');
    return `${year}/${monthNum}`;
  }
  
  // Format relative time for display
  const getRelativeTimeString = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Convert to seconds, minutes, hours, days
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    // Format the relative time string
    if (diffSecs < 60) {
      return `${diffSecs} 秒前`;
    } else if (diffMins < 60) {
      return `${diffMins} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} 週前`;
    } else if (diffMonths < 12) {
      return `${diffMonths} 個月前`;
    } else {
      // If more than a year, show the date
      return date.toLocaleDateString('zh-TW');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系統分析</h1>
          <p className="text-muted-foreground">學生、教師數據及使用情況分析</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </Button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">總學生人數</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{data?.totalStudents || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">弱勢學生人數</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{data?.disadvantagedCount || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">弱勢學生比例</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">
                {data ? `${((data.disadvantagedCount / data.totalStudents) * 100).toFixed(1)}%` : '0%'}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均每位老師學生數</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">
                {data && data.teachersByActivity.length > 0 
                  ? Math.round(data.totalStudents / data.teachersByActivity.length) 
                  : 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Grade */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>各年級學生分佈</CardTitle>
            <CardDescription>依年級統計的學生人數</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="學生人數" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Students by Type */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>學生類型分佈</CardTitle>
            <CardDescription>依類型統計的學生人數</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={typeChartData} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={true}
                    outerRadius={80} 
                    fill="#8884d8" 
                    dataKey="count"
                    nameKey="type"
                    label={(entry) => entry.type}
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Students Growth Over Time */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>學生人數趨勢</CardTitle>
            <CardDescription>每月新增學生數量統計</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data?.studentsOverTime}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonthLabel}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={formatMonthLabel} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="studentCount" 
                    name="學生數量" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Teachers Student Counts Bar Chart */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>教師學生分配情況</CardTitle>
            <CardDescription>各教師分配到的學生數量</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data?.teachersStudentCounts.slice(0, 10)}
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="studentCount" 
                    name="學生數量" 
                    fill="#82ca9d" 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Teachers Activity Table */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>教師活動狀況</CardTitle>
            <CardDescription>最近活躍的教師及其管理之學生</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data?.teachersByActivity.map((teacher, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium">{teacher.name}</span>
                      <span className="text-xs text-muted-foreground">
                        最後活動: {getRelativeTimeString(teacher.lastActive)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold">{teacher.studentsCount}</div>
                      <div className="text-xs text-muted-foreground">學生</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
