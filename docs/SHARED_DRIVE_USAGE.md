# 共用雲端硬碟 API 使用說明

## 概述

此 API 專門用於存取 Google Drive 共用雲端硬碟中的檔案，支援完整的分頁處理和檔案列表功能。

## 預設設定

- **預設資料夾 ID**: `1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo`
- **分頁大小**: 100 個檔案（可調整）
- **排序方式**: 按檔案名稱排序

## API 端點

### 1. 共用雲端硬碟專用端點

```
GET /api/drive/shared-drive
```

#### 查詢參數

| 參數 | 類型 | 說明 | 預設值 |
|------|------|------|--------|
| `folderId` | string | 指定資料夾 ID | 預設資料夾 ID |
| `pageSize` | number | 每頁檔案數量 | 100 |
| `pageToken` | string | 分頁標記 | 無 |
| `getAll` | boolean | 是否取得所有檔案 | false |

#### 使用範例

**取得所有檔案（支援自動分頁）**
```bash
curl "http://localhost:3000/api/drive/shared-drive?getAll=true"
```

**分頁取得檔案**
```bash
curl "http://localhost:3000/api/drive/shared-drive?pageSize=50"
```

**指定資料夾並分頁**
```bash
curl "http://localhost:3000/api/drive/shared-drive?folderId=YOUR_FOLDER_ID&pageSize=50"
```

**使用分頁標記**
```bash
curl "http://localhost:3000/api/drive/shared-drive?pageSize=50&pageToken=NEXT_PAGE_TOKEN"
```

### 2. 通用 Drive API 端點

```
GET /api/drive
```

#### 查詢參數

| 參數 | 類型 | 說明 | 預設值 |
|------|------|------|--------|
| `folderId` | string | 指定資料夾 ID | 無 |
| `pageSize` | number | 每頁檔案數量 | 100 |
| `getAll` | boolean | 是否取得所有檔案 | false |
| `query` | string | 搜尋查詢 | 無 |
| `orderBy` | string | 排序方式 | 'name' |

## 回應格式

### 成功回應

**取得所有檔案**
```json
{
  "success": true,
  "count": 1250,
  "files": [
    {
      "id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "name": "example.pdf",
      "mimeType": "application/pdf",
      "createdTime": "2024-01-01T00:00:00.000Z",
      "modifiedTime": "2024-01-02T00:00:00.000Z",
      "size": "2.5 MB",
      "webViewLink": "https://drive.google.com/file/d/...",
      "parents": ["1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo"]
    }
  ]
}
```

**分頁回應**
```json
{
  "success": true,
  "count": 100,
  "hasMore": true,
  "nextPageToken": "nextPageToken123",
  "defaultFolderId": "1oSnhZQns9CyOzSomjXwm6hZNufCSFfpo",
  "files": [...]
}
```

### 錯誤回應

```json
{
  "success": false,
  "error": "錯誤描述",
  "details": "詳細錯誤資訊"
}
```

## 分頁處理

### 自動分頁（推薦）

使用 `getAll=true` 參數可以自動處理分頁，API 會自動遍歷所有頁面並返回完整的檔案列表。

```bash
curl "http://localhost:3000/api/drive/shared-drive?getAll=true"
```

### 手動分頁

1. **第一頁請求**
   ```bash
   curl "http://localhost:3000/api/drive/shared-drive?pageSize=100"
   ```

2. **檢查是否有更多頁面**
   - 如果 `hasMore: true`，則有更多檔案
   - 使用 `nextPageToken` 取得下一頁

3. **下一頁請求**
   ```bash
   curl "http://localhost:3000/api/drive/shared-drive?pageSize=100&pageToken=NEXT_PAGE_TOKEN"
   ```

4. **重複步驟 2-3 直到 `hasMore: false`**

## 檔案篩選

### 按資料夾篩選

```bash
# 指定資料夾
curl "http://localhost:3000/api/drive/shared-drive?folderId=YOUR_FOLDER_ID"

# 使用預設資料夾
curl "http://localhost:3000/api/drive/shared-drive"
```

### 按檔案類型篩選

```bash
# 搜尋文件
curl "http://localhost:3000/api/drive/search?q=報告&type=document"

# 搜尋圖片
curl "http://localhost:3000/api/drive/search?q=照片&type=image"
```

## 效能考量

### 檔案數量限制

- **單次請求**: 最多 1000 個檔案
- **自動分頁**: 最多 10,000 個檔案（防止無限迴圈）
- **建議**: 對於大型資料夾，使用分頁方式而非一次取得所有檔案

### 記憶體使用

- **自動分頁**: 會將所有檔案載入記憶體
- **手動分頁**: 只載入當前頁面的檔案
- **建議**: 對於超過 1000 個檔案的資料夾，使用手動分頁

## 錯誤處理

### 常見錯誤碼

| 狀態碼 | 錯誤類型 | 解決方案 |
|--------|----------|----------|
| 400 | 請求參數錯誤 | 檢查 API 參數格式 |
| 401 | 認證失敗 | 檢查服務帳戶金鑰 |
| 403 | 權限不足 | 確認共用雲端硬碟存取權限 |
| 404 | 資料夾不存在 | 檢查資料夾 ID 是否正確 |
| 500 | 內部錯誤 | 檢查環境變數和服務狀態 |
| 503 | 服務不可用 | 檢查 Google Drive API 狀態 |

### 權限檢查

確保服務帳戶具有以下權限：

1. **Google Drive API 已啟用**
2. **服務帳戶已加入共用雲端硬碟成員**
3. **環境變數 `GOOGLE_SERVICE_ACCOUNT_KEY` 已設定**

## 測試範例

### 基本測試

```bash
# 健康檢查
curl -X HEAD http://localhost:3000/api/drive/shared-drive

# 取得預設資料夾的前 10 個檔案
curl "http://localhost:3000/api/drive/shared-drive?pageSize=10"

# 取得所有檔案
curl "http://localhost:3000/api/drive/shared-drive?getAll=true"
```

### 進階測試

```bash
# 指定資料夾並分頁
curl "http://localhost:3000/api/drive/shared-drive?folderId=YOUR_FOLDER_ID&pageSize=50"

# 使用分頁標記
curl "http://localhost:3000/api/drive/shared-drive?pageSize=50&pageToken=YOUR_PAGE_TOKEN"
```

## 注意事項

1. **服務帳戶權限**: 確保服務帳戶已被加入共用雲端硬碟成員
2. **API 配額**: 注意 Google Drive API 的使用配額限制
3. **檔案數量**: 對於大型資料夾，建議使用分頁方式
4. **錯誤處理**: 實作適當的錯誤處理和重試機制
5. **快取策略**: 考慮實作快取以減少 API 呼叫次數

## 支援

如有問題，請檢查：

1. 環境變數設定
2. 服務帳戶權限
3. Google Drive API 狀態
4. 網路連線
5. 伺服器日誌
