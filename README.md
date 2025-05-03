# 小學伴資料管理系統

## 專案概述
小學伴資料管理系統是一個為教育機構設計的網頁應用程式，用於管理小學伴資料、追蹤小學伴資訊，並控制教師和管理員對小學伴資料的訪問權限。系統支援小學伴基本資訊管理、弱勢小學伴標記、詳細背景記錄等功能。

## 核心功能

### 1. 身份驗證與權限控制
- 使用 Google 帳戶登入系統
- 權限分級：管理員和教師角色
- 管理員可進行所有操作，包括新增小學伴、管理用戶權限
- 教師僅能訪問被授權的小學伴資料

### 2. 小學伴資料管理
- 小學伴基本資料：姓名、性別、年級、班級、電子郵件等
- 小學伴背景資訊：家庭背景、文化不利因素、個人背景補充
- 弱勢小學伴識別：標記是否為弱勢生
- 小學伴分類：新生/舊生區分

### 3. 用戶管理
- 管理員可新增/刪除教師或管理員用戶
- 管理員可修改用戶角色

### 4. 資料呈現與操作
- 小學伴資料表格化呈現，支援排序與篩選
- 小學伴詳細資料查看，支援導航功能（前/後小學伴切換）
- 小學伴資料編輯/刪除功能

## 資料庫結構

### 用戶表格 (users)
- id: UUID (主鍵)
- email: TEXT (唯一，不可為空)
- name: TEXT
- role: TEXT (教師 'teacher' 或管理員 'admin')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### 小學伴資料表格 (students)
- id: UUID (主鍵)
- student_id: TEXT (唯一，不可為空)
- name: TEXT (不可為空)
- department: TEXT
- grade: INTEGER
- email: TEXT
- phone: TEXT
- additional_info: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### 教師-小學伴關聯表格 (teacher_student_access)
- id: UUID (主鍵)
- teacher_id: UUID (外鍵，連結至 users 表格)
- student_id: UUID (外鍵，連結至 students 表格)
- created_at: TIMESTAMP

## 技術實現

### 前端技術
- 框架：Next.js (React)
- UI 元件：自定義元件庫 (Button, Card, Dialog 等)
- 表格呈現：使用 TanStack Table 實現排序、分頁等功能
- 表單處理：表單驗證和提交邏輯

### 身份驗證
- 使用 Google OAuth 進行身份驗證
- 基於 `useAuth` 自定義 Hook 實現身份狀態管理

### 資料處理
- 使用異步請求處理資料 CRUD 操作
- 使用 Toast 通知系統反饋操作結果

## 頁面結構
- `/` - 首頁，提供登入選項
- `/login` - 登入頁面
- `/dashboard` - 資料總覽頁面
- `/dashboard/students/new` - 新增小學伴頁面
- `/dashboard/students/[id]` - 小學伴資料編輯頁面
- `/dashboard/permissions` - 用戶權限管理頁面

## 系統特色
- 友善的使用者介面
- 詳細的小學伴背景記錄功能
- 針對弱勢小學伴的特別標記
- 精細的權限控制，確保資料安全
