import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 圖片代理 API 端點 - 通過我們的服務器提供 Google Drive 圖片
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

    try {
      // 使用 Google Drive API 下載圖片內容
      const imageBuffer = await googleDriveService.getImageContent(fileId);

      // 設置適當的響應頭
      const headers = new Headers();
      headers.set('Content-Type', file.mimeType);
      headers.set('Content-Disposition', `inline; filename="${file.name}"`);
      headers.set('Cache-Control', 'public, max-age=3600'); // 1小時緩存
      
      // 返回圖片內容 - 將 Buffer 轉換為 Uint8Array
      return new NextResponse(new Uint8Array(imageBuffer), {
        status: 200,
        headers
      });

    } catch (contentError) {
      console.error('獲取圖片內容失敗:', contentError);
      
      // 如果直接獲取失敗，嘗試重定向到 Google Drive 的預覽 URL
      const previewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      
      return NextResponse.redirect(previewUrl, 302);
    }

  } catch (error: unknown) {
    console.error('圖片代理 API 錯誤:', error);
    
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
        error: '圖片載入失敗'
      },
      { status: 500 }
    );
  }
}
