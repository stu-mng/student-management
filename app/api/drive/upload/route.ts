import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// POST 請求處理器 - 上傳檔案
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const parentFolderId = formData.get('parentFolderId') as string;

    if (!file || !parentFolderId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '檔案和父資料夾 ID 都是必需的'
        },
        { status: 400 }
      );
    }

    // 檢查服務狀態
    const isServiceHealthy = await googleDriveService.checkServiceStatus();
    if (!isServiceHealthy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google Drive 服務不可用'
        },
        { status: 503 }
      );
    }

    // 上傳檔案
    const uploadedFile = await googleDriveService.uploadFile(file, parentFolderId);

    if (!uploadedFile) {
      return NextResponse.json(
        { 
          success: false, 
          error: '上傳檔案失敗'
        },
        { status: 500 }
      );
    }

    // 回傳上傳的檔案資訊
    return NextResponse.json({
      success: true,
      file: uploadedFile
    });

  } catch (error: unknown) {
    console.error('上傳檔案錯誤:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: number }).code;
      
      if (errorCode === 401) {
        return NextResponse.json(
          { 
            success: false, 
            error: '認證失敗',
            details: '服務帳戶金鑰無效或權限不足'
          },
          { status: 401 }
        );
      }
      
      if (errorCode === 403) {
        return NextResponse.json(
          { 
            success: false, 
            error: '權限不足',
            details: '服務帳戶沒有在此資料夾上傳檔案的權限'
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: '內部伺服器錯誤',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}
