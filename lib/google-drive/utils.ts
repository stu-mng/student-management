import type { DriveFile } from '@/types/google-drive';
import type { GoogleDriveFile } from './types';

// Utility functions for Google Drive service

// Format file size from bytes to human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Convert Google Drive file response to DriveFile format
export function mapGoogleDriveFileToDriveFile(file: GoogleDriveFile): DriveFile {
  return {
    id: file.id || '',
    name: file.name || '',
    mimeType: file.mimeType || '',
    createdTime: file.createdTime || '',
    modifiedTime: file.modifiedTime || undefined,
    size: file.size ? formatFileSize(parseInt(file.size)) : 'N/A',
    webViewLink: file.webViewLink || undefined,
    parents: file.parents || undefined,
  };
}

// Generate thumbnail URL for images
export function generateThumbnailUrl(fileId: string, size: string = 'w200-h200'): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
}

// Check if file is an image based on MIME type
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// Check if file is a folder
export function isFolder(mimeType: string): boolean {
  return mimeType === 'application/vnd.google-apps.folder';
}

// Check if file is a text document
export function isTextDocument(mimeType: string): boolean {
  return mimeType.startsWith('text/') || 
         mimeType === 'application/json' || 
         mimeType === 'application/xml' ||
         mimeType === 'application/javascript';
}
