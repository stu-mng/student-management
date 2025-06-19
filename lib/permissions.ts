// 權限類型定義
export type Permission = 'read' | 'write' | 'delete' | 'admin';
export type RoleName = 'root' | 'admin' | 'manager' | 'class-teacher' | 'teacher' | 'candidate' | 'new-registrant';

// Supabase 客戶端類型
interface SupabaseClient {
  from: (table: string) => any;
  auth: {
    getUser: () => Promise<any>;
  };
}

// 上下文類型定義
interface PermissionContext {
  supabase?: SupabaseClient;
  params?: Record<string, string>;
  request?: Request;
  targetUserId?: string;
  [key: string]: unknown;
}

// 特殊權限檢查函數類型
export type PermissionCheckFunction = (
  userRole: { name: string; order?: number } | null,
  userId: string,
  context?: PermissionContext
) => boolean | Promise<boolean>;

// API 權限配置項目
export interface ApiPermissionConfig {
  feature: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  permissions: {
    roles?: RoleName[];
    customCheck?: PermissionCheckFunction;
    allowSelfAccess?: boolean; // 是否允許訪問自己的資源
  };
}

// API 權限配置表
export const API_PERMISSIONS: Record<string, ApiPermissionConfig> = {
  // ===== 用戶管理 =====
  'users.list': {
    feature: '用戶列表',
    description: '查看所有用戶列表',
    method: 'GET',
    path: '/api/users',
    permissions: {
      roles: ['root', 'admin', 'manager', 'class-teacher'],
    },
  },
  'users.create': {
    feature: '創建用戶',
    description: '創建新用戶',
    method: 'POST',
    path: '/api/users',
    permissions: {
      roles: ['root', 'admin', 'manager'],
    },
  },
  'users.view': {
    feature: '查看用戶詳情',
    description: '查看單個用戶詳情',
    method: 'GET',
    path: '/api/users/[id]',
    permissions: {
      roles: ['root', 'admin', 'manager', 'class-teacher'],
      allowSelfAccess: true,
    },
  },
  'users.update': {
    feature: '更新用戶',
    description: '更新用戶資訊',
    method: 'PUT',
    path: '/api/users/[id]',
    permissions: {
      roles: ['root', 'admin', 'manager'],
      allowSelfAccess: true,
    },
  },
  'users.delete': {
    feature: '刪除用戶',
    description: '刪除用戶',
    method: 'DELETE',
    path: '/api/users/[id]',
    permissions: {
      roles: ['root', 'admin'],
    },
  },
  'users.me': {
    feature: '個人資訊',
    description: '查看自己的用戶資訊',
    method: 'GET',
    path: '/api/users/me',
    permissions: {
      roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher', 'candidate', 'new-registrant'],
    },
  },

  // ===== 角色管理 =====
  'roles.list': {
    feature: '角色列表',
    description: '查看所有角色列表',
    method: 'GET',
    path: '/api/roles',
    permissions: {
      roles: ['root', 'admin', 'class-teacher', 'manager'],
    },
  },

  // ===== 學生管理 =====
  'students.list': {
    feature: '學生列表',
    description: '查看學生列表',
    method: 'GET',
    path: '/api/students',
    permissions: {
      roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher', 'candidate'],
    },
  },
  'students.create': {
    feature: '創建學生',
    description: '創建新學生記錄',
    method: 'POST',
    path: '/api/students',
    permissions: {
      roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher'],
    },
  },
  'students.import': {
    feature: '匯入學生',
    description: '批量匯入學生資料',
    method: 'POST',
    path: '/api/students/import',
    permissions: {
      roles: ['root', 'admin'],
    },
  },

  // ===== 表單管理 =====
  'forms.list': {
    feature: '表單列表',
    description: '查看表單列表',
    method: 'GET',
    path: '/api/forms',
    permissions: {
      roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher', 'candidate'],
    },
  },
  'forms.create': {
    feature: '創建表單',
    description: '創建新表單',
    method: 'POST',
    path: '/api/forms',
    permissions: {
      roles: ['root', 'admin', 'manager'],
    },
  },
  'forms.view': {
    feature: '查看表單',
    description: '查看單個表單詳情',
    method: 'GET',
    path: '/api/forms/[id]',
    permissions: {
      customCheck: async (userRole, userId, context) => {
        // 表單訪問權限需要根據表單權限設定和創建者來判斷
        return checkFormAccess(userRole, userId, context);
      },
    },
  },
  'forms.update': {
    feature: '更新表單',
    description: '更新表單內容',
    method: 'PUT',
    path: '/api/forms/[id]',
    permissions: {
      customCheck: async (userRole, userId, context) => {
        return checkFormEditAccess(userRole, userId, context);
      },
    },
  },
  'forms.delete': {
    feature: '刪除表單',
    description: '刪除表單',
    method: 'DELETE',
    path: '/api/forms/[id]',
    permissions: {
      customCheck: async (userRole, userId, context) => {
        return checkFormDeleteAccess(userRole, userId, context);
      },
    },
  },
  'forms.permissions.update': {
    feature: '更新表單權限',
    description: '更新表單訪問權限設定',
    method: 'PUT',
    path: '/api/forms/[id]/permissions',
    permissions: {
      roles: ['root', 'admin'],
    },
  },
  'forms.access.check': {
    feature: '檢查表單訪問權限',
    description: '檢查用戶對表單的訪問權限',
    method: 'GET',
    path: '/api/forms/[id]/access',
    permissions: {
      roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher', 'candidate'],
    },
  },

  // ===== 表單回應管理 =====
  'form-responses.list': {
    feature: '表單回應列表',
    description: '查看表單回應列表',
    method: 'GET',
    path: '/api/form-responses',
    permissions: {
      roles: ['root', 'admin', 'class-teacher', 'manager'],
    },
  },
  'form-responses.view': {
    feature: '查看表單回應',
    description: '查看單個表單回應',
    method: 'GET',
    path: '/api/form-responses/[id]',
    permissions: {
      customCheck: async (userRole, userId, context) => {
        return checkFormResponseAccess(userRole, userId, context);
      },
    },
  },
  'form-responses.update': {
    feature: '更新表單回應',
    description: '更新表單回應內容',
    method: 'PUT',
    path: '/api/form-responses/[id]',
    permissions: {
      roles: ['root', 'admin', 'class-teacher', 'manager'],
    },
  },
  'forms.responses.list': {
    feature: '表單的回應列表',
    description: '查看特定表單的所有回應',
    method: 'GET',
    path: '/api/forms/[id]/responses',
    permissions: {
      customCheck: async (userRole, userId, context) => {
        return checkFormResponseViewAccess(userRole, userId, context);
      },
    },
  },
  'forms.responses.overview': {
    feature: '表單回應概覽',
    description: '查看表單回應統計概覽',
    method: 'GET',
    path: '/api/forms/[id]/responses/overview',
    permissions: {
      customCheck: async (userRole, userId, context) => {
        return checkFormResponseViewAccess(userRole, userId, context);
      },
    },
  },
  'forms.responses.user': {
    feature: '用戶表單回應',
    description: '查看特定用戶對表單的回應',
    method: 'GET',
    path: '/api/forms/[id]/responses/users/[userId]',
    permissions: {
      customCheck: async (userRole, userId, context) => {
        return checkFormResponseEditAccess(userRole, userId, context);
      },
    },
  },

  // ===== 權限管理 =====
  'permissions.assign': {
    feature: '分配權限',
    description: '批量分配教師對學生的權限',
    method: 'POST',
    path: '/api/permissions/assign',
    permissions: {
      roles: ['root', 'admin', 'class-teacher', 'manager'],
    },
  },
  'permissions.assigned-students': {
    feature: '查看分配的學生',
    description: '查看用戶被分配的學生列表',
    method: 'GET',
    path: '/api/permissions/assigned/students/[id]',
    permissions: {
      roles: ['root', 'admin', 'class-teacher', 'manager'],
      allowSelfAccess: true,
    },
  },

  // ===== 地區管理 =====
  'regions.list': {
    feature: '地區列表',
    description: '查看地區列表',
    method: 'GET',
    path: '/api/regions',
    permissions: {
      roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher'],
    },
  },

  // ===== 分析數據 =====
  'analytics.overview': {
    feature: '分析概覽',
    description: '查看系統分析數據',
    method: 'GET',
    path: '/api/analytics',
    permissions: {
      roles: ['root'],
    },
  },
  'analytics.sessions': {
    feature: '會話分析',
    description: '查看在線用戶會話數據',
    method: 'GET',
    path: '/api/analytics/sessions',
    permissions: {
      roles: ['root'],
    },
  },

  // ===== 用戶活動 =====
  'users.activity': {
    feature: '用戶活動記錄',
    description: '查看用戶活動記錄',
    method: 'GET',
    path: '/api/users/activity',
    permissions: {
      roles: ['root', 'admin', 'class-teacher', 'manager'],
    },
  },
};

// ===== 特殊權限檢查函數 =====

/**
 * 檢查表單訪問權限
 */
async function checkFormAccess(
  userRole: { name: string; order?: number } | null,
  userId: string,
  context?: PermissionContext
): Promise<boolean> {
  if (!userRole || !context) return false;
  
  // 管理員和 root 有完整權限
  if (['admin', 'root'].includes(userRole.name)) {
    return true;
  }
  
  // 如果沒有 supabase 實例，返回 false
  if (!context.supabase) return false;
  
  const supabase = context.supabase;
  const formId = extractFormId(context);
  
  if (!formId) return false;
  
  try {
    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, created_by')
      .eq('id', formId)
      .single();
    
    if (formError || !form) return false;
    
    // 如果是表單創建者，有訪問權限
    if (form.created_by === userId) return true;
    
    // 檢查用戶是否有表單訪問權限
    const { data: accessData, error: accessError } = await supabase
      .from('user_form_access')
      .select(`
        access_type,
        role:roles(name, order)
      `)
      .eq('form_id', formId)
      .eq('role.name', userRole.name)
      .single();
    
    if (accessError || !accessData) return false;
    
    // 有任何類型的訪問權限都可以查看
    return ['read', 'edit'].includes(accessData.access_type);
    
  } catch (error) {
    console.error('Error checking form access:', error);
    return false;
  }
}

/**
 * 檢查表單編輯權限
 */
async function checkFormEditAccess(
  userRole: { name: string; order?: number } | null,
  userId: string,
  context?: PermissionContext
): Promise<boolean> {
  if (!userRole || !context) return false;
  
  // 管理員和 root 有完整權限
  if (['admin', 'root'].includes(userRole.name)) {
    return true;
  }
  
  if (!context.supabase) return false;
  
  const supabase = context.supabase;
  const formId = extractFormId(context);
  
  if (!formId) return false;
  
  try {
    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, created_by')
      .eq('id', formId)
      .single();
    
    if (formError || !form) return false;
    
    // 如果是表單創建者，有編輯權限
    if (form.created_by === userId) return true;
    
    // 檢查用戶是否有表單編輯權限
    const { data: accessData, error: accessError } = await supabase
      .from('user_form_access')
      .select(`
        access_type,
        role:roles(name, order)
      `)
      .eq('form_id', formId)
      .eq('role.name', userRole.name)
      .single();
    
    if (accessError || !accessData) return false;
    
    // 只有 edit 權限可以編輯
    return accessData.access_type === 'edit';
    
  } catch (error) {
    console.error('Error checking form edit access:', error);
    return false;
  }
}

/**
 * 檢查表單刪除權限
 */
async function checkFormDeleteAccess(
  userRole: { name: string; order?: number } | null,
  _userId: string,
  _context?: PermissionContext
): Promise<boolean> {
  if (!userRole) return false;
  
  // 只有管理員和 root 可以刪除表單
  if (['admin', 'root'].includes(userRole.name)) {
    return true;
  }
  
  // 其他角色即使是創建者也不能刪除
  return false;
}

/**
 * 檢查表單回應訪問權限
 */
async function checkFormResponseAccess(
  userRole: { name: string; order?: number } | null,
  userId: string,
  context?: PermissionContext
): Promise<boolean> {
  if (!userRole || !context) return false;
  
  // 管理員有完整權限
  if (['admin', 'root', 'manager'].includes(userRole.name)) {
    return true;
  }
  
  if (!context.supabase) return false;
  
  const supabase = context.supabase;
  const responseId = extractResponseId(context);
  
  if (!responseId) return false;
  
  try {
    // 檢查表單回應是否存在並獲取表單資訊
    const { data: response, error: responseError } = await supabase
      .from('form_responses')
      .select(`
        id,
        user_id,
        form:forms(
          id,
          created_by
        )
      `)
      .eq('id', responseId)
      .single();
    
    if (responseError || !response) return false;
    
    // 如果是自己的回應，可以查看
    if (response.user_id === userId) return true;
    
    // 如果是表單創建者，可以查看所有回應
    if (response.form?.created_by === userId) return true;
    
    return false;
    
  } catch (error) {
    console.error('Error checking form response access:', error);
    return false;
  }
}

/**
 * 檢查表單回應查看權限
 */
async function checkFormResponseViewAccess(
  userRole: { name: string; order?: number } | null,
  userId: string,
  context?: PermissionContext
): Promise<boolean> {
  if (!userRole || !context) return false;
  
  // 管理員和 root 有權限
  if (['admin', 'root'].includes(userRole.name)) {
    return true;
  }
  
  if (!context.supabase) return false;
  
  const supabase = context.supabase;
  const formId = extractFormId(context);
  
  if (!formId) return false;
  
  try {
    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, created_by')
      .eq('id', formId)
      .single();
    
    if (formError || !form) return false;
    
    // 如果是表單創建者，可以查看回應
    if (form.created_by === userId) return true;
    
    return false;
    
  } catch (error) {
    console.error('Error checking form response view access:', error);
    return false;
  }
}

/**
 * 檢查表單回應編輯權限
 */
async function checkFormResponseEditAccess(
  userRole: { name: string; order?: number } | null,
  userId: string,
  context?: PermissionContext
): Promise<boolean> {
  if (!userRole || !context) return false;
  
  // 管理員和 root 有權限
  if (['admin', 'root'].includes(userRole.name)) {
    return true;
  }
  
  if (!context.supabase) return false;
  
  const supabase = context.supabase;
  const formId = extractFormId(context);
  const targetUserId = extractTargetUserId(context);
  
  if (!formId) return false;
  
  try {
    // 檢查表單是否存在
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, created_by')
      .eq('id', formId)
      .single();
    
    if (formError || !form) return false;
    
    // 如果是表單創建者，可以編輯任何回應
    if (form.created_by === userId) return true;
    
    // 如果是查看自己的回應，也有權限
    if (targetUserId === userId) return true;
    
    return false;
    
  } catch (error) {
    console.error('Error checking form response edit access:', error);
    return false;
  }
}

// ===== 輔助函數 =====

/**
 * 從上下文中提取表單 ID
 */
function extractFormId(context: PermissionContext): string | null {
  // 從 URL 參數中提取
  if (context.params?.id) {
    return context.params.id;
  }
  
  // 從請求 URL 中提取
  if (context.request) {
    const url = new URL(context.request.url);
    const match = url.pathname.match(/\/api\/forms\/([^/]+)/);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * 從上下文中提取回應 ID
 */
function extractResponseId(context: PermissionContext): string | null {
  // 從 URL 參數中提取
  if (context.params?.id) {
    return context.params.id;
  }
  
  // 從請求 URL 中提取
  if (context.request) {
    const url = new URL(context.request.url);
    const match = url.pathname.match(/\/api\/form-responses\/([^/]+)/);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * 從上下文中提取目標用戶 ID
 */
function extractTargetUserId(context: PermissionContext): string | null {
  // 從 URL 參數中提取用戶 ID
  if (context.params?.userId) {
    return context.params.userId;
  }
  
  // 從請求 URL 中提取
  if (context.request) {
    const url = new URL(context.request.url);
    const match = url.pathname.match(/\/users\/([^/]+)/);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// ===== 權限檢查主函數 =====

/**
 * 根據 API 路徑和方法檢查權限
 */
export function checkApiPermission(
  method: string,
  path: string,
  userRole: { name: string; order?: number } | null,
  userId: string,
  context?: PermissionContext
): boolean | Promise<boolean> {
  // 尋找匹配的 API 配置
  const apiConfig = findApiConfig(method, path);
  
  if (!apiConfig) {
    // 如果沒有找到配置，默認拒絕訪問
    return false;
  }
  
  return checkPermission(apiConfig, userRole, userId, context);
}

/**
 * 根據 API 配置檢查權限
 */
export function checkPermission(
  config: ApiPermissionConfig,
  userRole: { name: string; order?: number } | null,
  userId: string,
  context?: PermissionContext
): boolean | Promise<boolean> {
  if (!userRole) return false;
  
  const { permissions } = config;
  
  // 如果有自定義檢查函數，使用自定義檢查
  if (permissions.customCheck) {
    return permissions.customCheck(userRole, userId, context);
  }
  
  // 檢查角色權限
  if (permissions.roles) {
    const hasRolePermission = permissions.roles.includes(userRole.name as RoleName);
    if (hasRolePermission) return true;
  }
  
  // 檢查自我訪問權限
  if (permissions.allowSelfAccess && context?.targetUserId === userId) {
    return true;
  }
  
  return false;
}

/**
 * 根據方法和路徑尋找 API 配置
 */
function findApiConfig(method: string, path: string): ApiPermissionConfig | null {
  for (const config of Object.values(API_PERMISSIONS)) {
    if (config.method === method && pathMatches(config.path, path)) {
      return config;
    }
  }
  return null;
}

/**
 * 檢查路徑是否匹配（支援動態路由參數）
 */
function pathMatches(configPath: string, actualPath: string): boolean {
  // 將配置路徑轉換為正則表達式
  const regexPath = configPath
    .replace(/\[([^\]]+)\]/g, '([^/]+)') // 將 [id] 轉換為 ([^/]+)
    .replace(/\//g, '\\/'); // 轉義斜線
  
  const regex = new RegExp(`^${regexPath}$`);
  return regex.test(actualPath);
}

/**
 * 獲取所有 API 權限配置（用於管理界面）
 */
export function getAllApiPermissions(): Record<string, ApiPermissionConfig> {
  return API_PERMISSIONS;
}

/**
 * 根據特性分組獲取 API 權限
 */
export function getPermissionsByFeature(): Record<string, ApiPermissionConfig[]> {
  const grouped: Record<string, ApiPermissionConfig[]> = {};
  
  Object.entries(API_PERMISSIONS).forEach(([_, config]) => {
    const featureGroup = config.feature.split('管理')[0] + '管理';
    if (!grouped[featureGroup]) {
      grouped[featureGroup] = [];
    }
    grouped[featureGroup].push(config);
  });
  
  return grouped;
} 