import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 根據角色獲取背景顏色
export const getRoleBgColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100';
      case 'teacher':
        return 'bg-green-100';
      case 'manager':
        return 'bg-yellow-100';
      case 'class-teacher':
        return 'bg-emerald-100';
      case 'candidate':
        return 'bg-gray-100';
      case 'new-registrant':
        return 'bg-slate-100';
      case 'root':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
}
  
// 根據角色獲取文字顏色
export const getRoleTextColor = (role: string) => {
    switch (role) {
        case 'admin':
            return 'text-blue-800';
        case 'teacher':
            return 'text-green-800';
        case 'manager':
            return 'text-yellow-800';
        case 'class-teacher':
            return 'text-teal-800';
        case 'candidate':
            return 'text-gray-800';
        case 'new-registrant':
            return 'text-slate-800';
        case 'root':
            return 'text-red-800';
        default:
            return 'text-gray-800';
    }
}

export const getRoleHoverTextColor = (role: string) => {
    switch (role) {
        case 'admin':
            return 'hover:text-blue-900';
        case 'teacher':
            return 'hover:text-green-900';
        case 'manager':
            return 'hover:text-yellow-900';
        case 'class-teacher':
            return 'hover:text-teal-900';
        case 'candidate':
            return 'hover:text-gray-900';
        case 'new-registrant':
            return 'hover:text-slate-900';
        case 'root':
            return 'hover:text-red-900';
        default:
            return 'hover:text-gray-900';
    }
}

// 根據角色顯示中文
export const getRoleDisplay = (role: string) => {
    switch (role) {
        case 'admin':
            return '計畫主持人';
        case 'teacher':
            return '大學伴';
        case 'manager':
            return '學校負責人';
        case 'class-teacher':
            return '帶班老師';
        case 'candidate':
            return '儲備大學伴';
        case 'new-registrant':
            return '新報名帳號';
        case 'root':
            return '系統管理員';
        default:
            return role;
    }
}

export const getRoleColor = (role: string) => {
switch (role) {
    case 'admin':
        return 'bg-blue-500';
    case 'teacher':
        return 'bg-green-500';
    case 'manager':
        return 'bg-yellow-500';
    case 'class-teacher':
        return 'bg-teal-500';
    case 'candidate':
        return 'bg-gray-500';
    case 'new-registrant':
        return 'bg-slate-500';
    case 'root':
        return 'bg-red-500';
    default:
        return 'bg-gray-500';
}
}

export const getRoleSortKey = (role: string) => {
    switch (role) {
        case 'root':
            return 0;
        case 'admin':
            return 1;
        case 'manager':
            return 2;
        case 'class-teacher':
            return 3;
        case 'teacher':
            return 4;
        case 'candidate':
            return 5;
        case 'new-registrant':
            return 6;
        default:
            return 7;
    }
}

export function toTraditionalChinese(num: number) {
  if (typeof num !== 'number' || !Number.isInteger(num) || num < 0) {
      return "錯誤：請輸入非負整數";
  }

  const units = ["", "十", "百", "千"];
  const bigUnits = ["", "萬", "億"];
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

  let result = "";
  let bigUnitIndex = 0;
  let isPreviousZero = false;

  while (num > 0) {
      let chunk = num % 10000; // Get the last 4 digits
      num = Math.floor(num / 10000);

      let chunkResult = "";
      let unitIndexForChunk = 0;
      let hasNonZero = false; // Track if the chunk has any non-zero digit

      while (chunk > 0) {
          const digit = chunk % 10;
          chunk = Math.floor(chunk / 10);

          if (digit !== 0) {
              if (isPreviousZero) {
                  chunkResult = "零" + chunkResult;
              }
              chunkResult = digits[digit] + units[unitIndexForChunk] + chunkResult;
              isPreviousZero = false;
              hasNonZero = true;
          } else {
              isPreviousZero = true;
          }
          unitIndexForChunk++;
      }

      if (hasNonZero) {
          result = chunkResult + bigUnits[bigUnitIndex] + result;
      }
      else if (bigUnitIndex > 0 && result.length>0 && !result.startsWith("零"))
      {
           result = "零" + result;
      }

      bigUnitIndex++;
      isPreviousZero = false;
  }
  //處理 10, 100, 1000, 10000， 一十，一百，一千，一萬
  if (result.startsWith("一十")) {
      result = result.slice(1);
  }
  if (result === "") {
      result = "零";
  }

  return result;
}

// 通用的日期格式化函數，避免 hydration 錯誤
export function formatDate(dateString: string | null): string {
  if (!dateString) return '無期限'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

// 格式化相對時間，避免 hydration 錯誤
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '從未登入';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // 轉換為秒、分鐘、小時、天
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  // 格式化相對時間
  if (diffSecs < 60) {
    return `${diffSecs} 秒前`;
  } else if (diffMins < 60) {
    return `${diffMins} 分鐘前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小時前`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} 週前`;
  } else if (diffMonths < 12) {
    return `${diffMonths} 個月前`;
  } else {
    // 如果超過一年，顯示日期
    return formatDate(dateString);
  }
}

// ===== Role Utility Functions =====

// 角色權限檢查函數 - 使用 order 比較，數字越小權力越大
export function isAdmin(role?: { name: string; order?: number } | null): boolean {
  // 保持向後兼容性，同時支援 order 比較
  if (role?.order !== undefined) {
    return role.order <= 1; // admin 和 root 的 order 通常是 0 和 1
  }
  return role?.name === 'admin' || role?.name === 'root';
}

export function isRoot(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order === 0; // root 通常是最高權限，order = 0
  }
  return role?.name === 'root';
}

export function isManager(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order === 2; // manager 通常是 order = 2
  }
  return role?.name === 'manager';
}

export function isTeacher(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order === 4; // teacher 通常是 order = 4
  }
  return role?.name === 'teacher';
}

export function isCandidate(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order === 5; // candidate 通常是 order = 5
  }
  return role?.name === 'candidate';
}

export function isClassTeacher(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order === 3; // class-teacher 通常是 order = 3
  }
  return role?.name === 'class-teacher';
}

export function isNewRegistrant(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order === 6; // new-registrant 通常是 order = 6
  }
  return role?.name === 'new-registrant';
}

// 檢查是否有管理權限（admin 或 root）
export function hasAdminPermission(role?: { name: string; order?: number } | null): boolean {
  return isAdmin(role);
}

// 檢查是否有管理員級別權限（admin, root, manager）
export function hasManagerPermission(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order <= 3; // admin(1), root(0), manager(2), class-teacher(3) 以上
  }
  return role?.name ? ['admin', 'root', 'manager'].includes(role.name) : false;
}

// 檢查是否有表單管理權限
export function hasFormManagePermission(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order <= 3; // admin(1), root(0), manager(2), class-teacher(3) 以上
  }
  return role?.name ? ['admin', 'root', 'manager'].includes(role.name) : false;
}

// 檢查是否有用戶管理權限
export function hasUserManagePermission(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order <= 3; 
  }
  return role?.name ? ['admin', 'root', 'manager', 'class-teacher'].includes(role.name) : false;
}

// 檢查是否有學生管理權限（可以查看和編輯學生）
export function hasStudentManagePermission(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order <= 4; // admin(1), root(0), manager(2), class-teacher(3), teacher(4)
  }
  return role?.name ? ['admin', 'root', 'manager', 'class-teacher', 'teacher'].includes(role.name) : false;
}

// 檢查是否有學生查看權限
export function hasStudentViewPermission(role?: { name: string; order?: number } | null): boolean {
  if (role?.order !== undefined) {
    return role.order <= 5; // 包含所有角色到 candidate(5)
  }
  return role?.name ? ['admin', 'root', 'manager', 'class-teacher', 'teacher', 'candidate'].includes(role.name) : false;
}

// 檢查角色權限等級比較 - 使用 order 比較
export function hasHigherPermission(userRole?: { name: string; order?: number } | null, targetRole?: { name: string; order?: number } | null): boolean {
  if (!userRole || !targetRole) return false;
  
  // 優先使用 order 比較
  if (userRole.order !== undefined && targetRole.order !== undefined) {
    return userRole.order < targetRole.order; // 數字越小權力越大
  }
  
  // 向後兼容性：使用舊的 name 比較
  if (!userRole.name || !targetRole.name) return false;
  return getRoleSortKey(userRole.name) < getRoleSortKey(targetRole.name);
}

export function hasEqualOrHigherPermission(userRole?: { name: string; order?: number } | null, targetRole?: { name: string; order?: number } | null): boolean {
  if (!userRole || !targetRole) return false;
  
  // 優先使用 order 比較
  if (userRole.order !== undefined && targetRole.order !== undefined) {
    return userRole.order <= targetRole.order; // 數字越小權力越大
  }
  
  // 向後兼容性：使用舊的 name 比較
  if (!userRole.name || !targetRole.name) return false;
  return getRoleSortKey(userRole.name) <= getRoleSortKey(targetRole.name);
}

// 檢查是否可以編輯目標用戶
export function canEditUser(currentUserRole?: { name: string; order?: number } | null, targetUserRole?: { name: string; order?: number } | null): boolean {
  return hasEqualOrHigherPermission(currentUserRole, targetUserRole);
}

// 檢查是否可以刪除目標用戶
export function canDeleteUser(currentUserRole?: { name: string; order?: number } | null, targetUserRole?: { name: string; order?: number } | null): boolean {
  return hasHigherPermission(currentUserRole, targetUserRole);
}

// 獲取角色名稱（安全版本）
export function getRoleName(role?: { name: string } | null): string {
  return role?.name || 'unknown';
}

// 獲取角色排序鍵 - 支援 order 屬性
export function getRoleOrder(role?: { name: string; order?: number } | null): number {
  if (role?.order !== undefined) {
    return role.order;
  }
  
  // 向後兼容性：使用舊的 name 映射
  return getRoleSortKey(role?.name || '');
}
