"use client"

import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getRoleDisplay, formatRelativeTime } from "@/lib/utils"
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
  totalTeachers: number
  totalAdmins: number
  totalManagers: number
  totalRoot: number
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

interface OnlineUsersData {
  online: {
    users: Array<{
      id: string
      name: string
      role: string
      last_active: string
    }>
    byRole: {
      teachers: number
      admins: number
      managers: number
      root: number
      total: number
    }
  }
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
  "#8884D8", "#83A6ED", "#8DD1E1", "#A4DE6C"
]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [onlineData, setOnlineData] = useState<OnlineUsersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [onlineLoading, setOnlineLoading] = useState(true)
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

  const fetchOnlineUsersData = async () => {
    try {
      setOnlineLoading(true)
      const response = await fetch('/api/analytics/sessions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch online users data')
      }
      
      const result = await response.json()
      setOnlineData(result)
    } catch (error) {
      toast("錯誤", {
        description: "無法獲取線上用戶數據",
      })
      console.error("Error fetching online users:", error)
    } finally {
      setOnlineLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
    fetchOnlineUsersData()

    // 每 30 秒更新一次在線用戶數據
    const interval = setInterval(() => {
      fetchOnlineUsersData()
    }, 30 * 1000)

    return () => clearInterval(interval)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系統分析</h1>
          <p className="text-muted-foreground">學伴、管理員數據及使用情況分析</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              fetchAnalyticsData();
              fetchOnlineUsersData();
            }}
            disabled={loading || onlineLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading || onlineLoading ? 'animate-spin' : ''}`} />
            重新整理
          </Button>
        </div>
      </div>

      {/* Online Users Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              當前在線用戶數
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-sky-500"></span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {onlineLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">
                {onlineData?.online.byRole.total || 0} 
                {data && <span className="text-base ml-1 text-muted-foreground font-normal">/ {data.totalAdmins + data.totalTeachers + data.totalManagers + data.totalRoot}</span>}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              在線大學伴
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-sky-500"></span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {onlineLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">
                {onlineData?.online.byRole.teachers || 0}
                {data && <span className="text-base ml-1 text-muted-foreground font-normal">/ {data.totalTeachers}</span>}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              在線管理員
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-sky-500"></span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {onlineLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">
                {(onlineData?.online.byRole.admins || 0) + 
                 (onlineData?.online.byRole.managers || 0) + 
                 (onlineData?.online.byRole.root || 0)}
                {data && <span className="text-base ml-1 text-muted-foreground font-normal">/ {data.totalAdmins + data.totalManagers + data.totalRoot}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">總小學伴人數</CardTitle>
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

      {/* Online Users List */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              當前在線用戶
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-sky-500"></span>
              </div>
            </CardTitle>
            <CardDescription>最近 15 分鐘內活躍的用戶</CardDescription>
          </CardHeader>
          <CardContent>
            {onlineLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-32 w-full" />
              </div>
            ) : onlineData?.online.users && onlineData.online.users.length > 0 ? (
              <div className="rounded-md border">
                <div className="grid grid-cols-4 p-3 bg-muted/50">
                  <div className="font-medium">用戶名稱</div>
                  <div className="font-medium">角色</div>
                  <div className="font-medium col-span-2">最後活動時間</div>
                </div>
                <div className="divide-y">
                  {onlineData.online.users.map((user) => (
                    <div key={user.id} className="grid grid-cols-4 p-3">
                      <div>{user.name}</div>
                      <div>
                        {getRoleDisplay(user.role)}
                      </div>
                      <div className="col-span-2">{formatRelativeTime(user.last_active)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                目前沒有在線用戶
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
                        最後活動: {formatRelativeTime(teacher.lastActive)}
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
