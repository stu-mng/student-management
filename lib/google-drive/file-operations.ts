import type { DriveFile } from '@/types/google-drive';
import { API_CONSTANTS, ERROR_MESSAGES } from './config';
import type { GoogleDriveInstance, IFileOperations } from './types';
import { mapGoogleDriveFileToDriveFile } from './utils';

// File operations service for Google Drive
export class FileOperations implements IFileOperations {
  constructor(private drive: GoogleDriveInstance, private defaultFolderId: string) {}

  // List files in a folder
  async listFilesInFolder(folderId?: string, pageSize: number = API_CONSTANTS.DEFAULT_PAGE_SIZE): Promise<DriveFile[]> {
    try {
      const targetFolderId = folderId || this.defaultFolderId;
      const query = `'${targetFolderId}' in parents and trashed=false`;
      
      const response = await this.drive.files.list({
        pageSize,
        q: query,
        fields: API_CONSTANTS.LIST_FIELDS,
        orderBy: 'name',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });

      return (response.data.files || []).map(mapGoogleDriveFileToDriveFile);
    } catch (error) {
      console.error(`${ERROR_MESSAGES.LIST_FILES_FAILED}: ${folderId || this.defaultFolderId}`, error);
      throw error;
    }
  }

  // Get specific file information
  async getFile(fileId: string): Promise<DriveFile | null> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: API_CONSTANTS.FILE_FIELDS,
        supportsAllDrives: true,
      });

      const file = response.data;
      return mapGoogleDriveFileToDriveFile(file);
    } catch (error) {
      console.error(`${ERROR_MESSAGES.GET_FILE_FAILED}: ${fileId}`, error);
      throw error;
    }
  }

  // Search files
  async searchFiles(query: string, pageSize: number = API_CONSTANTS.SEARCH_PAGE_SIZE): Promise<DriveFile[]> {
    try {
      const response = await this.drive.files.list({
        pageSize,
        q: query,
        fields: API_CONSTANTS.LIST_FIELDS,
        orderBy: 'modifiedTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      return (response.data.files || []).map(mapGoogleDriveFileToDriveFile);
    } catch (error) {
      console.error(ERROR_MESSAGES.SEARCH_FAILED + ':', error);
      throw error;
    }
  }

  // Move file/folder to a new parent
  async moveFile(fileId: string, newParentId: string): Promise<boolean> {
    try {
      // First, get the current file to check if it's already in the target folder
      const file = await this.getFile(fileId);
      if (!file) {
        console.error(`File not found: ${fileId}`);
        return false;
      }

      // Check if the file is already in the target folder
      if (file.parents && file.parents.includes(newParentId)) {
        console.log(`File ${fileId} is already in folder ${newParentId}`);
        return true;
      }

      // Move the file to the new parent
      await this.drive.files.update({
        fileId,
        addParents: newParentId,
        removeParents: file.parents ? file.parents.join(',') : undefined,
        fields: 'id, name, parents',
        supportsAllDrives: true,
      });

      console.log(`Successfully moved file ${fileId} to folder ${newParentId}`);
      return true;
    } catch (error) {
      console.error(`Failed to move file ${fileId} to folder ${newParentId}:`, error);
      return false;
    }
  }

  // Rename file/folder
  async renameFile(fileId: string, newName: string): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    try {
      // First, get the current file to check if it exists
      const file = await this.getFile(fileId);
      if (!file) {
        return {
          success: false,
          error: '檔案不存在',
          errorCode: 'FILE_NOT_FOUND'
        };
      }

      // Update the file name
      await this.drive.files.update({
        fileId,
        requestBody: {
          name: newName
        },
        fields: 'id, name',
        supportsAllDrives: true,
      });

      console.log(`Successfully renamed file ${fileId} to "${newName}"`);
      return { success: true };
    } catch (error: any) {
      console.error(`Failed to rename file ${fileId}:`, error);
      
      // Handle specific error cases
      if (error.code === 403) {
        return {
          success: false,
          error: '權限不足，無法重新命名此檔案',
          errorCode: 'PERMISSION_DENIED'
        };
      }
      
      if (error.code === 404) {
        return {
          success: false,
          error: '檔案不存在或已被刪除',
          errorCode: 'FILE_NOT_FOUND'
        };
      }

      return {
        success: false,
        error: '重新命名檔案時發生錯誤',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }
}
