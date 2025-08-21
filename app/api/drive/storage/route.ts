import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// GET 請求處理器 - 取得儲存空間使用量
export async function GET(_request: NextRequest) {
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

    // 獲取儲存空間配額資訊
    const storageQuota = await googleDriveService.getStorageQuota();

    return NextResponse.json({
      success: true,
      data: storageQuota
    });

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
