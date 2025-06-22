"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import type { FormSectionWithId } from "./form-context"

interface FormSectionNavigationProps {
  sections: FormSectionWithId[]
  currentSectionIndex: number
  onSectionChange: (index: number) => void
  onAddSection?: () => void
  showAddButton?: boolean
  className?: string
}

export function FormSectionNavigation({
  sections,
  currentSectionIndex,
  onSectionChange,
  onAddSection,
  showAddButton = false,
  className = ""
}: FormSectionNavigationProps) {
  const currentSection = sections[currentSectionIndex]
  const isFirstSection = currentSectionIndex === 0
  const isLastSection = currentSectionIndex === sections.length - 1

  const handlePrevious = () => {
    if (!isFirstSection) {
      onSectionChange(currentSectionIndex - 1)
    }
  }

  const handleNext = () => {
    if (!isLastSection) {
      onSectionChange(currentSectionIndex + 1)
    }
  }

  // 如果沒有分段，不顯示導航
  if (sections.length === 0) {
    return showAddButton ? (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Button
              onClick={onAddSection}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              新增第一個區段
            </Button>
          </div>
        </CardContent>
      </Card>
    ) : null
  }

  // 如果只有一個分段且沒有標題，不顯示導航（向後兼容）
  if (sections.length === 1 && !currentSection?.title && !showAddButton) {
    return null
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* 左側：上一頁按鈕 */}
          <Button
            onClick={handlePrevious}
            disabled={isFirstSection}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            上一頁
          </Button>

          {/* 中間：分段資訊 */}
          <div className="flex-1 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">
                第 {currentSectionIndex + 1} 頁，共 {sections.length} 頁
              </Badge>
              {showAddButton && (
                <Button
                  onClick={onAddSection}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  新增區段
                </Button>
              )}
            </div>
            
            {currentSection && (
              <div className="space-y-1">
                {currentSection.title && (
                  <h3 className="font-medium text-lg">{currentSection.title}</h3>
                )}
                {currentSection.description && (
                  <p className="text-sm text-muted-foreground">{currentSection.description}</p>
                )}
              </div>
            )}
          </div>

          {/* 右側：下一頁按鈕 */}
          <Button
            onClick={handleNext}
            disabled={isLastSection}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            下一頁
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 分段指示器 */}
        {sections.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {sections.map((_, index) => (
              <button
                key={index}
                onClick={() => onSectionChange(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSectionIndex
                    ? 'bg-primary'
                    : 'bg-muted hover:bg-muted-foreground/20'
                }`}
                aria-label={`跳轉到第 ${index + 1} 頁`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 