import type { DriveFile } from '@/types/google-drive';
import { ERROR_MESSAGES } from './config';
import type { IUtilityOperations } from './types';

// Utility operations service for Google Drive
export class UtilityOperations implements IUtilityOperations {
  constructor(
    private defaultFolderId: string,
    private listFilesInFolder: (folderId?: string, pageSize?: number) => Promise<DriveFile[]>
  ) {}

  // Check service status
  async checkServiceStatus(): Promise<boolean> {
    try {
      // Try to list files in root folder to check if service is working
      await this.listFilesInFolder(this.defaultFolderId, 1);
      return true;
    } catch (error) {
      console.error(ERROR_MESSAGES.SERVICE_STATUS_CHECK_FAILED + ':', error);
      return false;
    }
  }

  // Get default folder ID
  getDefaultFolderId(): string {
    return this.defaultFolderId;
  }

  // Format file size (moved to utils, kept here for interface compatibility)
  formatFileSize(bytes: number): string {
    // This is now handled by the utils module
    // Keeping this method for interface compatibility
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
