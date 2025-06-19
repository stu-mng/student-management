import { BarChart3, Eye, FileSpreadsheet, FileText, LucideIcon, Settings, Shield, UserCheck, Users } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  allowedRoles: string[];
}

interface NewFeature {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
}

interface LandingContent {
  hero: {
    title: string;
    description: string;
    buttonText: string;
  };
  features: {
    title: string;
    items: Feature[];
  };
  newFeatures: {
    title: string;
    items: NewFeature[];
  };
}

export const landingContent: LandingContent = {
  hero: {
    title: "興大學伴酷系統",
    description: "高效能、安全的學生資料管理解決方案，具備完整的用戶管理與表單系統",
    buttonText: "登入系統"
  },
  features: {
    title: "核心功能",
    items: [
      {
        title: "學生資料管理",
        description: "完整的學生資料管理，包含新增、編輯、查詢及教師分配",
        icon: Users,
        allowedRoles: ["teacher", "admin", "root", "manager"]
      },
      {
        title: "表單管理系統",
        description: "動態表單建立、權限控制、回應追蹤與審核功能",
        icon: FileText,
        allowedRoles: ["teacher", "admin", "root", "manager", "candidate"]
      },
      {
        title: "用戶資料管理",
        description: "個人資料頁面、頭像顯示、在線狀態與活動追蹤",
        icon: UserCheck,
        allowedRoles: ["teacher", "admin", "root", "manager", "candidate"]
      },
      {
        title: "資料匯入",
        description: "支援多種格式的資料匯入，快速建立學生資料庫",
        icon: FileSpreadsheet,
        allowedRoles: ["admin", "root"]
      },
      {
        title: "進階權限管理",
        description: "多層級權限控制、區域管理、角色分配與白名單系統",
        icon: Shield,
        allowedRoles: ["admin", "root", "manager"]
      },
      {
        title: "隱私保護",
        description: "權限分級查看、表單回應保護、敏感資料存取控制",
        icon: Eye,
        allowedRoles: ["teacher", "admin", "root", "manager", "candidate"]
      },
      {
        title: "系統分析",
        description: "用戶活動監控、表單統計分析、系統效能追蹤",
        icon: BarChart3,
        allowedRoles: ["root"]
      }
    ]
  },
  newFeatures: {
    title: "最新功能",
    items: [
      {
        title: "智能用戶頭像",
        description: "自動顯示用戶頭像、在線狀態與角色標識",
        icon: UserCheck,
        iconBgColor: "bg-green-100",
        iconColor: "text-green-600"
      },
      {
        title: "動態表單系統",
        description: "可自訂表單欄位、權限設定與回應管理",
        icon: FileText,
        iconBgColor: "bg-blue-100",
        iconColor: "text-blue-600"
      },
      {
        title: "分級權限控制",
        description: "根據用戶權限等級控制資料存取範圍",
        icon: Shield,
        iconBgColor: "bg-purple-100",
        iconColor: "text-purple-600"
      },
      {
        title: "區域管理",
        description: "支援多區域管理與地理位置分組",
        icon: Settings,
        iconBgColor: "bg-orange-100",
        iconColor: "text-orange-600"
      }
    ]
  }
}; 