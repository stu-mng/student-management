import { createClient } from '@/database/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { checkApiPermission } from './permissions';

// 錯誤回應類型
interface ErrorResponse {
  error: string;
  code?: string;
}

// 用戶資訊類型
interface UserInfo {
  id: string;
  role: {
    name: string;
    order?: number;
  } | null;
}

/**
 * API 權限驗證中間件
 * 用於檢查用戶是否有權限訪問特定的 API 端點
 */
export async function withAuth(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options?: {
    skipAuthCheck?: boolean;
    customPermissionCheck?: (userInfo: UserInfo, context: any) => boolean | Promise<boolean>;
  }
) {
  return async (request: NextRequest, context: any = {}) => {
    try {
      // 如果跳過認證檢查，直接執行處理器
      if (options?.skipAuthCheck) {
        return await handler(request, context);
      }

      const supabase = await createClient();
      
      // 獲取當前用戶
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      // 獲取用戶角色資訊
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          role:roles(
            id,
            name,
            display_name,
            color,
            order
          )
        `)
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to fetch user information', code: 'USER_FETCH_ERROR' },
          { status: 500 }
        );
      }

      const userInfo: UserInfo = {
        id: user.id,
        role: userData.role as any,
      };

      // 如果有自定義權限檢查，使用自定義檢查
      if (options?.customPermissionCheck) {
        const hasPermission = await options.customPermissionCheck(userInfo, context);
        if (!hasPermission) {
          return NextResponse.json<ErrorResponse>(
            { error: 'Permission denied', code: 'CUSTOM_PERMISSION_DENIED' },
            { status: 403 }
          );
        }
      } else {
        // 使用標準權限檢查
        const method = request.method;
        const pathname = new URL(request.url).pathname;
        
        // 準備權限檢查的上下文
        const permissionContext = {
          ...context,
          targetUserId: extractTargetUserId(pathname, context),
          request,
        };

        const hasPermission = await checkApiPermission(
          method,
          pathname,
          userInfo.role,
          userInfo.id,
          permissionContext
        );

        if (!hasPermission) {
          return NextResponse.json<ErrorResponse>(
            { 
              error: 'Permission denied', 
              code: 'INSUFFICIENT_PERMISSIONS',
            },
            { status: 403 }
          );
        }
      }

      // 將用戶資訊添加到上下文中，供處理器使用
      const enhancedContext = {
        ...context,
        user: userInfo,
        supabase,
      };

      return await handler(request, enhancedContext);

    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Internal server error', code: 'MIDDLEWARE_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * 從路徑中提取目標用戶 ID（用於自我訪問權限檢查）
 */
function extractTargetUserId(pathname: string, context: any): string | undefined {
  // 從 URL 參數中提取用戶 ID
  if (context.params?.id) {
    return context.params.id;
  }
  
  if (context.params?.userId) {
    return context.params.userId;
  }

  // 從路徑中提取 ID（適用於 /api/users/[id] 等格式）
  const userIdMatch = pathname.match(/\/api\/users\/([^\/]+)/);
  if (userIdMatch) {
    return userIdMatch[1];
  }

  return undefined;
}

/**
 * 簡化版中間件，只進行認證不檢查權限
 */
export async function withAuthOnly(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return withAuth(handler, { skipAuthCheck: false });
}

/**
 * 無需認證的處理器（適用於公開 API）
 */
export async function withoutAuth(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any = {}) => {
    return await handler(request, context);
  };
}

/**
 * 管理員權限中間件
 */
export async function withAdminAuth(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return withAuth(handler, {
    customPermissionCheck: (userInfo) => {
      return ['root', 'admin'].includes(userInfo.role?.name || '');
    },
  });
}

/**
 * 管理層權限中間件（包含 manager）
 */
export async function withManagerAuth(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return withAuth(handler, {
    customPermissionCheck: (userInfo) => {
      return ['root', 'admin', 'class-teacher', 'manager'].includes(userInfo.role?.name || '');
    },
  });
}

/**
 * 教師層權限中間件
 */
export async function withTeacherAuth(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return withAuth(handler, {
    customPermissionCheck: (userInfo) => {
      return ['root', 'admin', 'manager', 'class-teacher', 'teacher'].includes(userInfo.role?.name || '');
    },
  });
}

/**
 * 自我訪問權限中間件
 */
export async function withSelfAccessAuth(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return withAuth(handler, {
    customPermissionCheck: (userInfo, context) => {
      const targetUserId = extractTargetUserId(new URL(context.request.url).pathname, context);
      return userInfo.id === targetUserId || ['root', 'admin'].includes(userInfo.role?.name || '');
    },
  });
}

// 導出用戶資訊類型供其他模組使用
export type { UserInfo };
