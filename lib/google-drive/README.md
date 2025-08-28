# Google Drive Integration

This module provides integration with Google Drive API for file management, folder operations, and task-specific folder structures.

## Features

- **File Operations**: Upload, download, delete, and manage files
- **Folder Operations**: Create, move, and organize folders
- **Task Folder Management**: Automated folder structure creation for tasks
- **Authentication**: OAuth2 flow for Google Drive access
- **Content Operations**: Preview, search, and content management

## Task Folder Utils

### `createTaskFolders(supabase, taskId, taskTitle)`

Creates the complete Google Drive folder structure for a new task:

```
任務_[TaskTitle]_[TaskId]/
├── 提示圖片/
└── 檔案上傳/
```

**Parameters:**
- `supabase`: Supabase client instance
- `taskId`: Unique task identifier
- `taskTitle`: Human-readable task title

**Returns:** `TaskFolderInfo` with folder IDs

### `createRequirementFolder(supabase, taskId, requirementName, existingFolders)`

Creates a specific folder for a task requirement within the upload folders structure:

```
任務_[TaskTitle]_[TaskId]/
├── 提示圖片/
└── 檔案上傳/
    └── 要求_[RequirementName]_[Timestamp]/
```

**Parameters:**
- `supabase`: Supabase client instance
- `taskId`: Unique task identifier
- `requirementName`: Name of the requirement
- `existingFolders`: Current folder structure information

**Returns:** `RequirementFolderInfo` with the new folder ID

### `getTaskFolders(supabase, taskId)`

Retrieves existing folder information for a task.

**Parameters:**
- `supabase`: Supabase client instance
- `taskId`: Unique task identifier

**Returns:** `TaskFolderInfo` with existing folder IDs

## Usage Examples

### Creating a New Task

```typescript
import { createTaskFolders } from '@/lib/google-drive';

// Create task folders
const folders = await createTaskFolders(supabase, taskId, taskTitle);
console.log('Help image folder:', folders.helpImageFolderId);
console.log('Upload folders:', folders.uploadFoldersFolderId);
```

### Adding a File Upload Requirement

```typescript
import { createRequirementFolder, getTaskFolders } from '@/lib/google-drive';

// Get existing folders
const existingFolders = await getTaskFolders(supabase, taskId);

// Create requirement folder
const folderInfo = await createRequirementFolder(
  supabase,
  taskId,
  'Upload Document',
  existingFolders
);

// Use the folder ID for the form field
const uploadFolderId = folderInfo.uploadFolderId;
```

## Data Models

### TaskFolderInfo

```typescript
interface TaskFolderInfo {
  helpImageFolderId: string | null;
  uploadFoldersFolderId: string | null;
}
```

### RequirementFolderInfo

```typescript
interface RequirementFolderInfo {
  uploadFolderId: string | null;
}
```

## Error Handling

All functions include comprehensive error handling:

- Google Drive API errors are logged but don't stop the process
- Missing folders are automatically created
- Database errors are properly propagated
- Graceful fallbacks when folder creation fails

## Configuration

The root parent folder ID is configured in the utility functions:

```typescript
const ROOT_PARENT_FOLDER_ID = '1_tacmfCWOGruYMm5pXM-vBkBT1CMvzKV';
```

This should be updated to match your Google Drive organization structure.

## Integration Points

- **Task Creation**: Automatically creates folder structure
- **Task Editing**: Creates folders for new file upload requirements
- **Form Fields**: Links file upload fields to specific folders
- **Database**: Stores folder IDs in the `forms` table
