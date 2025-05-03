# 小學伴資料管理系統 API 規格

本文件定義了小學伴資料管理系統的 API 規格，遵循 OpenAPI 3.0.0 格式

## 基本資訊

- **標題**：小學伴資料管理系統 API
- **描述**：提供小學伴資料管理、用戶身份驗證與權限控制的 API
- **版本**：1.0.0
- **聯絡方式**：API 支援團隊 (support@example.com)

## API 分類

- **auth**: 身份驗證相關 API
- **students**: 小學伴資料管理 API
- **users**: 用戶管理 API
- **permissions**: 權限管理 API

## 認證方式

系統使用 JWT Bearer Token 認證機制：

```
Authorization: Bearer <token>
```

## API 端點

### 身份驗證 API

#### POST /api/auth/login

使用 Google OAuth 進行用戶身份驗證。

**請求參數**:

```json
{
  "token": "Google OAuth ID 令牌"
}
```

**回應**:

- `200 OK`: 成功登入
  ```json
  {
    "token": "JWT令牌",
    "user": {
      "id": "用戶ID",
      "email": "用戶郵箱",
      "name": "用戶名稱",
      "role": "用戶角色"
    }
  }
  ```
- `401 Unauthorized`: 身份驗證失敗

#### POST /api/auth/logout

使當前用戶的認證令牌失效。

**請求頭**:
- 需要認證令牌

**回應**:
- `200 OK`: 成功登出
- `401 Unauthorized`: 未授權操作

#### GET /api/auth/me

返回當前登入用戶的詳細資訊。

**請求頭**:
- 需要認證令牌

**回應**:
- `200 OK`: 成功獲取用戶資訊
  ```json
  {
    "id": "用戶ID",
    "email": "用戶郵箱",
    "name": "用戶名稱",
    "role": "用戶角色",
    "created_at": "創建時間",
    "updated_at": "更新時間"
  }
  ```
- `401 Unauthorized`: 未授權操作

### 小學伴管理 API

#### GET /api/students

根據教師權限或管理員身份返回小學伴列表。

**請求頭**:
- 需要認證令牌

**查詢參數**:
- `page`: 頁碼 (默認: 1)
- `limit`: 每頁項目數 (默認: 10, 最大: 100)
- `search`: 搜尋關鍵字
- `grade`: 依年級過濾 (1-6)
- `is_disadvantaged`: 依弱勢生狀態過濾 ('是', '否')
- `student_type`: 依小學伴類型過濾 ('新生', '舊生')

**回應**:
- `200 OK`: 成功獲取小學伴列表
  ```json
  {
    "total": 總數量,
    "page": 當前頁碼,
    "limit": 每頁項目數,
    "data": [
      {
        "id": "小學伴ID",
        "student_id": "學號",
        "name": "姓名",
        "gender": "性別",
        "grade": 年級,
        ...
      },
      ...
    ]
  }
  ```
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足

#### POST /api/students

新增一位小學伴資料到系統。

**請求頭**:
- 需要認證令牌

**請求內容**:
```json
{
  "name": "姓名",
  "gender": "性別",
  "grade": 年級,
  "class": "班級",
  "email": "電子郵件",
  "student_type": "小學伴類型",
  "is_disadvantaged": "是否弱勢生",
  ...
}
```

**回應**:
- `201 Created`: 成功創建小學伴
- `400 Bad Request`: 無效請求
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足

#### GET /api/students/{id}

根據ID獲取小學伴的詳細資料。

**請求頭**:
- 需要認證令牌

**路徑參數**:
- `id`: 小學伴 ID

**回應**:
- `200 OK`: 成功獲取小學伴資料
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足
- `404 Not Found`: 小學伴不存在

#### PUT /api/students/{id}

根據ID更新小學伴的資料。

**請求頭**:
- 需要認證令牌

**路徑參數**:
- `id`: 小學伴 ID

**請求內容**:
```json
{
  "name": "姓名",
  "gender": "性別",
  ...
}
```

**回應**:
- `200 OK`: 成功更新小學伴資料
- `400 Bad Request`: 無效請求
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足
- `404 Not Found`: 小學伴不存在

#### DELETE /api/students/{id}

根據ID刪除小學伴資料。

**請求頭**:
- 需要認證令牌

**路徑參數**:
- `id`: 小學伴 ID

**回應**:
- `204 No Content`: 成功刪除小學伴
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足
- `404 Not Found`: 小學伴不存在

### 用戶管理 API

#### GET /api/users

返回系統中所有用戶的列表（僅限管理員）。

**請求頭**:
- 需要認證令牌

**查詢參數**:
- `page`: 頁碼 (默認: 1)
- `limit`: 每頁項目數 (默認: 10, 最大: 100)
- `search`: 搜尋關鍵字
- `role`: 依角色過濾 ('teacher', 'admin')

**回應**:
- `200 OK`: 成功獲取用戶列表
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足

#### POST /api/users

新增一位用戶到系統（僅限管理員）。

**請求頭**:
- 需要認證令牌

**請求內容**:
```json
{
  "email": "電子郵件",
  "name": "姓名",
  "role": "角色"
}
```

**回應**:
- `201 Created`: 成功創建用戶
- `400 Bad Request`: 無效請求
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足
- `409 Conflict`: 郵件地址已存在

#### PUT /api/users/{id}

根據ID更新用戶的資料（僅限管理員）。

**請求頭**:
- 需要認證令牌

**路徑參數**:
- `id`: 用戶 ID

**請求內容**:
```json
{
  "email": "電子郵件",
  "name": "姓名",
  "role": "角色"
}
```

**回應**:
- `200 OK`: 成功更新用戶資料
- `400 Bad Request`: 無效請求
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足
- `404 Not Found`: 用戶不存在

#### DELETE /api/users/{id}

根據ID刪除用戶（僅限管理員）。

**請求頭**:
- 需要認證令牌

**路徑參數**:
- `id`: 用戶 ID

**回應**:
- `204 No Content`: 成功刪除用戶
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足
- `404 Not Found`: 用戶不存在

### 權限管理 API

#### GET /api/permissions/assigned/students/{id}

獲取指定教師可以查看的所有小學伴ID列表（僅限管理員或查詢本人資料）。

**請求頭**:
- 需要認證令牌

**路徑參數**:
- `id`: 教師 ID

**回應**:
- `200 OK`: 成功獲取小學伴ID列表
  ```json
  ["小學伴ID1", "小學伴ID2", "小學伴ID3", ...]
  ```
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足
- `404 Not Found`: 用戶不存在

#### POST /api/permissions/assign

批量分配或取消分配教師對小學伴的權限（僅限管理員）。

**請求頭**:
- 需要認證令牌

**請求內容**:
```json
{
  "teacher_id": "教師ID",
  "student_ids": ["小學伴ID1", "小學伴ID2", "小學伴ID3", ...]
}
```

**回應**:
- `200 OK`: 成功批量分配/取消分配權限
  ```json
  {
    "success": true,
    "added": 新增分配數量,
    "removed": 取消分配數量,
    "total": 目前分配總數,
    "message": "操作結果描述"
  }
  ```
- `400 Bad Request`: 無效請求
- `401 Unauthorized`: 未授權操作
- `403 Forbidden`: 權限不足
- `404 Not Found`: 教師不存在或不是教師角色

## 資料模型

關於 API 使用的資料模型詳細定義，請參考 [資料模型文件](./database/data-model.md)。 