import { checkAssignedStudentsAccess, checkFormResponsesOverviewAccess, checkFormsListAccess, checkStudentAccess, checkStudentsCreateAccess, checkStudentsListAccess, checkUserFormResponsesAccess, checkUserProfileAccess, checkUserUpdateAccess, checkUserViewAccess } from './advanced-checks';
import { checkFormAccess, checkFormDeleteAccess, checkFormEditAccess, checkFormResponseAccess, checkFormResponseEditAccess, checkFormResponseViewAccess, checkUserDeleteAccess } from './checks';
import type { PermissionCheckFunction, RoleName } from './types';

// TypeScript interfaces for permissions
interface PermissionConfig {
  roles?: RoleName[];
  customCheck?: PermissionCheckFunction;
}

interface ApiEndpoint {
  feature: string;
  description: string;
  method: string;
  path: string;
  permissions: PermissionConfig;
}

interface ApiModule {
  module: string;
  description: string;
  [key: string]: ApiEndpoint | string;
}

interface ApiPermissions {
  [key: string]: ApiModule;
}

export const ADMINS: RoleName[] = ['root', 'admin', 'manager', 'class-teacher'] 
export const EVERYONE: RoleName[] = ['root', 'admin', 'manager', 'class-teacher', 'teacher', 'candidate', 'new-registrant']

export const API_PERMISSIONS: ApiPermissions = {
  users: {
    module: '用戶管理',
    description: '管理系統用戶，包括創建、查看、更新和刪除用戶',
    list: {
      feature: '用戶列表',
      description: '查看所有用戶列表',
      method: 'GET',
      path: '/api/users',
      permissions: { 
        roles: ADMINS
      },
    },
    create: {
      feature: '創建用戶',
      description: '創建新用戶',
      method: 'POST',
      path: '/api/users',
      permissions: { 
        roles: ADMINS
      },
    },
    view: {
      feature: '查看用戶詳情',
      description: '查看單個用戶詳情',
      method: 'GET',
      path: '/api/users/[id]',
      permissions: {
        customCheck: checkUserViewAccess,
      },
    },
    update: {
      feature: '更新用戶',
      description: '更新用戶資訊',
      method: 'PUT',
      path: '/api/users/[id]',
      permissions: {
        customCheck: checkUserUpdateAccess,
      },
    },
    delete: {
      feature: '刪除用戶',
      description: '刪除用戶',
      method: 'DELETE',
      path: '/api/users/[id]',
      permissions: { 
        customCheck: checkUserDeleteAccess
      },
    },
    me: {
      feature: '個人資訊',
      description: '查看自己的用戶資訊',
      method: 'GET',
      path: '/api/users/me',
      permissions: { 
        roles: EVERYONE 
      },
    },
    meUpdate: {
      feature: '更新個人資訊',
      description: '更新自己的用戶資訊',
      method: 'PUT',
      path: '/api/users/me',
      permissions: { 
        roles: EVERYONE 
      },
    },
    meCreate: {
      feature: '創建個人資訊',
      description: '創建自己的用戶資訊',
      method: 'POST',
      path: '/api/users/me',
      permissions: { 
        roles: EVERYONE 
      },
    },
    profile: {
      feature: '查看用戶檔案',
      description: '查看用戶檔案資訊',
      method: 'GET',
      path: '/api/users/[id]/profile',
      permissions: { 
        customCheck: checkUserProfileAccess
      },
    },
    activity: {
      feature: '用戶活動記錄',
      description: '查看用戶活動記錄',
      method: 'GET',
      path: '/api/users/activity',
      permissions: { 
        roles: ADMINS
      },
    },
    activityUpdate: {
      feature: '更新用戶活動',
      description: '更新當前用戶的最後活動時間',
      method: 'POST',
      path: '/api/users/activity',
      permissions: { 
        roles: EVERYONE
      },
    },
  },
  roles: {
    module: '角色管理',
    description: '管理系統角色和權限',
    list: {
      feature: '角色列表',
      description: '查看所有角色列表',
      method: 'GET',
      path: '/api/roles',
      permissions: { 
        roles: EVERYONE
      },
    },
  },
  students: {
    module: '學生管理',
    description: '管理學生資料，包括創建、查看、更新和刪除學生記錄',
    list: {
      feature: '學生列表',
      description: '查看學生列表',
      method: 'GET',
      path: '/api/students',
      permissions: { 
        customCheck: checkStudentsListAccess
      },
    },
    create: {
      feature: '創建學生',
      description: '創建新學生記錄',
      method: 'POST',
      path: '/api/students',
      permissions: { 
        customCheck: checkStudentsCreateAccess
      },
    },
    view: {
      feature: '查看學生詳情',
      description: '查看單個學生詳情',
      method: 'GET',
      path: '/api/students/[id]',
      permissions: {
        customCheck: checkStudentAccess,
      },
    },
    update: {
      feature: '更新學生',
      description: '更新學生資訊',
      method: 'PUT',
      path: '/api/students/[id]',
      permissions: {
        customCheck: checkStudentAccess,
      },
    },
    delete: {
      feature: '刪除學生',
      description: '刪除學生記錄',
      method: 'DELETE',
      path: '/api/students/[id]',
      permissions: {
        customCheck: checkStudentAccess,
      },
    },
    import: {
      feature: '匯入學生',
      description: '批量匯入學生資料',
      method: 'POST',
      path: '/api/students/import',
      permissions: { 
        roles: ADMINS
      },
    },
    assign: {
      feature: '分配學生',
      description: '分配學生給教師管理',
      method: 'POST',
      path: '/api/students/assign',
      permissions: { 
        roles: ADMINS
      },
    },
    assigned: {
      feature: '查看分配的學生',
      description: '查看用戶被分配的學生列表',
      method: 'GET',
      path: '/api/students/assigned/[id]',
      permissions: {
        customCheck: checkAssignedStudentsAccess,
      },
    },
  },
  forms: {
    module: '表單管理',
    description: '管理系統表單，包括創建、編輯、刪除和權限控制',
    list: {
      feature: '表單列表',
      description: '查看表單列表',
      method: 'GET',
      path: '/api/forms',
      permissions: { 
        customCheck: checkFormsListAccess
      },
    },
    create: {
      feature: '創建表單',
      description: '創建新表單',
      method: 'POST',
      path: '/api/forms',
      permissions: { 
        roles: ADMINS
      },
    },
    view: {
      feature: '查看表單',
      description: '查看單個表單詳情',
      method: 'GET',
      path: '/api/forms/[id]',
      permissions: { 
        customCheck: checkFormAccess 
      },
    },
    update: {
      feature: '更新表單',
      description: '更新表單內容',
      method: 'PUT',
      path: '/api/forms/[id]',
      permissions: { 
        customCheck: checkFormEditAccess 
      },
    },
    delete: {
      feature: '刪除表單',
      description: '刪除表單',
      method: 'DELETE',
      path: '/api/forms/[id]',
      permissions: { 
        customCheck: checkFormDeleteAccess 
      },
    },
    permissionsUpdate: {
      feature: '更新表單權限',
      description: '更新表單訪問權限設定',
      method: 'PUT',
      path: '/api/forms/[id]/permissions',
      permissions: { 
        roles: ADMINS
      },
    },
    accessCheck: {
      feature: '檢查表單訪問權限',
      description: '檢查用戶對表單的訪問權限',
      method: 'GET',
      path: '/api/forms/[id]/access',
      permissions: { 
        customCheck: checkFormEditAccess
      },
    },
    responsesList: {
      feature: '表單的回應列表',
      description: '查看特定表單的所有回應',
      method: 'GET',
      path: '/api/forms/[id]/responses',
      permissions: { 
        customCheck: checkFormResponseViewAccess 
      },
    },
    responsesOverview: {
      feature: '表單回應概覽',
      description: '查看表單回應統計概覽',
      method: 'GET',
      path: '/api/forms/[id]/responses/overview',
      permissions: { 
        customCheck: checkFormResponsesOverviewAccess 
      },
    },
    responsesUser: {
      feature: '用戶表單回應',
      description: '查看特定用戶對表單的回應',
      method: 'GET',
      path: '/api/forms/[id]/responses/users/[userId]',
      permissions: { 
        customCheck: checkUserFormResponsesAccess 
      },
    },
  },
  formResponses: {
    module: '表單回應管理',
    description: '管理表單回應，包括查看和更新回應內容',
    list: {
      feature: '表單回應列表',
      description: '查看表單回應列表',
      method: 'GET',
      path: '/api/form-responses',
      permissions: { 
        customCheck: checkFormResponseEditAccess 
      },
    },
    view: {
      feature: '查看表單回應',
      description: '查看單個表單回應',
      method: 'GET',
      path: '/api/form-responses/[id]',
      permissions: { 
        customCheck: checkFormResponseAccess 
      },
    },
    update: {
      feature: '更新表單回應',
      description: '更新表單回應內容',
      method: 'PUT',
      path: '/api/form-responses/[id]',
      permissions: { 
        customCheck: checkFormResponseEditAccess 
      },
    },
  },
  regions: {
    module: '地區管理',
    description: '管理系統地區設定',
    list: {
      feature: '地區列表',
      description: '查看地區列表',
      method: 'GET',
      path: '/api/regions',
      permissions: { 
        roles: ADMINS
      },
    },
  },
  analytics: {
    module: '數據分析',
    description: '查看系統分析數據和統計信息',
    overview: {
      feature: '分析概覽',
      description: '查看系統分析數據',
      method: 'GET',
      path: '/api/analytics',
      permissions: { 
        roles: ['root'] 
      },
    },
    sessions: {
      feature: '會話分析',
      description: '查看系統會話分析數據',
      method: 'GET',
      path: '/api/analytics/sessions',
      permissions: { 
        roles: ['root'] 
      },
    },
  },
  emails: {
    module: '郵件管理',
    description: '管理系統郵件發送功能',
    batch: {
      feature: '批量發送郵件',
      description: '批量發送郵件給多個收件人',
      method: 'POST',
      path: '/api/emails/batch',
      permissions: { 
        roles: ADMINS
      },
    },
  },
  drive: {
    module: 'Google Drive 管理',
    description: '管理 Google Drive 檔案和資料夾操作',
    list: {
      feature: 'Google Drive 檔案列表',
      description: '查看 Google Drive 中的檔案',
      method: 'GET',
      path: '/api/drive',
      permissions: { 
        roles: ADMINS
      },
    },
    upload: {
      feature: '上傳檔案到 Google Drive',
      description: '上傳檔案到 Google Drive',
      method: 'POST',
      path: '/api/drive/upload',
      permissions: { 
        roles: ADMINS
      },
    },
    delete: {
      feature: '刪除 Google Drive 檔案',
      description: '刪除 Google Drive 中的檔案',
      method: 'DELETE',
      path: '/api/drive/delete/[fileId]',
      permissions: { 
        roles: ADMINS
      },
    },
    move: {
      feature: '移動 Google Drive 檔案',
      description: '移動 Google Drive 中的檔案',
      method: 'POST',
      path: '/api/drive/move',
      permissions: { 
        roles: ADMINS
      },
    },
    preview: {
      feature: '預覽 Google Drive 檔案',
      description: '預覽 Google Drive 中的檔案',
      method: 'GET',
      path: '/api/drive/preview/[fileId]',
      permissions: { 
        roles: ADMINS
      },
    },
    content: {
      feature: '獲取 Google Drive 檔案內容',
      description: '獲取 Google Drive 檔案的內容',
      method: 'GET',
      path: '/api/drive/content/[fileId]',
      permissions: { 
        roles: ADMINS
      },
    },
    search: {
      feature: '搜尋 Google Drive 檔案',
      description: '搜尋 Google Drive 中的檔案',
      method: 'GET',
      path: '/api/drive/search',
      permissions: { 
        roles: ADMINS
      },
    },
    folders: {
      feature: 'Google Drive 資料夾操作',
      description: '管理 Google Drive 資料夾',
      method: 'POST',
      path: '/api/drive/folders',
      permissions: { 
        roles: ADMINS
      },
    },
    storage: {
      feature: 'Google Drive 儲存空間',
      description: '查看 Google Drive 儲存空間使用情況',
      method: 'GET',
      path: '/api/drive/storage',
      permissions: { 
        roles: ADMINS
      },
    },

    image: {
      feature: 'Google Drive 圖片處理',
      description: '處理 Google Drive 中的圖片',
      method: 'GET',
      path: '/api/drive/image/[fileId]',
      permissions: { 
        roles: ADMINS
      },
    },
    previewImage: {
      feature: '預覽 Google Drive 圖片',
      description: '預覽 Google Drive 中的圖片',
      method: 'GET',
      path: '/api/drive/preview-image/[fileId]',
      permissions: { 
        roles: ADMINS
      },
    },
    path: {
      feature: 'Google Drive 路徑操作',
      description: '操作 Google Drive 檔案路徑',
      method: 'GET',
      path: '/api/drive/path/[folderId]',
      permissions: { 
        roles: ADMINS
      },
    },
    fileDetail: {
      feature: 'Google Drive 檔案詳情',
      description: '查看 Google Drive 檔案的詳細資訊',
      method: 'GET',
      path: '/api/drive/[fileId]',
      permissions: { 
        roles: ADMINS
      },
    },
    rename: {
      feature: '重新命名 Google Drive 檔案',
      description: '重新命名 Google Drive 中的檔案和資料夾',
      method: 'PATCH',
      path: '/api/drive/[fileId]',
      permissions: { 
        roles: ADMINS
      },
    },
  },
};


