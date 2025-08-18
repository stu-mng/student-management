// Google Drive API 精簡類型定義

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  parents?: string[];
}

export interface DriveApiResponse {
  success: boolean;
  count: number;
  files: DriveFile[];
  error?: string;
  details?: string;
}

export interface DriveListParams {
  pageSize?: number;
  query?: string;
  orderBy?: string;
  folderId?: string;
}
