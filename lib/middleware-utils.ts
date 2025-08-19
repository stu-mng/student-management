import type { NextRequest } from 'next/server';
import type { Role } from './permissions/types';

/**
 * Extract user information from middleware-injected headers
 * This allows API routes to access authenticated user data without re-querying
 */
export function getUserFromHeaders(request: NextRequest): {
  userId: string;
  userRole: Role;
} | null {
  try {
    const userId = request.headers.get('x-user-id');
    const userRoleHeader = request.headers.get('x-user-role');

    if (!userId || !userRoleHeader) {
      return null;
    }

    // Decode URL-encoded role data
    const decodedRoleData = decodeURIComponent(userRoleHeader);
    const userRole = JSON.parse(decodedRoleData) as Role;
    
    return {
      userId,
      userRole,
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
