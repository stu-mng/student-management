"use client"

import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "選擇日期", 
  disabled = false,
  className 
}: DatePickerProps) {
  const [isRepublicEra, setIsRepublicEra] = React.useState(false)
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth())

  // 計算民國年範圍
  const currentYear = new Date().getFullYear()
  const republicYearRange = currentYear - 1911

  // 轉換西元年為民國年
  const convertToRepublicYear = (date: Date): Date => {
    const westernYear = date.getFullYear()
    const republicYear = westernYear - 1911
    const newDate = new Date(date)
    newDate.setFullYear(republicYear)
    return newDate
  }

  // 轉換民國年為西元年
  const convertToWesternYear = (date: Date): Date => {
    const republicYear = date.getFullYear()
    const westernYear = republicYear + 1911
    const newDate = new Date(date)
    newDate.setFullYear(westernYear)
    return newDate
  }

  // 處理日期選擇
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange?.(undefined)
      return
    }

    if (isRepublicEra) {
      // 如果使用民國年，需要轉換為西元年存儲
      const westernDate = convertToWesternYear(selectedDate)
      onChange?.(westernDate)
    } else {
      onChange?.(selectedDate)
    }
  }

  // 獲取顯示用的日期
  const getDisplayDate = (): Date | undefined => {
    if (!value) return undefined
    
    if (isRepublicEra) {
      return convertToRepublicYear(value)
    }
    return value
  }

  // 格式化顯示文字
  const formatDisplayText = (date: Date): string => {
    if (isRepublicEra) {
      const republicYear = date.getFullYear()
      return format(date, `民國 ${republicYear} 年 MM 月 dd 日`, { locale: zhTW })
    } else {
      return format(date, 'yyyy 年 MM 月 dd 日', { locale: zhTW })
    }
  }

  // 生成年份選項
  const generateYearOptions = () => {
    const years = []
    const startYear = isRepublicEra ? 0 : 1900
    const endYear = isRepublicEra ? republicYearRange : currentYear // 限制到今年
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year)
    }
    return years
  }

  // 生成月份選項
  const generateMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => i)
  }

  // 處理年份變更
  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year)
    setSelectedYear(yearNum)
    
    // 更新當前顯示的日期
    const currentDate = getDisplayDate()
    if (currentDate) {
      const newDate = new Date(currentDate)
      newDate.setFullYear(yearNum)
      newDate.setMonth(selectedMonth)
      handleDateSelect(newDate)
    }
  }

  // 處理月份變更
  const handleMonthChange = (month: string) => {
    const monthNum = parseInt(month)
    setSelectedMonth(monthNum)
    
    // 更新當前顯示的日期
    const currentDate = getDisplayDate()
    if (currentDate) {
      const newDate = new Date(currentDate)
      newDate.setFullYear(selectedYear)
      newDate.setMonth(monthNum)
      handleDateSelect(newDate)
    }
  }

  // 更新選中的年月
  React.useEffect(() => {
    const displayDate = getDisplayDate()
    if (displayDate) {
      setSelectedYear(displayDate.getFullYear())
      setSelectedMonth(displayDate.getMonth())
    } else {
      // 如果沒有選中的日期，設定為當前日期
      const now = new Date()
      if (isRepublicEra) {
        setSelectedYear(now.getFullYear() - 1911)
      } else {
        setSelectedYear(now.getFullYear())
      }
      setSelectedMonth(now.getMonth())
    }
  }, [value, isRepublicEra])

  // 處理西元年/民國年切換
  const handleEraToggle = (checked: boolean) => {
    setIsRepublicEra(checked)
    
    // 不重置已選擇的日期，只更新顯示用的年份
    const displayDate = getDisplayDate()
    if (displayDate) {
      // 如果已經有選中的日期，只更新顯示用的年份
      setSelectedYear(displayDate.getFullYear())
      setSelectedMonth(displayDate.getMonth())
    } else {
      // 如果沒有選中的日期，設定為當前日期
      const now = new Date()
      if (checked) {
        // 切換到民國年，顯示民國年格式
        setSelectedYear(now.getFullYear() - 1911)
      } else {
        // 切換到西元年，顯示西元年格式
        setSelectedYear(now.getFullYear())
      }
      setSelectedMonth(now.getMonth())
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDisplayText(getDisplayDate()!) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          {/* 西元年/民國年切換 */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <Label className="text-sm font-medium">日期格式</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="era-toggle"
                checked={isRepublicEra}
                onCheckedChange={handleEraToggle}
                disabled={disabled}
              />
              <Label htmlFor="era-toggle" className="text-sm">
                {isRepublicEra ? '民國年' : '西元年'}
              </Label>
            </div>
          </div>
          
          {/* 年份和月份快速選擇 */}
          <div className="flex space-x-2 mb-4">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">年份</Label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateYearOptions().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {isRepublicEra ? `民國 ${year} 年` : `${year} 年`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">月份</Label>
              <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2024, month), 'M 月', { locale: zhTW })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 日曆 */}
          <Calendar
            mode="single"
            selected={getDisplayDate()}
            onSelect={handleDateSelect}
            initialFocus
            locale={zhTW}
            showOutsideDays={false}
            fromYear={isRepublicEra ? 0 : 1900}
            toYear={isRepublicEra ? republicYearRange : currentYear}
            month={new Date(selectedYear, selectedMonth)}
            onMonthChange={(date) => {
              setSelectedYear(date.getFullYear())
              setSelectedMonth(date.getMonth())
            }}
            classNames={{
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 