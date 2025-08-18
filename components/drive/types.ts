export interface DriveFile {
  id: string
  name: string
  mimeType: string
  createdTime: string
  modifiedTime?: string
  size?: string
  webViewLink?: string
  parents?: string[]
}

export interface BreadcrumbItem {
  id: string
  name: string
}

export interface ContextMenuState {
  show: boolean
  x: number
  y: number
  target: 'file' | 'empty' | null
  file?: DriveFile
}

export type ViewMode = 'grid' | 'list'
export type SortField = 'name' | 'createdTime'
export type SortDirection = 'asc' | 'desc'
