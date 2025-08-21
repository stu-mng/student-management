import type { DriveFile } from '@/types/google-drive';
import { ERROR_MESSAGES } from './config';
import type { GoogleDriveInstance, IUtilityOperations, StorageQuota } from './types';
import { formatFileSize } from './utils';

// Utility operations service for Google Drive
export class UtilityOperations implements IUtilityOperations {
  constructor(
    private defaultFolderId: string,
    private listFilesInFolder: (folderId?: string, pageSize?: number) => Promise<DriveFile[]>,
    private driveInstance: GoogleDriveInstance
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
    return formatFileSize(bytes);
  }

  // Get storage quota information
  async getStorageQuota(): Promise<StorageQuota> {
    try {
      const response = await this.driveInstance.about.get({
        fields: 'storageQuota'
      });

      const quota = response.data.storageQuota;
      
      if (!quota) {
        throw new Error('Storage quota information not available');
      }

      const limit = parseInt(quota.limit || '0');
      const usage = parseInt(quota.usage || '0');
      const usageInDrive = parseInt(quota.usageInDrive || '0');
      const usageInDriveTrash = parseInt(quota.usageInDriveTrash || '0');
      
      const usagePercentage = limit > 0 ? Math.round((usage / limit) * 100) : 0;

      return {
        limit: quota.limit || '0',
        usage: quota.usage || '0',
        usageInDrive: quota.usageInDrive || '0',
        usageInDriveTrash: quota.usageInDriveTrash || '0',
        limitFormatted: formatFileSize(limit),
        usageFormatted: formatFileSize(usage),
        usageInDriveFormatted: formatFileSize(usageInDrive),
        usageInDriveTrashFormatted: formatFileSize(usageInDriveTrash),
        usagePercentage
      };
    } catch (error) {
      console.error('Failed to get storage quota:', error);
      throw new Error('無法獲取儲存空間配額資訊');
    }
  }
}
