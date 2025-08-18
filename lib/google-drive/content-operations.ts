import { ERROR_MESSAGES } from './config';
import type { GoogleDriveInstance, IContentOperations } from './types';
import { generateThumbnailUrl } from './utils';

// Content operations service for Google Drive
export class ContentOperations implements IContentOperations {
  constructor(private drive: GoogleDriveInstance) {}

  // Get file content for text files
  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
        supportsAllDrives: true,
      });

      // Convert response to text
      if (response.data) {
        return response.data.toString();
      }
      
      throw new Error(ERROR_MESSAGES.GET_CONTENT_FAILED);
    } catch (error) {
      console.error(`獲取文件內容失敗: ${fileId}`, error);
      throw error;
    }
  }

  // Get thumbnail URL for grid view display
  getThumbnailUrl(fileId: string): string {
    return generateThumbnailUrl(fileId);
  }

  // Get image content for image preview
  async getImageContent(fileId: string): Promise<Buffer> {
    try {
      // Use correct Google Drive API call to get image content
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
        supportsAllDrives: true,
      });

      // Return image data - ensure Buffer type is returned
      if (response.data) {
        // Check response.data type and convert correctly
        if (Buffer.isBuffer(response.data)) {
          return response.data;
        }
        
        // If ArrayBuffer, convert directly to Buffer
        if (response.data instanceof ArrayBuffer) {
          return Buffer.from(response.data);
        }
        
        // If Uint8Array, convert to Buffer
        if (response.data instanceof Uint8Array) {
          return Buffer.from(response.data);
        }
        
        // If string, convert to Buffer
        if (typeof response.data === 'string') {
          return Buffer.from(response.data, 'binary');
        }
        
        // If object with arrayBuffer method, try to get its content
        if (response.data && typeof response.data === 'object' && 'arrayBuffer' in response.data) {
          try {
            // Try to get arrayBuffer from the object
            const arrayBuffer = await (response.data as { arrayBuffer(): Promise<ArrayBuffer> }).arrayBuffer();
            return Buffer.from(arrayBuffer);
          } catch (blobError) {
            console.error('ArrayBuffer 轉換失敗:', blobError);
            // If conversion fails, try direct conversion
            return Buffer.from(response.data as unknown as Buffer);
          }
        }
        
        // Last attempt at direct conversion
        return Buffer.from(response.data as unknown as Buffer);
      }
      
      throw new Error(ERROR_MESSAGES.GET_IMAGE_FAILED);
    } catch (error) {
      console.error(`獲取圖片內容失敗: ${fileId}`, error);
      throw error;
    }
  }
}
