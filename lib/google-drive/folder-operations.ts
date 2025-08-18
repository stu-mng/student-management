import type { DriveFile } from '@/types/google-drive';
import { API_CONSTANTS, ERROR_MESSAGES } from './config';
import type { GoogleDriveInstance, IFolderOperations } from './types';
import { mapGoogleDriveFileToDriveFile } from './utils';

// Folder operations service for Google Drive
export class FolderOperations implements IFolderOperations {
  constructor(
    private drive: GoogleDriveInstance, 
    private defaultFolderId: string,
    private getFile: (fileId: string) => Promise<DriveFile | null>
  ) {}

  // Get complete folder path (breadcrumb)
  async getFolderPath(folderId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const path: Array<{ id: string; name: string }> = [];
      let currentId = folderId;
      
      // Recursively get parent folders until root
      while (currentId && currentId !== this.defaultFolderId) {
        const folder = await this.getFile(currentId);
        if (folder && folder.parents && folder.parents.length > 0) {
          path.unshift({ id: folder.id, name: folder.name });
          currentId = folder.parents[0];
        } else if (folder) {
          // If no parent folder, add current folder and stop
          path.unshift({ id: folder.id, name: folder.name });
          break;
        } else {
          break;
        }
      }
      
      // Add root folder (default folder)
      if (currentId === this.defaultFolderId) {
        // Remove "My Files" prefix, use folder name directly
        const rootFolder = await this.getFile(this.defaultFolderId);
        if (rootFolder) {
          path.unshift({ id: this.defaultFolderId, name: rootFolder.name });
        }
      }
      
      return path;
    } catch (error) {
      console.error(`${ERROR_MESSAGES.GET_FOLDER_PATH_FAILED}: ${folderId}`, error);
      // If getting path fails, at least return current folder
      try {
        const currentFolder = await this.getFile(folderId);
        if (currentFolder) {
          return [{ id: folderId, name: currentFolder.name }];
        }
      } catch (e) {
        console.error(ERROR_MESSAGES.CANNOT_GET_CURRENT_FOLDER + ':', e);
      }
      return [{ id: folderId, name: ERROR_MESSAGES.UNKNOWN_FOLDER }];
    }
  }

  // Create new folder
  async createFolder(name: string, parentFolderId: string): Promise<DriveFile | null> {
    try {
      const fileMetadata = {
        name,
        mimeType: API_CONSTANTS.FOLDER_MIME_TYPE,
        parents: [parentFolderId]
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: API_CONSTANTS.FILE_FIELDS,
        supportsAllDrives: true,
      });

      const folder = response.data;
      return mapGoogleDriveFileToDriveFile(folder);
    } catch (error) {
      console.error(`${ERROR_MESSAGES.CREATE_FOLDER_FAILED}: ${name}`, error);
      throw error;
    }
  }
}
