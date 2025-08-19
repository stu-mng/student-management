# Permission Middleware Guide

## Overview

The permission middleware system provides centralized authentication and authorization for all API routes. It intercepts incoming requests, validates user permissions against the `API_PERMISSIONS` table, and terminates unauthorized requests early with a 403 status.

## How It Works

1. **Request Interception**: The middleware runs on all API routes (except excluded ones)
2. **Authentication**: Validates the user session using Supabase Auth
3. **Authorization**: Checks permissions against the `API_PERMISSIONS` configuration
4. **Route Matching**: Uses priority-based matching (exact routes before dynamic routes)
5. **Custom Checks**: Supports complex permission logic via `customCheck` functions
6. **Header Injection**: Adds user info to request headers for API routes to use

## Route Matching Priority

1. **Exact matches** (higher priority): `/api/users/me`, `/api/users/activity`
2. **Dynamic routes**: `/api/users/[id]`, `/api/forms/[id]`, etc.

## Excluded Routes

The following routes bypass the middleware:
- `/api/auth/*` - Authentication endpoints
- `/_next/*` - Next.js internal routes
- `/favicon.ico` - Static files
- `/api/health` - Health check endpoints

## API Route Integration

API routes can now access authenticated user information from headers:

```typescript
import { getUserFromHeaders } from '@/lib/middleware-utils';

export async function GET(request: NextRequest) {
  // Get user info from middleware (already authenticated and authorized)
  const userInfo = getUserFromHeaders(request);
  
  if (!userInfo) {
    // Fallback for routes not processed by middleware
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, userRole } = userInfo;
  
  // Your API logic here - no need for additional permission checks
}
```

## Benefits

1. **Centralized Security**: All permission logic in one place
2. **Performance**: Early termination of unauthorized requests
3. **Consistency**: Same permission rules across all API routes
4. **Maintainability**: Single source of truth for permissions
5. **Reduced Boilerplate**: API routes no longer need individual permission checks

## Migration Pattern

**Before (in API routes):**
```typescript
// Get user and check permissions (30+ lines of boilerplate)
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) return 401;

const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
if (!['admin', 'root'].includes(userData.role.name)) return 403;

// Actual API logic
```

**After (with middleware):**
```typescript
// Get user info from middleware headers (2 lines)
const userInfo = getUserFromHeaders(request);
if (!userInfo) return 401;

// Actual API logic
```

## Configuration

The middleware uses the `API_PERMISSIONS` configuration from `lib/permissions/configs.ts`. Any changes to permissions are automatically reflected in the middleware without code changes.

## Error Handling

- **401 Unauthorized**: No valid user session
- **403 Permission Denied**: User lacks required permissions
- **500 Internal Server Error**: Database or system errors

The middleware provides detailed error logging for debugging permission issues.

