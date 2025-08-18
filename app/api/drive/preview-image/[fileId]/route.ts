import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 圖片預覽 API 端點
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

    // 檢查是否為圖片文件
    if (!file.mimeType.startsWith('image/')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '此檔案不是圖片類型'
        },
        { status: 400 }
      );
    }

    // 返回圖片預覽信息
    return NextResponse.json({
      success: true,
      previewUrls: {
        // 方法1: 直接下載 URL (最可靠，不需要認證)
        direct: `https://drive.google.com/uc?export=download&id=${fileId}`,
        // 方法2: 預覽 URL (需要認證，但更穩定)
        preview: `https://drive.google.com/uc?export=view&id=${fileId}`,
        // 方法3: 在 Google Drive 中開啟
        drive: `https://drive.google.com/file/d/${fileId}/view`,
        // 方法4: 使用我們的 API 代理圖片內容 (最可靠)
        api: `/api/drive/image/${fileId}`
      },
      file: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        webViewLink: file.webViewLink
      }
    });

  } catch (error: unknown) {
    console.error('圖片預覽 API 錯誤:', error);
    
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
      } else if (errorCode === 401) {
        return NextResponse.json(
          { 
            success: false, 
            error: '未授權存取此檔案'
          },
          { status: 401 }
        );
      } else if (errorCode === 403) {
        return NextResponse.json(
          { 
            success: false, 
            error: '沒有權限存取此檔案'
          },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: '圖片預覽失敗'
      },
      { status: 500 }
    );
  }
}
