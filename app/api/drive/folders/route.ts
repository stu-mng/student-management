import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// POST 請求處理器 - 建立新資料夾
export async function POST(request: NextRequest) {
  try {
    const { name, parentFolderId } = await request.json();
    console.log('name', name);
    console.log('parentFolderId', parentFolderId);

    if (!name || !parentFolderId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '資料夾名稱和父資料夾 ID 都是必需的'
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

    // 建立資料夾
    const folder = await googleDriveService.createFolder(name, parentFolderId);

    if (!folder) {
      return NextResponse.json(
        { 
          success: false, 
          error: '建立資料夾失敗'
        },
        { status: 500 }
      );
    }

    // 回傳建立的資料夾資訊
    return NextResponse.json({
      success: true,
      folder
    });

  } catch (error: unknown) {
    console.error('建立資料夾錯誤:', error);
    
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
            details: '服務帳戶沒有在此資料夾建立資料夾的權限'
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
