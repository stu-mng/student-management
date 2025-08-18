import { googleDriveService } from '@/lib/google-drive';
import type { DriveFile } from '@/types/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 統一的 Google Drive API 端點
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

    // 從查詢參數取得選項
    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    const query = searchParams.get('query') || '';
    const folderId = searchParams.get('folderId');

    let files: DriveFile[] = [];
    
    if (query) {
      // 搜尋檔案
      files = await googleDriveService.searchFiles(query, pageSize);
    } else if (folderId) {
      // 列出指定資料夾中的檔案
      files = await googleDriveService.listFilesInFolder(folderId, pageSize);
    } else {
      // 列出預設資料夾中的檔案
      files = await googleDriveService.listFilesInFolder(undefined, pageSize);
    }

    // 回傳 JSON 格式的檔案列表
    return NextResponse.json({
      success: true,
      count: files.length,
      defaultFolderId: googleDriveService.getDefaultFolderId(),
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        size: file.size,
        webViewLink: file.webViewLink,
        parents: file.parents,
      }))
    });

  } catch (error: unknown) {
    console.error('Google Drive API 錯誤:', error);
    
    // 根據錯誤類型回傳適當的錯誤訊息
    if (error instanceof Error && error.message?.includes('GOOGLE_SERVICE_ACCOUNT_KEY')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '服務帳戶金鑰未設定',
          details: '請檢查 GOOGLE_SERVICE_ACCOUNT_KEY 環境變數'
        },
        { status: 500 }
      );
    }
    
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
            details: '服務帳戶沒有存取 Google Drive 的權限'
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
