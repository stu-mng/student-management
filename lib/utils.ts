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
            return '全域管理員';
        case 'teacher':
            return '大學伴';
        case 'manager':
            return '區域管理員';
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
        case 'teacher':
            return 3;
        default:
            return 4;
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
