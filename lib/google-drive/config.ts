import type { GoogleDriveConfig } from './types';

// Google Drive service configuration
export const GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  defaultFolderId: '1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo',
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
  ]
};

// API constants
export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 100,
  SEARCH_PAGE_SIZE: 50,
  THUMBNAIL_SIZE: 'w200-h200',
  FOLDER_MIME_TYPE: 'application/vnd.google-apps.folder',
  // Fields for list operations (files listing)
  LIST_FIELDS: 'files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,parents)',
  // Fields for single file operations
  FILE_FIELDS: 'id,name,mimeType,createdTime,modifiedTime,size,webViewLink,parents'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  MISSING_SERVICE_ACCOUNT_KEY: 'GOOGLE_SERVICE_ACCOUNT_KEY 環境變數未設定',
  INITIALIZATION_FAILED: 'Google Drive 服務初始化失敗',
  LIST_FILES_FAILED: '列出資料夾內檔案失敗',
  GET_FILE_FAILED: '取得檔案失敗',
  SEARCH_FAILED: '搜尋檔案失敗',
  GET_CONTENT_FAILED: '無法獲取文件內容',
  GET_IMAGE_FAILED: '無法獲取圖片內容',
  GET_FOLDER_PATH_FAILED: '獲取資料夾路徑失敗',
  CREATE_FOLDER_FAILED: '建立資料夾失敗',
  UPLOAD_FAILED: '上傳檔案失敗',
  DELETE_FAILED: '刪除檔案失敗',
  DELETE_FOLDER_FAILED: '刪除資料夾失敗',
  MOVE_TO_TRASH_FAILED: '移動到垃圾桶失敗',
  RESTORE_FROM_TRASH_FAILED: '從垃圾桶恢復失敗',
  SERVICE_STATUS_CHECK_FAILED: 'Google Drive 服務狀態檢查失敗',
  UNKNOWN_FOLDER: '未知資料夾',
  CANNOT_GET_CURRENT_FOLDER: '無法獲取當前資料夾信息'
} as const;
