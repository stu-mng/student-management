import { googleDriveService } from '@/lib/google-drive';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'trash'
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: '檔案ID是必需的' },
        { status: 400 }
      )
    }

    // 现在只支持移至垃圾桶，不再支持永久删除
    if (action === 'trash') {
      const result = await googleDriveService.moveToTrash(fileId)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: '檔案已成功移至垃圾桶'
        })
      } else {
        // Handle specific error cases
        if (result.errorCode === 'PERMISSION_DENIED') {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 403 }
          )
        } else {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 }
          )
        }
      }
    } else {
      // 如果请求永久删除，返回错误提示用户使用垃圾桶
      return NextResponse.json(
        { 
          success: false, 
          error: '永久删除功能已停用，请使用移至垃圾桶功能。您可以稍后从垃圾桶恢复文件。' 
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('移至垃圾桶失敗:', error)
    return NextResponse.json(
      { success: false, error: '移至垃圾桶時發生錯誤' },
      { status: 500 }
    )
  }
}
