import { google } from 'googleapis';
import { ERROR_MESSAGES, GOOGLE_DRIVE_CONFIG } from './config';
import type { GoogleAuthInstance, GoogleDriveInstance } from './types';

// Google Drive authentication service
export class GoogleDriveAuth {
  private auth: GoogleAuthInstance | null = null;
  private drive: GoogleDriveInstance | null = null;

  // Initialize Google Drive authentication
  async initialize(): Promise<{ auth: GoogleAuthInstance; drive: GoogleDriveInstance }> {
    try {
      const serviceAccountKeyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountKeyBase64) {
        throw new Error(ERROR_MESSAGES.MISSING_SERVICE_ACCOUNT_KEY);
      }

      // Decode base64 key
      const serviceAccountKey = JSON.parse(
        Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8')
      );

      // Create JWT authentication
      this.auth = new google.auth.JWT({
        email: serviceAccountKey.client_email,
        key: serviceAccountKey.private_key,
        scopes: GOOGLE_DRIVE_CONFIG.scopes,
      });

      // Initialize Drive API
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      return { auth: this.auth, drive: this.drive };
    } catch (error) {
      console.error(ERROR_MESSAGES.INITIALIZATION_FAILED + ':', error);
      throw error;
    }
  }

  // Get current auth instance
  getAuth(): GoogleAuthInstance | null {
    return this.auth;
  }

  // Get current drive instance
  getDrive(): GoogleDriveInstance | null {
    return this.drive;
  }

  // Check if service is initialized
  isInitialized(): boolean {
    return this.auth !== null && this.drive !== null;
  }
}
