import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 獲取資料夾路徑 API 端點
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;

    if (!folderId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '資料夾 ID 未提供'
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

    // 獲取資料夾路徑
    const folderPath = await googleDriveService.getFolderPath(folderId);

    return NextResponse.json({
      success: true,
      path: folderPath
    });

  } catch (error: unknown) {
    console.error('獲取資料夾路徑錯誤:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: number }).code;
      
      if (errorCode === 404) {
        return NextResponse.json(
          { 
            success: false, 
            error: '資料夾不存在'
          },
          { status: 404 }
        );
      }
      
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
            details: '服務帳戶沒有存取此資料夾的權限'
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
