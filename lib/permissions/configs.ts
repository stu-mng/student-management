import { checkFormAccess, checkFormDeleteAccess, checkFormEditAccess, checkFormResponseAccess, checkFormResponseEditAccess, checkFormResponseViewAccess } from './checks';

export const API_PERMISSIONS = {
  users: {
    list: {
      feature: '用戶列表',
      description: '查看所有用戶列表',
      method: 'GET',
      path: '/api/users',
      permissions: { roles: ['root', 'admin', 'manager', 'class-teacher'] },
    },
    create: {
      feature: '創建用戶',
      description: '創建新用戶',
      method: 'POST',
      path: '/api/users',
      permissions: { roles: ['root', 'admin', 'manager'] },
    },
    view: {
      feature: '查看用戶詳情',
      description: '查看單個用戶詳情',
      method: 'GET',
      path: '/api/users/[id]',
      permissions: {
        customCheck: ({ userRole, userId, path }) => {
          if (!userRole) return false;
          if (['root', 'admin', 'manager', 'class-teacher'].includes(userRole.name)) return true;
          // self-access: /api/users/[id]
          const id = path.split('/').pop();
          return id === userId;
        },
      },
    },
    update: {
      feature: '更新用戶',
      description: '更新用戶資訊',
      method: 'PUT',
      path: '/api/users/[id]',
      permissions: {
        customCheck: ({ userRole, userId, path }) => {
          if (!userRole) return false;
          if (['root', 'admin', 'manager'].includes(userRole.name)) return true;
          const id = path.split('/').pop();
          return id === userId;
        },
      },
    },
    delete: {
      feature: '刪除用戶',
      description: '刪除用戶',
      method: 'DELETE',
      path: '/api/users/[id]',
      permissions: { roles: ['root', 'admin'] },
    },
    me: {
      feature: '個人資訊',
      description: '查看自己的用戶資訊',
      method: 'GET',
      path: '/api/users/me',
      permissions: { roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher', 'candidate', 'new-registrant'] },
    },
    activity: {
      feature: '用戶活動記錄',
      description: '查看用戶活動記錄',
      method: 'GET',
      path: '/api/users/activity',
      permissions: { roles: ['root', 'admin', 'class-teacher', 'manager'] },
    },
  },
  roles: {
    list: {
      feature: '角色列表',
      description: '查看所有角色列表',
      method: 'GET',
      path: '/api/roles',
      permissions: { roles: ['root', 'admin', 'class-teacher', 'manager'] },
    },
  },
  students: {
    list: {
      feature: '學生列表',
      description: '查看學生列表',
      method: 'GET',
      path: '/api/students',
      permissions: { roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher', 'candidate'] },
    },
    create: {
      feature: '創建學生',
      description: '創建新學生記錄',
      method: 'POST',
      path: '/api/students',
      permissions: { roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher'] },
    },
    import: {
      feature: '匯入學生',
      description: '批量匯入學生資料',
      method: 'POST',
      path: '/api/students/import',
      permissions: { roles: ['root', 'admin'] },
    },
  },
  forms: {
    list: {
      feature: '表單列表',
      description: '查看表單列表',
      method: 'GET',
      path: '/api/forms',
      permissions: { roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher', 'candidate'] },
    },
    create: {
      feature: '創建表單',
      description: '創建新表單',
      method: 'POST',
      path: '/api/forms',
      permissions: { roles: ['root', 'admin', 'manager'] },
    },
    view: {
      feature: '查看表單',
      description: '查看單個表單詳情',
      method: 'GET',
      path: '/api/forms/[id]',
      permissions: { customCheck: checkFormAccess },
    },
    update: {
      feature: '更新表單',
      description: '更新表單內容',
      method: 'PUT',
      path: '/api/forms/[id]',
      permissions: { customCheck: checkFormEditAccess },
    },
    delete: {
      feature: '刪除表單',
      description: '刪除表單',
      method: 'DELETE',
      path: '/api/forms/[id]',
      permissions: { customCheck: checkFormDeleteAccess },
    },
    permissionsUpdate: {
      feature: '更新表單權限',
      description: '更新表單訪問權限設定',
      method: 'PUT',
      path: '/api/forms/[id]/permissions',
      permissions: { roles: ['root', 'admin'] },
    },
    accessCheck: {
      feature: '檢查表單訪問權限',
      description: '檢查用戶對表單的訪問權限',
      method: 'GET',
      path: '/api/forms/[id]/access',
      permissions: { roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher', 'candidate'] },
    },
    responsesList: {
      feature: '表單的回應列表',
      description: '查看特定表單的所有回應',
      method: 'GET',
      path: '/api/forms/[id]/responses',
      permissions: { customCheck: checkFormResponseViewAccess },
    },
    responsesOverview: {
      feature: '表單回應概覽',
      description: '查看表單回應統計概覽',
      method: 'GET',
      path: '/api/forms/[id]/responses/overview',
      permissions: { customCheck: checkFormResponseViewAccess },
    },
    responsesUser: {
      feature: '用戶表單回應',
      description: '查看特定用戶對表單的回應',
      method: 'GET',
      path: '/api/forms/[id]/responses/users/[userId]',
      permissions: { customCheck: checkFormResponseEditAccess },
    },
  },
  formResponses: {
    list: {
      feature: '表單回應列表',
      description: '查看表單回應列表',
      method: 'GET',
      path: '/api/form-responses',
      permissions: { roles: ['root', 'admin', 'class-teacher', 'manager'] },
    },
    view: {
      feature: '查看表單回應',
      description: '查看單個表單回應',
      method: 'GET',
      path: '/api/form-responses/[id]',
      permissions: { customCheck: checkFormResponseAccess },
    },
    update: {
      feature: '更新表單回應',
      description: '更新表單回應內容',
      method: 'PUT',
      path: '/api/form-responses/[id]',
      permissions: { roles: ['root', 'admin', 'class-teacher', 'manager'] },
    },
  },
  permissions: {
    assign: {
      feature: '分配權限',
      description: '批量分配教師對學生的權限',
      method: 'POST',
      path: '/api/permissions/assign',
      permissions: { roles: ['root', 'admin', 'class-teacher', 'manager'] },
    },
    assignedStudents: {
      feature: '查看分配的學生',
      description: '查看用戶被分配的學生列表',
      method: 'GET',
      path: '/api/permissions/assigned/students/[id]',
      permissions: {
        customCheck: ({ userRole, userId, path }) => {
          if (!userRole) return false;
          if (['root', 'admin', 'class-teacher', 'manager'].includes(userRole.name)) return true;
          const id = path.split('/').pop();
          return id === userId;
        },
      },
    },
  },
  regions: {
    list: {
      feature: '地區列表',
      description: '查看地區列表',
      method: 'GET',
      path: '/api/regions',
      permissions: { roles: ['root', 'admin', 'manager', 'class-teacher', 'teacher'] },
    },
  },
  analytics: {
    overview: {
      feature: '分析概覽',
      description: '查看系統分析數據',
      method: 'GET',
      path: '/api/analytics',
      permissions: { roles: ['root'] },
    },
    sessions: {
      feature: '會話分析',
      description: '查看在線用戶會話數據',
      method: 'GET',
      path: '/api/analytics/sessions',
      permissions: { roles: ['root'] },
    },
  },
};


