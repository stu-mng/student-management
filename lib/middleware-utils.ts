import type { NextRequest } from 'next/server';

/**
 * Extract user information from middleware-injected headers
 * This allows API routes to access authenticated user data without re-querying
 */
export function getUserFromHeaders(request: NextRequest): {
  userId: string;
  userRoleName: string;
  originalUserRoleName?: string;
  isPreviewMode: boolean;
} | null {
  try {
    const userId = request.headers.get('x-user-id');
    const userRoleName = request.headers.get('x-user-role');
    const originalUserRoleName = request.headers.get('x-original-user-role');

    if (!userId || !userRoleName) {
      return null;
    }

    return {
      userId,
      userRoleName,
      originalUserRoleName: originalUserRoleName || undefined,
      isPreviewMode: !!originalUserRoleName,
    };
  } catch (error) {
    console.error('Error parsing user headers:', error);
    return null;
  }
}

/**
 * Check if the current request has already been validated by middleware
 * This can be used as a fallback for routes not yet covered by middleware
 */
export function isValidatedByMiddleware(request: NextRequest): boolean {
  return !!(request.headers.get('x-user-id') && request.headers.get('x-user-role'));
}
