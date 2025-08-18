import { ERROR_MESSAGES } from './config';
import type { GoogleDriveFile, GoogleDriveInstance } from './types';

// Define a proper error interface
interface GoogleDriveError {
  code?: number;
  message?: string;
}

export class DeleteOperations {
  constructor(private drive: GoogleDriveInstance) {}

  // Delete a file permanently
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.drive.files.delete({
        fileId,
        supportsAllDrives: true,
      });
      
      console.log(`檔案已永久刪除: ${fileId}`);
      return true;
    } catch (error) {
      console.error(`${ERROR_MESSAGES.DELETE_FAILED}: ${fileId}`, error);
      throw error;
    }
  }

  // Delete a folder and all its contents permanently
  async deleteFolder(folderId: string): Promise<boolean> {
    try {
      const allFiles = await this.getAllFilesInFolderRecursively(folderId);
      
      // Delete all files first
      for (const file of allFiles) {
        try {
          await this.drive.files.delete({
            fileId: file.id!,
            supportsAllDrives: true,
          });
        } catch (fileError) {
          console.warn(`無法刪除檔案 ${file.id}:`, fileError);
        }
      }
      
      // Finally delete the folder itself
      await this.drive.files.delete({
        fileId: folderId,
        supportsAllDrives: true,
      });
      
      console.log(`資料夾已永久刪除: ${folderId}`);
      return true;
    } catch (error) {
      console.error(`${ERROR_MESSAGES.DELETE_FOLDER_FAILED}: ${folderId}`, error);
      throw error;
    }
  }

  // Move a file to trash (soft delete)
  async moveToTrash(fileId: string): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    try {
      await this.drive.files.update({
        fileId,
        requestBody: {
          trashed: true
        },
        supportsAllDrives: true,
      });
      
      console.log(`檔案已移動到垃圾桶: ${fileId}`);
      return { success: true };
    } catch (error: unknown) {
      // Handle specific permission errors
      if (error && typeof error === 'object' && 'code' in error) {
        const driveError = error as GoogleDriveError;
        if (driveError.code === 403) {
          const errorMessage = driveError.message || '權限不足';
          console.warn(`${ERROR_MESSAGES.MOVE_TO_TRASH_FAILED}: ${fileId} - ${errorMessage}`);
          return { 
            success: false, 
            error: '您沒有權限移動此檔案到垃圾桶。請檢查檔案權限或聯繫檔案擁有者。',
            errorCode: 'PERMISSION_DENIED'
          };
        }
      }
      
      // Handle other errors
      console.error(`${ERROR_MESSAGES.MOVE_TO_TRASH_FAILED}: ${fileId}`, error);
      return { 
        success: false, 
        error: '移動檔案到垃圾桶時發生錯誤，請稍後再試。',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  // Restore a file from trash
  async restoreFromTrash(fileId: string): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    try {
      await this.drive.files.update({
        fileId,
        requestBody: {
          trashed: false
        },
        supportsAllDrives: true,
      });
      
      console.log(`檔案已從垃圾桶恢復: ${fileId}`);
      return { success: true };
    } catch (error: unknown) {
      // Handle specific permission errors
      if (error && typeof error === 'object' && 'code' in error) {
        const driveError = error as GoogleDriveError;
        if (driveError.code === 403) {
          const errorMessage = driveError.message || '權限不足';
          console.warn(`${ERROR_MESSAGES.RESTORE_FROM_TRASH_FAILED}: ${fileId} - ${errorMessage}`);
          return { 
            success: false, 
            error: '您沒有權限恢復此檔案。請檢查檔案權限或聯繫檔案擁有者。',
            errorCode: 'PERMISSION_DENIED'
          };
        }
      }
      
      // Handle other errors
      console.error(`${ERROR_MESSAGES.RESTORE_FROM_TRASH_FAILED}: ${fileId}`, error);
      return { 
        success: false, 
        error: '恢復檔案時發生錯誤，請稍後再試。',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  // Helper method to get all files in a folder recursively
  private async getAllFilesInFolderRecursively(folderId: string): Promise<GoogleDriveFile[]> {
    const allFiles: GoogleDriveFile[] = [];
    
    try {
      // Get immediate files in the folder
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,parents)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const files = response.data.files || [];
      
      for (const file of files) {
        allFiles.push(file);
        
        // If it's a folder, recursively get its contents
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          const subFiles = await this.getAllFilesInFolderRecursively(file.id!);
          allFiles.push(...subFiles);
        }
      }
    } catch (error) {
      console.error(`無法獲取資料夾內容: ${folderId}`, error);
    }
    
    return allFiles;
  }
}


