# Google Drive Service - Modular Architecture

This directory contains a refactored, modular version of the Google Drive service that replaces the monolithic `google-drive.ts` file.

## Architecture Overview

The service is now organized into logical modules, each responsible for specific functionality:

### Core Modules

- **`types.ts`** - TypeScript interfaces and type definitions
- **`config.ts`** - Configuration constants and error messages
- **`auth.ts`** - Google Drive authentication and initialization
- **`service.ts`** - Main service class that orchestrates all operations

### Functional Modules

- **`file-operations.ts`** - File listing, getting, and searching
- **`content-operations.ts`** - File content retrieval and image handling
- **`folder-operations.ts`** - Folder path operations and creation
- **`upload-operations.ts`** - File upload functionality
- **`delete-operations.ts`** - File and folder deletion operations
- **`utility-operations.ts`** - Service status checks and utilities

### Utility Modules

- **`utils.ts`** - Common helper functions (file size formatting, type checking)
- **`index.ts`** - Main export file for the entire module

## Benefits of the New Structure

1. **Separation of Concerns** - Each module has a single responsibility
2. **Better Maintainability** - Easier to locate and modify specific functionality
3. **Improved Testability** - Individual modules can be tested in isolation
4. **Type Safety** - Proper TypeScript types eliminate `any` usage
5. **Code Reusability** - Modules can be imported individually when needed
6. **Easier Debugging** - Clear module boundaries make issues easier to trace

## Usage

### Basic Usage (Same as before)
```typescript
import { googleDriveService } from '@/lib/google-drive';

// All existing functionality remains the same
const files = await googleDriveService.listFilesInFolder();
const file = await googleDriveService.getFile('fileId');
```

### Advanced Usage (Import specific modules)
```typescript
import { FileOperations, ContentOperations, DeleteOperations } from '@/lib/google-drive';

// Use specific modules directly
const fileOps = new FileOperations(driveInstance, defaultFolderId);
const contentOps = new ContentOperations(driveInstance);
const deleteOps = new DeleteOperations(driveInstance);
```

### Import Individual Utilities
```typescript
import { formatFileSize, isImageFile } from '@/lib/google-drive';

// Use utility functions directly
const size = formatFileSize(1024);
const isImage = isImageFile('image/jpeg');
```

### Delete Operations

The service now includes comprehensive delete functionality:

```typescript
import { googleDriveService } from '@/lib/google-drive';

// Delete a file permanently
await googleDriveService.deleteFile('fileId');

// Delete a folder and all its contents permanently
await googleDriveService.deleteFolder('folderId');

// Move a file to trash (soft delete)
await googleDriveService.moveToTrash('fileId');

// Restore a file from trash
await googleDriveService.restoreFromTrash('fileId');
```

### API Endpoints

New delete API endpoint available at `/api/drive/delete/[fileId]`:

- **DELETE** `/api/drive/delete/[fileId]?action=delete&type=file` - Permanently delete a file
- **DELETE** `/api/drive/delete/[fileId]?action=delete&type=folder` - Permanently delete a folder
- **DELETE** `/api/drive/delete/[fileId]?action=trash` - Move to trash
- **DELETE** `/api/drive/delete/[fileId]?action=restore` - Restore from trash

## Migration Notes

- The original `google-drive.ts` file has been removed
- All existing imports from `@/lib/google-drive` will continue to work
- The `googleDriveService` instance maintains the same API
- No breaking changes to existing code
- New delete functionality has been added

## File Structure

```
lib/google-drive/
├── README.md              # This documentation
├── index.ts               # Main exports
├── service.ts             # Main service class
├── types.ts               # Type definitions
├── config.ts              # Configuration
├── auth.ts                # Authentication
├── utils.ts               # Utility functions
├── file-operations.ts     # File operations
├── content-operations.ts  # Content operations
├── folder-operations.ts   # Folder operations
├── upload-operations.ts   # Upload operations
├── delete-operations.ts   # Delete operations
└── utility-operations.ts  # Utility operations
```

## Error Handling

All modules use centralized error messages defined in `config.ts`, making error handling consistent across the service.

## Type Safety

The service now uses proper Google Drive API types from the `googleapis` package, eliminating the use of `any` types and providing better IntelliSense support.

## Security Considerations

- Delete operations are permanent and cannot be undone
- Folder deletion recursively removes all contents
- Use `moveToTrash` for safer operations that can be reversed
- Always verify file/folder IDs before performing delete operations
