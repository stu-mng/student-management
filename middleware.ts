import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from './database/supabase/server';
import { checkPermission, getAllApiPermissions } from './lib/permissions';
import type { ApiPermissionConfig, ApiPermissionsTree } from './lib/permissions/types';

// Routes that should be excluded from permission middleware
const EXCLUDED_ROUTES = [
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for excluded routes
  if (EXCLUDED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // If no user and not a public endpoint, return 401
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
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
      
    console.log('🗄️ Database query result:', {
      userData,
      userError,
      hasRole: !!userData?.role,
      roleType: typeof userData?.role,
      isArray: Array.isArray(userData?.role)
    });

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Failed to get user role' }, 
        { status: 500 }
      );
    }

    const userRole = Array.isArray(userData.role) ? userData.role[0] : userData.role;
    const method = request.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    
    // Debug user role information
    console.log('👤 User Role Debug:', {
      userId: user.id,
      userEmail: user.email,
      rawRole: userData.role,
      processedRole: userRole,
      roleName: userRole?.name,
      roleId: userRole?.id,
      roleOrder: userRole?.order
    });

    // Find matching API permission config with proper priority
    const permissionConfig = findApiPermissionConfig(method, pathname);
    
    // Debug logging
    console.log('🔍 Middleware Debug:', {
      method,
      pathname,
      userRole: userRole?.name,
      userId: user.id,
      permissionConfig: permissionConfig ? {
        method: permissionConfig.method,
        path: permissionConfig.path,
        feature: permissionConfig.feature,
        permissions: permissionConfig.permissions
      } : null
    });
    
    if (!permissionConfig) {
      // If no permission config found, allow the request to proceed
      // This handles routes not yet configured in the permissions system
      console.log('⚠️ No permission config found, allowing request');
      return NextResponse.next();
    }

    // Check permissions using the found config directly
    const hasPermission = await checkPermission(permissionConfig, { userRole, userId: user.id, method, path: pathname });
    
    console.log('🔐 Permission check result:', {
      hasPermission,
      userRole: userRole?.name,
      allowedRoles: permissionConfig.permissions.roles,
      customCheck: !!permissionConfig.permissions.customCheck
    });
    
    if (!hasPermission) {
      console.log('❌ Permission denied for:', pathname);
      return NextResponse.json(
        { error: 'Permission denied' }, 
        { status: 403 }
      );
    }

    // Add user info to request headers for API routes to use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    // Encode role data to avoid non-ASCII character issues in headers
    requestHeaders.set('x-user-role', encodeURIComponent(JSON.stringify(userRole)));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * Find API permission configuration with proper route matching priority
 * Uses scoring system: exact matches > dynamic routes with fewer parameters
 */
function findApiPermissionConfig(method: string, path: string): ApiPermissionConfig | null {
  const permissions: ApiPermissionsTree = getAllApiPermissions();
  let bestMatch: ApiPermissionConfig | null = null;
  let bestScore = -1;

  console.log('🔍 findApiPermissionConfig Debug:', { method, path });

  // Iterate through all permission configs to find the best match
  for (const groupKey in permissions) {
    const group = permissions[groupKey];
    for (const key in group) {
      const config = group[key];
      
      // Check if method matches
      if (config.method !== method) continue;
      
      // Calculate match score
      const score = calculateMatchScore(config.path, path);
      // Update best match if this score is higher
      if (score > bestScore) {
        bestScore = score;
        bestMatch = config;
      }
    }
  }

  // Fallback 1: If no method-specific match found, try method-agnostic best match
  if (!bestMatch) {
    for (const groupKey in permissions) {
      const group = permissions[groupKey];
      for (const key in group) {
        const config = group[key];
        const score = calculateMatchScore(config.path, path);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = config;
          console.log(`  ↪️ Method-agnostic fallback match: ${config.method} ${config.path} (score: ${score})`);
        }
      }
    }
  }

  console.log(`🏆 Final best match:`, bestMatch ? `${bestMatch.method} ${bestMatch.path}` : 'None');
  return bestMatch;
}

/**
 * Calculate match score for route matching
 * Higher scores indicate better matches:
 * - Exact match: 1000
 * - Dynamic route with fewer parameters: higher score
 * - No match: 0
 */
function calculateMatchScore(configPath: string, actualPath: string): number {
  // Exact match gets highest score
  if (configPath === actualPath) {
    return 1000;
  }

  // Convert Next.js dynamic route syntax to regex
  const regexPath = configPath
    .replace(/\[([^\]]+)\]/g, '([^/]+)') // [id] -> ([^/]+)
    .replace(/\//g, '\\/'); // escape forward slashes
  
  const regex = new RegExp(`^${regexPath}$`);
  
  if (regex.test(actualPath)) {
    // Dynamic route match - score based on number of parameters
    const paramCount = (configPath.match(/\[([^\]]+)\]/g) || []).length;
    const score = 100 - paramCount; // Fewer parameters = higher score
    console.log(`    🔄 Dynamic match: ${configPath} -> ${actualPath} (params: ${paramCount}, score: ${score})`);
    return score;
  }

  // Fallback 2: Parent-path prefix match (e.g., '/api/drive' should match '/api/drive/folders')
  const normalizedConfig = configPath.endsWith('/') ? configPath.slice(0, -1) : configPath;
  if (actualPath.startsWith(`${normalizedConfig}/`)) {
    // Low score to prefer exact/dynamic matches when present
    console.log(`    ↪️ Prefix fallback match: ${configPath} ~> ${actualPath} (score: 10)`);
    return 10;
  }
  return 0; // No match
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};