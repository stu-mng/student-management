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
      return null;
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
}
