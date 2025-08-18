import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 檔案預覽 API 端點
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'preview';

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

    // 根據檔案類型返回不同的預覽資訊
    const previewInfo = {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      size: file.size,
      webViewLink: file.webViewLink,
      previewUrl: file.webViewLink,
      downloadUrl: file.webViewLink,
      canPreview: canPreviewFile(file.mimeType),
      previewType: getPreviewType(file.mimeType),
      thumbnailUrl: null, // 可以擴展為支援縮圖
    };

    return NextResponse.json({
      success: true,
      file: previewInfo
    });

  } catch (error: unknown) {
    console.error('檔案預覽錯誤:', error);
    
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

// 檢查檔案是否可以預覽
function canPreviewFile(mimeType: string): boolean {
  const previewableTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'application/pdf',
    'text/',
    'image/',
    'video/',
    'audio/'
  ];
  
  return previewableTypes.some(type => mimeType.includes(type));
}

// 取得預覽類型
function getPreviewType(mimeType: string): string {
  if (mimeType.includes('document')) return 'document';
  if (mimeType.includes('spreadsheet')) return 'spreadsheet';
  if (mimeType.includes('presentation')) return 'presentation';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('text/')) return 'text';
  if (mimeType.includes('image/')) return 'image';
  if (mimeType.includes('video/')) return 'video';
  if (mimeType.includes('audio/')) return 'audio';
  return 'unknown';
}
