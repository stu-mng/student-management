import type { DriveFile } from '@/types/google-drive';
import type { JWT } from 'google-auth-library';
import type { drive_v3 } from 'googleapis';

// Google Drive API response types - using the actual Schema$File type
export type GoogleDriveFile = drive_v3.Schema$File;

// Google Drive service configuration
export interface GoogleDriveConfig {
  defaultFolderId: string;
  scopes: string[];
}

// Service interfaces for better separation of concerns
export interface IFileOperations {
  listFilesInFolder(folderId?: string, pageSize?: number): Promise<DriveFile[]>;
  getFile(fileId: string): Promise<DriveFile | null>;
  searchFiles(query: string, pageSize?: number): Promise<DriveFile[]>;
  moveFile(fileId: string, newParentId: string): Promise<boolean>;
  renameFile(fileId: string, newName: string): Promise<{ success: boolean; error?: string; errorCode?: string }>;
}

export interface IContentOperations {
  getFileContent(fileId: string): Promise<string>;
  getImageContent(fileId: string): Promise<Buffer>;
  getThumbnailUrl(fileId: string): string;
}

export interface IFolderOperations {
  getFolderPath(folderId: string): Promise<Array<{ id: string; name: string }>>;
  createFolder(name: string, parentFolderId: string): Promise<DriveFile | null>;
}

export interface IUploadOperations {
  uploadFile(file: File, parentFolderId: string): Promise<DriveFile | null>;
}

export interface IDeleteOperations {
  deleteFile(fileId: string): Promise<boolean>;
  deleteFolder(folderId: string): Promise<boolean>;
  moveToTrash(fileId: string): Promise<{ success: boolean; error?: string; errorCode?: string }>;
  restoreFromTrash(fileId: string): Promise<{ success: boolean; error?: string; errorCode?: string }>;
}

export interface IUtilityOperations {
  formatFileSize(bytes: number): string;
  checkServiceStatus(): Promise<boolean>;
  getDefaultFolderId(): string;
}

// Google Drive service instance types
export type GoogleDriveInstance = drive_v3.Drive;
export type GoogleAuthInstance = JWT;
