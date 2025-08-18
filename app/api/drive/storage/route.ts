import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// GET 請求處理器 - 取得儲存空間使用量
export async function GET(request: NextRequest) {
  try {
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

    // 注意：getStorageQuota 方法已被移除，此端點暫時停用
    return NextResponse.json(
      { 
        success: false, 
        error: '儲存空間查詢功能已停用',
        details: '此功能已整合到主要 API 端點中'
      },
      { status: 501 }
    );

  } catch (error: unknown) {
    console.error('取得儲存空間資訊錯誤:', error);
    
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
            details: '服務帳戶沒有存取儲存空間資訊的權限'
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

// 健康檢查端點
export async function HEAD() {
  try {
    const isHealthy = await googleDriveService.checkServiceStatus();
    return new NextResponse(null, { 
      status: isHealthy ? 200 : 503 
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
