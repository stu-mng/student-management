import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 獲取文件內容 API 端點
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

    // 獲取文件信息
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

    // 檢查是否為文本文件
    if (!file.mimeType.startsWith('text/')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '此檔案類型不支援內容預覽'
        },
        { status: 400 }
      );
    }

    // 嘗試獲取文件內容
    try {
      // 使用 Google Drive API 下載文件內容
      const content = await googleDriveService.getFileContent(fileId);
      
      return NextResponse.json({
        success: true,
        content: content,
        file: {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size
        }
      });

    } catch (contentError) {
      console.error('獲取文件內容失敗:', contentError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: '無法獲取文件內容',
          details: '文件可能被加密或權限不足'
        },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('獲取文件內容錯誤:', error);
    
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
