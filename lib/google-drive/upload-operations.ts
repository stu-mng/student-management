import type { DriveFile } from '@/types/google-drive';
import { PassThrough } from 'stream';
import { API_CONSTANTS, ERROR_MESSAGES } from './config';
import type { GoogleDriveInstance, IUploadOperations } from './types';
import { mapGoogleDriveFileToDriveFile } from './utils';

// Upload operations service for Google Drive
export class UploadOperations implements IUploadOperations {
  constructor(private drive: GoogleDriveInstance) {}

  // Upload file
  async uploadFile(file: File, parentFolderId: string): Promise<DriveFile | null> {
    try {
      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const fileMetadata = {
        name: file.name,
        parents: [parentFolderId]
      };

      // Use PassThrough stream to handle file content
      const stream = new PassThrough();
      stream.end(buffer);

      const media = {
        mimeType: file.type,
        body: stream
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: API_CONSTANTS.FILE_FIELDS,
        supportsAllDrives: true,
      });

      const uploadedFile = response.data;
      return mapGoogleDriveFileToDriveFile(uploadedFile);
    } catch (error) {
      console.error(`${ERROR_MESSAGES.UPLOAD_FAILED}: ${file.name}`, error);
      throw error;
    }
  }
}
