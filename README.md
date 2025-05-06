# 小學伴資料管理系統

## 專案概述
小學伴資料管理系統是一個為教育組織設計的網頁應用程式，用於管理小學伴資料、追蹤小學伴資訊，並控制教師和管理員對小學伴資料的訪問權限。系統支援小學伴基本資訊管理、弱勢小學伴標記、詳細背景記錄等功能，提供一個完整的解決方案來簡化學生資料的管理流程。

## 核心功能

### 1. 學生資料管理
- 學生基本資料：管理學生姓名、性別、年級、班級、電子郵件等資訊
- 學生詳細背景：記錄家庭背景、文化不利因素、個人背景補充說明
- 弱勢學生識別：明確標記是否為弱勢生，方便特別關注
- 學生分類系統：區分新生/舊生，方便針對不同類型學生提供服務
- 學生資料查詢：多欄位篩選與搜尋功能，方便快速找到特定學生

### 2. 資料匯入功能
- 支援從 Excel 或 CSV 檔案批量匯入學生資料
- 資料預覽與驗證：上傳前可預覽資料，確保資料格式正確
- 資料欄位映射：自動識別欄位名稱，解決不同格式資料匯入問題
- 錯誤處理與反饋：清晰顯示匯入過程中的錯誤訊息

### 3. 使用者權限管理
- 多層級權限系統：系統管理員(root)、全域管理員(admin)、區域管理員(manager)、教師(teacher)
- 白名單機制：僅允許被授權的用戶存取系統
- 教師學生分配：管理員可指定特定教師查看特定學生資料
- 權限階層控制：上級權限可管理下級用戶，但無法修改同級或更高權限

### 4. 系統監控與數據分析
- 即時用戶活動監控：查看當前在線用戶及其最後活動時間
- 學生資料統計：學生總數、弱勢學生比例、年級與類型分佈等
- 教師學生分配統計：各教師負責學生數量比較
- 系統使用趨勢：學生資料隨時間變化趨勢

## 資料模型

### 用戶表格 (users)
```sql
CREATE TABLE "users" (
  "id" UUID DEFAULT gen_random_uuid() UNIQUE, 
  "email" VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE,
  "name" VARCHAR(255),
  "role" VARCHAR(10) NOT NULL CHECK (role IN ('teacher', 'admin', 'root')),
  "avatar_url" TEXT,
  "region" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_active" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 學生表格 (students)
```sql
CREATE TABLE "students" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "gender" VARCHAR(4) NOT NULL CHECK (gender IN ('男', '女')),
  "grade" VARCHAR(10) NOT NULL,
  "class" VARCHAR(10) NOT NULL,
  "email" VARCHAR(255) UNIQUE,
  "region" VARCHAR(255),
  "account_username" VARCHAR(255),
  "account_password" VARCHAR(255),
  "student_type" VARCHAR(4) NOT NULL CHECK (student_type IN ('新生', '舊生')),
  "is_disadvantaged" VARCHAR(4) NOT NULL CHECK (is_disadvantaged IN ('是', '否')),
  "family_background" TEXT,
  "cultural_disadvantage_factors" TEXT,
  "personal_background_notes" TEXT,
  "registration_motivation" TEXT,
  "additional_info" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 教師-學生權限關聯表格 (teacher_student_access)
```sql
CREATE TABLE "teacher_student_access" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacher_id" UUID NOT NULL REFERENCES "users" (id) ON DELETE CASCADE,
  "student_id" UUID NOT NULL REFERENCES "students" (id) ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, student_id)
);
```

## 技術實現

### 前端技術
- 框架：Next.js (React)
- 身份驗證：自定義 Auth Provider，支援 Google OAuth 登入
- UI 元件：自定義元件庫 (Button, Card, Dialog 等)
- 表格呈現：使用 TanStack Table 實現排序、篩選、分頁等功能
- 資料視覺化：Recharts 圖表庫，呈現系統分析資料

### 後端技術
- 資料庫：PostgreSQL 與 Supabase
- API 路由：Next.js API Routes
- 檔案處理：支援 Excel 和 CSV 格式解析
- 權限控制：基於 JWT 的身份驗證和授權系統

### 系統安全
- 白名單控制：未被授權的用戶無法訪問系統功能
- 角色層級：嚴格的角色權限階層控制
- 資料隔離：教師僅能訪問被授權的學生資料

## 操作手冊

### 系統管理員 (root) 使用流程

1. **登入系統**
   - 使用 Google 帳號登入
   - 系統會自動識別您的最高管理員權限

2. **控制台總覽**
   - 登入後進入控制台，可看到所有功能選項
   - 基本功能包含：學生資料管理
   - 管理員功能包含：用戶權限管理、學生分配、資料匯入、系統分析

3. **匯入學生資料**
   - 進入「匯入學生資料」功能
   - 查看格式說明，確保檔案符合要求
   - 上傳 Excel/CSV 檔案
   - 預覽資料無誤後確認匯入

4. **管理用戶權限**
   - 查看系統中所有用戶
   - 新增用戶到白名單，設定其角色
   - 移除不需要的用戶權限

5. **分配學生給教師**
   - 選擇特定教師
   - 勾選需要分配的學生
   - 保存分配設定

6. **查看系統分析**
   - 查看即時統計數據：在線用戶、學生總數、弱勢學生比例等
   - 查看分佈圖表：各年級學生分佈、學生類型分佈
   - 追蹤教師活動狀況

### 教師 (teacher) 使用流程

1. **登入系統**
   - 使用 Google 帳號登入
   - 系統會驗證您的授權狀態

2. **查看學生資料**
   - 進入學生資料管理頁面
   - 僅能看到被分配給您的學生
   - 使用搜尋與篩選功能找到特定學生

3. **查看學生詳細資料**
   - 點擊「查看」按鈕開啟學生詳細資料
   - 查看學生基本資訊、背景資料等
   - 使用導覽功能在不同學生之間切換

4. **編輯學生資料**
   - 點擊「編輯」按鈕修改學生資訊
   - 更新後儲存變更
   - 注意：教師無法刪除學生資料

### 管理員 (admin) 使用流程

1. **登入後管理用戶**
   - 新增/編輯教師用戶
   - 設定用戶角色
   - 管理用戶存取權限

2. **管理學生資料**
   - 新增、編輯、刪除學生資料
   - 查看所有學生的詳細資訊
   - 對學生資料進行批量操作

3. **使用資料匯入功能**
   - 使用批量匯入功能快速建立資料庫
   - 驗證匯入資料格式
   - 確認匯入結果

## 系統特色
- 友善直覺的使用者介面
- 即時反饋的操作提示
- 完整的學生背景記錄功能
- 針對弱勢學生的特別標記
- 靈活的權限控制，確保資料安全
- 即時系統監控與數據分析

## Docker 部署指南

本系統提供兩種 Docker 映像檔，分別用於生產環境和開發環境。

### Docker Hub 儲存庫
映像檔已發布在公開的 Docker Hub 儲存庫中：
[https://hub.docker.com/r/ruby0322/2025cloud](https://hub.docker.com/r/ruby0322/2025cloud)

### 映像檔標籤策略
- `prod`: 生產環境優化版本
- `dev`: 開發環境版本 (包含所有開發依賴)
- `latest`: 始終指向最新的生產版本
- `sha-xxxxx`: 基於 Git commit SHA 的版本
- `branch-xxxx`: 基於 Git 分支的版本

### 環境變數配置

本系統需要 Supabase 的環境變數才能正常運作。建立一個 `.env.local` 檔案設定以下變數：

```
# Supabase 專案 URL (在 Supabase 專案設定中找到)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase 公開 API 金鑰 (在 Supabase 專案設定中找到)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase 服務角色金鑰 (僅在後端使用，不要暴露在前端)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

這些環境變數在構建和運行 Docker 容器時可以通過以下方式提供：

#### 使用 docker-compose.yml

我們提供了 docker-compose.yml 檔案簡化本地開發：

```bash
# 先設定 .env.local 檔案，然後執行：
docker-compose up
```

#### 使用 Docker 運行命令

```bash
# 開發環境
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -v $(pwd):/app \
  ruby0322/2025cloud:dev

# 生產環境
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  ruby0322/2025cloud:prod
```

### 使用 Docker 打包應用程式

#### 生產版本映像檔
生產版本映像檔針對系統部署進行了優化，包含完整的應用程式和最小化依賴。

建置指令 (包含環境變數)：
```bash
docker build -t ruby0322/2025cloud:prod \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your-url \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  -f Dockerfile.prod .
```

運行指令：
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  ruby0322/2025cloud:prod
```

#### 開發版本映像檔
開發版本映像檔包含所有開發依賴並支援熱重載功能，適合開發環境使用。

建置指令：
```bash
docker build -t ruby0322/2025cloud:dev \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your-url \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -f Dockerfile.dev .
```

運行指令 (支援熱重載)：
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -v $(pwd):/app \
  ruby0322/2025cloud:dev
```

### 自動化部署流程

本項目使用 GitHub Actions 自動構建並推送 Docker 映像檔到 Docker Hub。自動化工作流程檔案位於: `.github/workflows/docker.yml`

#### 自動化工作流程
1. 當推送到主分支時：
   - 同時構建生產和開發映像檔
   - 根據標籤策略推送映像檔到 Docker Hub
   
2. 當創建拉取請求時：
   - 構建映像檔以驗證構建過程
   - 不會推送到 Docker Hub (僅驗證構建)

#### 測試自動化失敗檢測
如果想要測試自動化工作流程的失敗檢測功能，可以創建一個包含以下修改的 Pull Request：

在 Dockerfile.prod 中，將基礎映像檔改為不存在的映像檔：
```diff
- FROM node:18-alpine AS builder
+ FROM nonexistent-image:latest AS builder
```

這將導致構建過程失敗，GitHub Actions 將會檢測到這個錯誤並標記該 PR 為失敗。

#### 配置 Docker Hub 憑證
為了讓 GitHub Actions 可以推送映像檔到 Docker Hub，需要在 GitHub 儲存庫的 Settings > Secrets and variables > Actions 中添加以下密鑰：

1. `DOCKERHUB_USERNAME`: Docker Hub 的用戶名
2. `DOCKERHUB_TOKEN`: Docker Hub 的訪問令牌 (非密碼)

#### 配置 Supabase 憑證
此外，需要在 GitHub 儲存庫的 Secrets 中添加以下 Supabase 相關密鑰：

1. `NEXT_PUBLIC_SUPABASE_URL`: Supabase 專案 URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 公開 API 金鑰
3. `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服務角色金鑰

這些密鑰將在 GitHub Actions 工作流程中用於建置 Docker 映像檔。

獲取 Docker Hub 訪問令牌的步驟：
1. 登入 Docker Hub
2. 進入 Account Settings > Security
3. 創建新的訪問令牌並設置適當的權限

獲取 Supabase 憑證的步驟：
1. 登入 Supabase 控制台
2. 選擇你的專案
3. 前往 Project Settings > API
4. 複製 Project URL 和 API keys
