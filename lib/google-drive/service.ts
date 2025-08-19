import type { DriveFile } from '@/types/google-drive';
import { GoogleDriveAuth } from './auth';
import { GOOGLE_DRIVE_CONFIG } from './config';
import { ContentOperations } from './content-operations';
import { DeleteOperations } from './delete-operations';
import { FileOperations } from './file-operations';
import { FolderOperations } from './folder-operations';
import type {
    IContentOperations,
    IDeleteOperations,
    IFileOperations,
    IFolderOperations,
    IUploadOperations,
    IUtilityOperations
} from './types';
import { UploadOperations } from './upload-operations';
import { UtilityOperations } from './utility-operations';

// Main Google Drive service class that orchestrates all operations
export class GoogleDriveService implements 
  IFileOperations, 
  IContentOperations, 
  IFolderOperations, 
  IUploadOperations, 
  IDeleteOperations,
  IUtilityOperations 
{
  private auth: GoogleDriveAuth;
  private fileOperations!: FileOperations;
  private contentOperations!: ContentOperations;
  private folderOperations!: FolderOperations;
  private uploadOperations!: UploadOperations;
  private deleteOperations!: DeleteOperations;
  private utilityOperations!: UtilityOperations;
  private defaultFolderId: string;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.auth = new GoogleDriveAuth();
    this.defaultFolderId = GOOGLE_DRIVE_CONFIG.defaultFolderId;
    // Start initialization but don't wait for it
    this.initializationPromise = this.initialize();
  }

  // Initialize the service
  private async initialize(): Promise<void> {
    try {
      const { drive } = await this.auth.initialize();
      
      // Initialize all operation modules
      this.fileOperations = new FileOperations(drive, this.defaultFolderId);
      this.contentOperations = new ContentOperations(drive);
      this.folderOperations = new FolderOperations(drive, this.defaultFolderId, this.getFile.bind(this));
      this.uploadOperations = new UploadOperations(drive);
      this.deleteOperations = new DeleteOperations(drive);
      this.utilityOperations = new UtilityOperations(this.defaultFolderId, this.listFilesInFolder.bind(this));
      
      this.initialized = true;
    } catch (error) {
      console.error('Google Drive service initialization failed:', error);
      throw error;
    }
  }

  // Wait for initialization to complete
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  // File Operations
  async listFilesInFolder(folderId?: string, pageSize?: number): Promise<DriveFile[]> {
    await this.ensureInitialized();
    return this.fileOperations.listFilesInFolder(folderId, pageSize);
  }

  async getFile(fileId: string): Promise<DriveFile | null> {
    await this.ensureInitialized();
    return this.fileOperations.getFile(fileId);
  }

  async searchFiles(query: string, pageSize?: number): Promise<DriveFile[]> {
    await this.ensureInitialized();
    return this.fileOperations.searchFiles(query, pageSize);
  }

  async moveFile(fileId: string, newParentId: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.fileOperations.moveFile(fileId, newParentId);
  }

  async renameFile(fileId: string, newName: string): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    await this.ensureInitialized();
    return this.fileOperations.renameFile(fileId, newName);
  }

  // Content Operations
  async getFileContent(fileId: string): Promise<string> {
    await this.ensureInitialized();
    return this.contentOperations.getFileContent(fileId);
  }

  async getImageContent(fileId: string): Promise<Buffer> {
    await this.ensureInitialized();
    return this.contentOperations.getImageContent(fileId);
  }

  getThumbnailUrl(fileId: string): string {
    return this.contentOperations.getThumbnailUrl(fileId);
  }

  // Folder Operations
  async getFolderPath(folderId: string): Promise<Array<{ id: string; name: string }>> {
    await this.ensureInitialized();
    return this.folderOperations.getFolderPath(folderId);
  }

  async createFolder(name: string, parentFolderId: string): Promise<DriveFile | null> {
    await this.ensureInitialized();
    return this.folderOperations.createFolder(name, parentFolderId);
  }

  // Upload Operations
  async uploadFile(file: File, parentFolderId: string): Promise<DriveFile | null> {
    await this.ensureInitialized();
    return this.uploadOperations.uploadFile(file, parentFolderId);
  }

  // Delete Operations
  async deleteFile(fileId: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.deleteOperations.deleteFile(fileId);
  }

  async deleteFolder(folderId: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.deleteOperations.deleteFolder(folderId);
  }

  async moveToTrash(fileId: string): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    await this.ensureInitialized();
    return this.deleteOperations.moveToTrash(fileId);
  }

  async restoreFromTrash(fileId: string): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    await this.ensureInitialized();
    return this.deleteOperations.restoreFromTrash(fileId);
  }

  // Utility Operations
  async checkServiceStatus(): Promise<boolean> {
    await this.ensureInitialized();
    return this.utilityOperations.checkServiceStatus();
  }

  getDefaultFolderId(): string {
    return this.utilityOperations.getDefaultFolderId();
  }

  formatFileSize(bytes: number): string {
    return this.utilityOperations.formatFileSize(bytes);
  }

  // Additional utility methods
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Create global instance
export const googleDriveService = new GoogleDriveService();
