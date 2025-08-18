import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { BreadcrumbItem } from "./types"

interface BreadcrumbNavigationProps {
  breadcrumbs: BreadcrumbItem[]
  onNavigate: (folderId: string) => void
}

export function BreadcrumbNavigation({ breadcrumbs, onNavigate }: BreadcrumbNavigationProps) {
  const router = useRouter()

  const handleBreadcrumbClick = (index: number) => {
    const targetBreadcrumbs = breadcrumbs.slice(0, index + 1)
    const targetFolder = targetBreadcrumbs[targetBreadcrumbs.length - 1]?.id
    
    if (targetFolder) {
      router.push(`/dashboard/drive/folders/${targetFolder}`)
      onNavigate(targetFolder)
    } else {
      router.push('/dashboard/drive/folders/1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo')
      onNavigate('1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo')
    }
  }

  if (breadcrumbs.length === 0) {
    return <span className="text-muted-foreground">載入中...</span>
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBreadcrumbClick(index)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            {crumb.name}
          </Button>
          {index < breadcrumbs.length - 1 && <span>/</span>}
        </div>
      ))}
    </div>
  )
}
