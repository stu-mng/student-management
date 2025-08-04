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

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Switch
          id="era-toggle"
          checked={isRepublicEra}
          onCheckedChange={setIsRepublicEra}
          disabled={disabled}
        />
        <Label htmlFor="era-toggle" className="text-sm">
          {isRepublicEra ? '民國年' : '西元年'}
        </Label>
      </div>
      
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
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={getDisplayDate()}
            onSelect={handleDateSelect}
            initialFocus
            locale={zhTW}
            showOutsideDays={false}
            fromYear={isRepublicEra ? 0 : 1900}
            toYear={isRepublicEra ? republicYearRange : 2100}
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