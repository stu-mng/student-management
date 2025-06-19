// 權限系統內容管理
// 集中管理所有權限相關的文字描述和內容

export interface RoleDescription {
  name: string;
  displayName: string;
  description: string;
  details: string;
}

export interface PermissionMatrixRow {
  resource: string;
  operation: string;
  endpoint: string;
  permissions: {
    root: string;
    admin: string;
    manager: string;
    'class-teacher': string;
    teacher: string;
    candidate: string;
    'new-registrant': string;
  };
}

// 角色描述
export const roleDescriptions: RoleDescription[] = [
  {
    name: 'root',
    displayName: '系統管理員',
    description: '最高權限管理者，能夠管理所有使用者、學生資料及所有系統功能。',
    details: '可以創建其他系統管理員、計畫主持人、帶班老師、學校負責人、大學伴、儲備大學伴和新報名帳號。'
  },
  {
    name: 'admin',
    displayName: '計畫主持人',
    description: '全系統管理者，能夠管理除系統管理員外的所有使用者，以及所有學生資料。',
    details: '可以創建帶班老師、學校負責人、大學伴、儲備大學伴和新報名帳號，管理所有區域的資料。'
  },
  {
    name: 'class-teacher',
    displayName: '帶班老師',
    description: '負責帶領多個大學伴的教師，具有全域管理權限。',
    details: '可以查看和編輯所有學生資料，協助指導大學伴教學工作。'
  },
  {
    name: 'manager',
    displayName: '學校負責人',
    description: '特定區域的管理者，只能管理其負責區域的學生資料，以及查看所在區域的資訊。',
    details: '可以創建大學伴、儲備大學伴和新報名帳號，並將區域內的學生分配給大學伴。'
  },
  {
    name: 'teacher',
    displayName: '大學伴',
    description: '基本教學使用者，只能查看和編輯被分配給自己的學生資料。',
    details: '無法創建或管理其他用戶，僅能查看和編輯被分配的學生。'
  },
  {
    name: 'candidate',
    displayName: '儲備大學伴',
    description: '候補教學人員，具有有限的系統訪問權限。',
    details: '可能具有查看權限，但通常無法進行編輯操作，等待升級為正式大學伴。'
  },
  {
    name: 'new-registrant',
    displayName: '新報名帳號',
    description: '剛註冊的新用戶，僅具有最基本的系統訪問權限。',
    details: '只能查看基本資訊和填寫指定表單，等待管理員審核和分配正式角色。'
  }
];

// 權限矩陣資料
export const permissionMatrix: PermissionMatrixRow[] = [
  // 使用者管理
  {
    resource: '查看用戶列表',
    operation: 'GET /api/users',
    endpoint: 'GET /api/users',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '✅',
      manager: '✅',
      teacher: '❌',
      candidate: '❌',
      'new-registrant': '❌'
    }
  },
  {
    resource: '查看用戶詳情',
    operation: 'GET /api/users/[id]',
    endpoint: 'GET /api/users/[id]',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '✅',
      manager: '✅',
      teacher: '僅自己',
      candidate: '僅自己',
      'new-registrant': '僅自己'
    }
  },
  {
    resource: '新增用戶',
    operation: 'POST /api/users',
    endpoint: 'POST /api/users',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '✅',
      manager: '❌',
      teacher: '❌',
      candidate: '❌',
      'new-registrant': '❌'
    }
  },
  {
    resource: '編輯用戶',
    operation: 'PUT /api/users/[id]',
    endpoint: 'PUT /api/users/[id]',
    permissions: {
      root: '✅',
      admin: '除 root 外',
      'class-teacher': '除 root／admin 外',
      manager: '❌',
      teacher: '❌',
      candidate: '❌',
      'new-registrant': '❌'
    }
  },
  // 學生管理
  {
    resource: '學生管理',
    operation: 'GET /api/students/manage',
    endpoint: 'GET /api/students/manage',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '✅',
      manager: '✅',
      teacher: '❌',
      candidate: '❌',
      'new-registrant': '❌'
    }
  },
  {
    resource: '查看所有學生',
    operation: 'GET /api/students',
    endpoint: 'GET /api/students',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '全域',
      manager: '全域',
      teacher: '全域',
      candidate: '全域',
      'new-registrant': '❌'
    }
  },
  {
    resource: '新增學生',
    operation: 'POST /api/students',
    endpoint: 'POST /api/students',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '✅',
      manager: '本域',
      teacher: '❌',
      candidate: '❌',
      'new-registrant': '❌'
    }
  },
  {
    resource: '編輯學生',
    operation: 'PUT /api/students/[id]',
    endpoint: 'PUT /api/students/[id]',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '全域',
      manager: '全域',
      teacher: '全域',
      candidate: '全域',
      'new-registrant': '❌'
    }
  },
  {
    resource: '刪除學生',
    operation: 'DELETE /api/students/[id]',
    endpoint: 'DELETE /api/students/[id]',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '❌',
      manager: '❌',
      teacher: '❌',
      candidate: '❌',
      'new-registrant': '❌'
    }
  },
  // 表單管理
  {
    resource: '查看表單',
    operation: 'GET /api/forms',
    endpoint: 'GET /api/forms',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '✅',
      manager: '✅',
      teacher: '✅',
      candidate: '❌',
      'new-registrant': '❌'
    }
  },
  {
    resource: '創建表單',
    operation: 'POST /api/forms',
    endpoint: 'POST /api/forms',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '✅',
      manager: '✅',
      teacher: '✅',
      candidate: '❌',
      'new-registrant': '❌'
    }
  },
  {
    resource: '編輯表單',
    operation: 'PUT /api/forms/[id]',
    endpoint: 'PUT /api/forms/[id]',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '✅',
      manager: '✅',
      teacher: '✅',
      candidate: '❌',
      'new-registrant': '❌'
    }
  },
  {
    resource: '刪除表單',
    operation: 'DELETE /api/forms/[id]',
    endpoint: 'DELETE /api/forms/[id]',
    permissions: {
      root: '✅',
      admin: '✅',
      'class-teacher': '❌',
      manager: '❌',
      teacher: '❌',
      candidate: '❌',
      'new-registrant': '❌'
    }
  }
];

// 權限矩陣分組
export const permissionGroups = [
  {
    name: '使用者管理',
    rows: permissionMatrix.slice(0, 4)
  },
  {
    name: '學生管理',
    rows: permissionMatrix.slice(4, 9)
  },
  {
    name: '表單管理',
    rows: permissionMatrix.slice(9, 13)
  }
];

// 角色表頭資訊
export const roleHeaders = [
  { key: 'root', name: '系統管理員', subName: '(root)' },
  { key: 'admin', name: '計畫主持人', subName: '(admin)' },
  { key: 'class-teacher', name: '帶班老師', subName: '(class-teacher)' },
  { key: 'manager', name: '學校負責人', subName: '(manager)' },
  { key: 'teacher', name: '大學伴', subName: '(teacher)' },
  { key: 'candidate', name: '儲備大學伴', subName: '(candidate)' },
  { key: 'new-registrant', name: '新報名帳號', subName: '(new-registrant)' }
]; 