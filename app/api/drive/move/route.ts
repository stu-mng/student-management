import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fileId, newParentId } = await request.json();

    if (!fileId || !newParentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: fileId and newParentId'
        },
        { status: 400 }
      );
    }

    // Move the file/folder to the new parent
    const success = await googleDriveService.moveFile(fileId, newParentId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'File/folder moved successfully'
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to move file/folder'
        },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('Move file/folder API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
