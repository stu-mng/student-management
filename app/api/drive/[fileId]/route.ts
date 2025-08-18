import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// GET 請求處理器 - 取得特定檔案資訊
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '檔案 ID 未提供'
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

    // 取得檔案資訊
    const file = await googleDriveService.getFile(fileId);

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: '檔案不存在或無法存取'
        },
        { status: 404 }
      );
    }

    // 回傳檔案資訊
    return NextResponse.json({
      success: true,
      file
    });

  } catch (error: unknown) {
    console.error('取得檔案資訊錯誤:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: number }).code;
      
      if (errorCode === 404) {
        return NextResponse.json(
          { 
            success: false, 
            error: '檔案不存在'
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
            details: '服務帳戶沒有存取此檔案的權限'
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

// HEAD 請求處理器 - 檢查檔案是否存在
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    
    if (!fileId) {
      return new NextResponse(null, { status: 400 });
    }

    const file = await googleDriveService.getFile(fileId);
    return new NextResponse(null, { 
      status: file ? 200 : 404 
    });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
