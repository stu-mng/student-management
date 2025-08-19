# Permissions System Documentation

## Overview

This permissions system provides a centralized way to manage API route permissions, ensuring consistency between the permissions table and actual API route implementations.

## Structure

The permissions system is organized into the following files:

- `types.ts` - Shared type definitions
- `configs.ts` - API permissions configuration table
- `checks.ts` - Basic custom permission check functions
- `advanced-checks.ts` - Complex permission check functions with database queries
- `utils.ts` - Utility functions for permission checking
- `index.ts` - Main exports and permission checking logic

## API Permissions Table

The `API_PERMISSIONS` table is organized by feature domain and contains the following information for each endpoint:

- `feature` - Human-readable feature name
- `description` - Detailed description of the endpoint
- `method` - HTTP method (GET, POST, PUT, PATCH, DELETE)
- `path` - API route path with dynamic parameters
- `permissions` - Permission configuration
  - `roles` - Array of allowed role names
  - `customCheck` - Custom permission check function

## Role Hierarchy

Roles are ordered by permission level (lower number = higher permission):

- `root` (order: 0) - System administrator
- `admin` (order: 1) - Project administrator  
- `manager` (order: 2) - School manager
- `class-teacher` (order: 3) - Class teacher
- `teacher` (order: 4) - Teacher
- `candidate` (order: 5) - Teacher candidate
- `new-registrant` (order: 6) - New registrant

## Permission Types

### 1. Role-Based Permissions
Simple role checks using the `roles` array:

```typescript
permissions: { 
  roles: ['root', 'admin', 'manager'] 
}
```

### 2. Custom Permission Checks
Complex permission logic using `customCheck` functions:

```typescript
permissions: { 
  customCheck: checkFormAccess 
}
```

Custom checks receive `PermissionCheckArgs` and can implement:
- Resource ownership checks
- Database-based permission lookups
- Complex business logic

## API Endpoints and Permissions

### Users Management
- `GET /api/users` - `['root', 'admin', 'manager', 'class-teacher']`
- `POST /api/users` - `['root', 'admin', 'manager', 'class-teacher']`
- `GET /api/users/[id]` - **Complex Check**: Admin permissions + self-access
- `PUT /api/users/[id]` - **Complex Check**: Role hierarchy validation + self-access for basic fields
- `DELETE /api/users/[id]` - **Complex Check**: Role hierarchy validation (only higher roles can delete lower roles)
- `GET /api/users/[id]/profile` - **Complex Check**: Admin permissions + self-access
- `GET /api/users/me` - All authenticated users
- `GET /api/users/activity` - `['root', 'admin', 'manager', 'class-teacher']`

### Forms Management
- `GET /api/forms` - **Complex Check**: Creator access + admin permissions + user_form_access table
- `POST /api/forms` - `['root', 'admin', 'manager', 'class-teacher']`
- `GET /api/forms/[id]` - **Complex Check**: Form access logic (creator + admin + user_form_access)
- `PUT /api/forms/[id]` - **Complex Check**: Form edit access logic (creator + admin + edit permissions)
- `DELETE /api/forms/[id]` - **Complex Check**: Form delete access logic (admin only)
- `PUT /api/forms/[id]/permissions` - `['root', 'admin', 'manager', 'class-teacher']`
- `GET /api/forms/[id]/access` - **Complex Check**: Form access permissions check (creator + admin + user_form_access)
- `GET /api/forms/[id]/responses` - **Complex Check**: Form response view logic (creator + admin)
- `GET /api/forms/[id]/responses/overview` - **Complex Check**: Form responses overview (creator + admin + edit permissions)
- `GET /api/forms/[id]/responses/users/[userId]` - **Complex Check**: User form responses (self-access + creator + admin)

### Form Responses
- `GET /api/form-responses` - `['root', 'admin', 'manager']`
- `GET /api/form-responses/[id]` - Custom response access logic
- `PUT /api/form-responses/[id]` - `['root', 'admin', 'manager']`

### Students Management
- `GET /api/students` - **Complex Check**: Admin permissions + manager regional access + teacher-student assignments
- `POST /api/students` - **Complex Check**: Admin permissions + regional constraints for managers
- `GET /api/students/[id]` - **Complex Check**: Admin + regional access + teacher-student relationships
- `PUT /api/students/[id]` - **Complex Check**: Admin + regional access + teacher-student relationships  
- `DELETE /api/students/[id]` - **Complex Check**: Admin + regional access + teacher-student relationships
- `POST /api/students/import` - `['root', 'admin', 'manager', 'class-teacher']`

### Roles Management
- `GET /api/roles` - `['root', 'admin', 'manager', 'class-teacher']`

### Permissions Management
- `POST /api/permissions/assign` - `['root', 'admin', 'manager', 'class-teacher']`
- `GET /api/permissions/assigned/students/[id]` - **Complex Check**: Admin permissions + self-access for teachers

### Regions Management
- `GET /api/regions` - `['root', 'admin', 'manager', 'class-teacher']`

### Analytics
- `GET /api/analytics` - `['root', 'admin', 'manager']`

### Email Management
- `POST /api/emails/batch` - `['root', 'admin', 'manager']`

### Google Drive Management
- `GET /api/drive` - `['root', 'admin', 'manager', 'class-teacher']`
- `POST /api/drive/upload` - `['root', 'admin', 'manager', 'class-teacher']`
- `DELETE /api/drive/delete/[fileId]` - `['root', 'admin', 'manager']`
- `POST /api/drive/move` - `['root', 'admin', 'manager']`
- `GET /api/drive/preview/[fileId]` - `['root', 'admin', 'manager', 'class-teacher']`
- `GET /api/drive/content/[fileId]` - `['root', 'admin', 'manager', 'class-teacher']`
- `GET /api/drive/search` - `['root', 'admin', 'manager', 'class-teacher']`
- `POST /api/drive/folders` - `['root', 'admin', 'manager']`
- `GET /api/drive/image/[fileId]` - `['root', 'admin', 'manager', 'class-teacher']`
- `GET /api/drive/preview-image/[fileId]` - `['root', 'admin', 'manager', 'class-teacher']`
- `GET /api/drive/path/[folderId]` - `['root', 'admin', 'manager']`
- `GET /api/drive/[fileId]` - `['root', 'admin', 'manager', 'class-teacher']`

## Usage

### Basic Permission Check
```typescript
import { checkApiPermission } from '@/lib/permissions';

const hasPermission = await checkApiPermission(
  'GET',
  '/api/users',
  userRole,
  userId
);
```

### Custom Permission Check
```typescript
import { checkPermission } from '@/lib/permissions';

const hasPermission = await checkPermission(
  apiConfig,
  { userRole, userId, method: 'GET', path: '/api/forms/123' }
);
```

## Custom Permission Functions

### Basic Form Access Checks (`checks.ts`)
- `checkFormAccess` - Checks if user can view a form
- `checkFormEditAccess` - Checks if user can edit a form
- `checkFormDeleteAccess` - Checks if user can delete a form
- `checkFormAccessPermission` - Checks if user has permission to read form access permissions via user_form_access table

### Basic Form Response Checks (`checks.ts`)
- `checkFormResponseAccess` - Checks if user can view a response
- `checkFormResponseViewAccess` - Checks if user can view form responses
- `checkFormResponseEditAccess` - Checks if user can edit form responses

### Basic User Management Checks (`checks.ts`)
- `checkUserDeleteAccess` - Checks if user can delete another user (only higher roles can delete lower roles)

### Advanced User Management Checks (`advanced-checks.ts`)
- `checkUserViewAccess` - Complex check for viewing user details (manage permissions + self-access)
- `checkUserUpdateAccess` - Complex check for updating users (role hierarchy + self-access)

### Advanced Student Management Checks (`advanced-checks.ts`)
- `checkStudentsListAccess` - Complex check for students list (admin permissions + manager regional access + teacher assignments)
- `checkStudentsCreateAccess` - Complex check for student creation (manage permissions + regional constraints)
- `checkStudentAccess` - Complex check for individual student access (admin + regional + teacher-student relationships)

### Advanced Form Management Checks (`advanced-checks.ts`)
- `checkFormsListAccess` - Complex check for forms list (creator access + admin permissions + user_form_access)
- `checkFormResponsesOverviewAccess` - Complex check for form responses overview (creator + admin + edit permissions)
- `checkUserFormResponsesAccess` - Complex check for user form responses (self-access + creator + admin)

### Advanced Permission Management Checks (`advanced-checks.ts`)
- `checkAssignedStudentsAccess` - Complex check for assigned students (admin permissions + self-access for teachers)

## Implementation Notes

1. **Consistency**: All API route handlers now use the same permission logic as defined in the permissions table
2. **Self-Access**: Endpoints that allow users to access their own resources use `customCheck` functions
3. **Database Integration**: Custom checks create their own Supabase clients and perform necessary database queries
4. **Role Hierarchy**: Permission checks respect the role hierarchy defined by the `order` field
5. **Maintainability**: Centralized permission configuration makes it easy to update and audit permissions

## Completed TODO Implementations

### 1. User Deletion Permission Check (`checkUserDeleteAccess`)
**Replaced**: `// TODO: customCheck: 1. only allow root/admin/class-teacher/manager 2. can only delete user with lower role`

**Implementation**: 
- Only users with roles `['root', 'admin', 'manager', 'class-teacher']` can delete users
- Users cannot delete themselves
- Users can only delete users with lower role permissions (using `canDeleteUser` utility)
- Database query to verify target user's role before allowing deletion

**Usage**: Applied to `DELETE /api/users/[id]` endpoint

### 2. Form Access Permission Check (`checkFormAccessPermission`)
**Replaced**: `// TODO: customCheck: verify if the user has the permission to read the form permissions by user_form_access (role, see the api implementation)`

**Implementation**:
- Root and admin users have full access
- Form creators have access to their own forms
- Checks `user_form_access` table for role-based permissions
- Integrates with existing form access logic from API implementation

**Usage**: Applied to `GET /api/forms/[id]/access` endpoint

## Future Enhancements

1. **Permission Caching**: Implement caching for frequently checked permissions
2. **Audit Logging**: Log permission checks for security auditing
3. **Dynamic Permissions**: Support for runtime permission updates
4. **Permission Groups**: Support for grouping related permissions
5. **API Documentation**: Auto-generate API documentation from permissions table
