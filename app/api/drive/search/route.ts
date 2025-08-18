import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// GET 請求處理器 - 搜尋檔案
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const type = searchParams.get('type'); // 檔案類型篩選
    const dateFrom = searchParams.get('dateFrom'); // 建立日期範圍
    const dateTo = searchParams.get('dateTo');

    if (!query) {
      return NextResponse.json(
        { 
          success: false, 
          error: '搜尋查詢參數 "q" 未提供'
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

    // 建立進階搜尋查詢
    let searchQuery = query;
    
    // 檔案類型篩選
    if (type) {
      if (type === 'document') {
        searchQuery += " and (mimeType contains 'application/vnd.google-apps.document' or mimeType contains 'application/pdf' or mimeType contains 'text/')";
      } else if (type === 'image') {
        searchQuery += " and mimeType contains 'image/'";
      } else if (type === 'video') {
        searchQuery += " and mimeType contains 'video/'";
      } else if (type === 'audio') {
        searchQuery += " and mimeType contains 'audio/'";
      } else if (type === 'spreadsheet') {
        searchQuery += " and mimeType contains 'application/vnd.google-apps.spreadsheet' or mimeType contains 'application/vnd.ms-excel'";
      }
    }

    // 日期範圍篩選
    if (dateFrom || dateTo) {
      let dateQuery = '';
      if (dateFrom) {
        dateQuery += ` and createdTime >= '${dateFrom}'`;
      }
      if (dateTo) {
        dateQuery += ` and createdTime <= '${dateTo}'`;
      }
      searchQuery += dateQuery;
    }

    // 排除已刪除的檔案
    searchQuery += " and trashed=false";

    // 執行搜尋
    const files = await googleDriveService.searchFiles(searchQuery, pageSize);

    // 回傳搜尋結果
    return NextResponse.json({
      success: true,
      query: searchQuery,
      count: files.length,
      pageSize,
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
    console.error('搜尋檔案錯誤:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: number }).code;
      
      if (errorCode === 400) {
        return NextResponse.json(
          { 
            success: false, 
            error: '搜尋查詢格式錯誤',
            details: error instanceof Error ? error.message : '未知錯誤'
          },
          { status: 400 }
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
            details: '服務帳戶沒有搜尋 Google Drive 的權限'
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

// 搜尋建議端點
export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: '無效的搜尋查詢'
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

    // 執行快速搜尋取得建議
    const suggestions = await googleDriveService.searchFiles(query, limit);

    return NextResponse.json({
      success: true,
      query,
      suggestions: suggestions.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
      }))
    });

  } catch (error: unknown) {
    console.error('搜尋建議錯誤:', error);
    
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
