# Google Drive 風格檔案總管

## 功能概述

這是一個完全模仿 Google Drive 風格的檔案管理系統，提供現代化的用戶體驗和完整的檔案操作功能。

## 🎯 核心功能

### 1. Google Drive 風格的前端路由
- **URL 參數路由**：`/dashboard/file-explorer?folder={folderId}`
- **麵包屑導航**：支援點擊返回任意層級
- **瀏覽器歷史**：支援前進/後退按鈕
- **深層連結**：可直接分享特定資料夾連結

### 2. Google Drive 風格的檔案預覽和 UI
- **現代化設計**：使用 Tailwind CSS 實現 Google Drive 風格
- **響應式佈局**：支援各種螢幕尺寸
- **雙檢視模式**：網格檢視和列表檢視
- **檔案選擇**：支援多檔案選擇和批量操作
- **懸停效果**：優雅的動畫和交互效果

### 3. 檔案操作功能
- **檔案瀏覽**：支援資料夾導航和檔案列表
- **搜尋功能**：快速搜尋檔案
- **檔案預覽**：整合預覽 API 支援多種檔案類型
- **下載功能**：支援 Google Drive 原生下載
- **批量操作**：選擇、下載、分享、刪除

## 🏗️ 技術架構

### 前端組件
```
app/dashboard/file-explorer/
├── page.tsx              # 主要檔案總管頁面
├── layout.tsx            # 頁面佈局
└── components/           # 可選的組件目錄
```

### 後端 API
```
app/api/drive/
├── route.ts              # 主要檔案列表 API
├── [fileId]/route.ts     # 檔案詳情 API
├── preview/[fileId]/     # 檔案預覽 API
└── search/route.ts       # 搜尋 API
```

### 核心功能模組
- **路由管理**：Next.js App Router + URL 參數
- **狀態管理**：React Hooks + 本地狀態
- **API 整合**：Fetch API + 錯誤處理
- **權限控制**：RestrictedCard 組件

## 🎨 UI/UX 特色

### 1. 頂部導航欄
- **Logo 和標題**：檔案總管品牌識別
- **麵包屑導航**：清晰的層級路徑
- **操作按鈕**：上傳、新建等快捷操作
- **粘性定位**：滾動時保持可見

### 2. 搜尋和工具欄
- **搜尋框**：帶圖示的搜尋輸入
- **檢視模式**：網格/列表切換
- **重新整理**：載入最新檔案
- **響應式設計**：適配各種螢幕

### 3. 檔案列表
- **選擇工具**：全選/取消全選
- **批量操作**：下載、分享、刪除
- **檔案項目**：圖示、名稱、類型、大小、日期
- **懸停效果**：預覽、下載、更多操作按鈕

### 4. 檔案預覽模態框
- **檔案資訊**：名稱、類型、大小
- **操作按鈕**：下載、關閉
- **預覽內容**：根據檔案類型顯示
- **響應式設計**：適配各種螢幕尺寸

## 🔧 使用方法

### 1. 基本導航
```typescript
// 進入資料夾
const enterFolder = (folderId: string, folderName: string) => {
  setCurrentFolder(folderId)
  setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }])
  
  // 更新 URL
  const newUrl = `/dashboard/file-explorer?folder=${folderId}`
  router.push(newUrl)
  
  loadFiles(folderId)
}
```

### 2. URL 參數處理
```typescript
// 從 URL 參數初始化狀態
useEffect(() => {
  const folderId = searchParams.get('folder')
  if (folderId && folderId !== currentFolder) {
    setCurrentFolder(folderId)
    loadFiles(folderId)
  }
}, [searchParams])
```

### 3. 檔案預覽
```typescript
// 預覽檔案
const handlePreviewFile = async (file: DriveFile) => {
  try {
    const response = await fetch(`/api/drive/preview/${file.id}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        setPreviewFile(data.file)
        setShowPreview(true)
      }
    }
  } catch (error) {
    console.error('預覽檔案失敗:', error)
  }
}
```

## 📱 響應式設計

### 斷點設定
- **sm**: 640px - 小螢幕
- **md**: 768px - 中等螢幕
- **lg**: 1024px - 大螢幕
- **xl**: 1280px - 超大螢幕

### 佈局適配
```typescript
// 網格檢視響應式
<div className={cn(
  viewMode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
    : 'space-y-1'
)}>
```

## 🎭 動畫和過渡效果

### 1. 懸停效果
```typescript
className={cn(
  'group relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer',
  selectedFiles.has(file.id) && 'ring-2 ring-blue-500 bg-blue-50'
)}
```

### 2. 按鈕顯示/隱藏
```typescript
className={cn(
  'flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity',
  viewMode === 'list' && 'flex-shrink-0 mt-0'
)}
```

### 3. 載入動畫
```typescript
<RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
```

## 🔒 權限和安全

### 1. 權限檢查
```typescript
const hasPermission = (allowedRoles: string[]) => {
  if (!user?.role?.name) return false
  return allowedRoles.includes(user.role.name)
}
```

### 2. 允許的角色
```typescript
allowedRoles: ["admin", "root", "class-teacher", "manager"]
```

### 3. 權限控制
```typescript
if (!hasPermission(['admin', 'root', 'class-teacher', 'manager'])) {
  return <RestrictedCard>...</RestrictedCard>
}
```

## 🚀 性能優化

### 1. 狀態管理
- 使用 `useState` 管理本地狀態
- 避免不必要的重新渲染
- 優化檔案列表更新

### 2. API 調用
- 異步載入檔案
- 錯誤處理和重試機制
- 載入狀態指示器

### 3. 記憶化
- 檔案圖示和類型標籤快取
- 避免重複計算

## 🔮 未來擴展

### 1. 進階功能
- **拖拽上傳**：支援拖拽檔案上傳
- **檔案分享**：生成分享連結
- **版本控制**：檔案版本管理
- **協作編輯**：多人同時編輯

### 2. 性能提升
- **虛擬滾動**：處理大量檔案
- **圖片縮圖**：快速載入縮圖
- **離線支援**：PWA 功能

### 3. 用戶體驗
- **鍵盤快捷鍵**：支援鍵盤操作
- **手勢支援**：觸控設備優化
- **主題切換**：深色/淺色模式

## 🐛 故障排除

### 常見問題

**Q: 檔案預覽無法開啟**
A: 檢查檔案預覽 API 是否正常，確認檔案有 `webViewLink` 屬性

**Q: 路由不正確**
A: 檢查 Next.js 配置，確認 App Router 設定正確

**Q: 權限錯誤**
A: 確認用戶角色包含在 `allowedRoles` 中

### 調試技巧
- 檢查瀏覽器開發者工具
- 查看網路請求狀態
- 確認 API 端點正常
- 檢查環境變數設定

## 📚 相關資源

- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Drive API](https://developers.google.com/drive/api)
- [React Hooks](https://react.dev/reference/react/hooks)

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支
3. 提交變更
4. 發起 Pull Request

---

這個檔案總管系統完全模仿了 Google Drive 的設計理念和用戶體驗，提供了現代化、響應式的檔案管理解決方案。
