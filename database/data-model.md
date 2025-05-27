# 學伴資料管理系統資料模型

本文件定義了學伴資料管理系統的資料模型以及實體關係。

## 資料模型定義

### User (用戶)

用於存儲系統管理員與教師資訊的表格。

```json
{
  "id": "UUID DEFAULT gen_random_uuid() UNIQUE",          // 唯一識別符
  "email": "VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE",      // 電子郵件，用於登入
  "name": "VARCHAR(255)",               // 用戶姓名
  "role": "VARCHAR(50) NOT NULL", // 用戶角色：teacher, admin, project_manager, student 等
  "avatar_url": "TEXT", // 頭貼超連結
  "region": "VARCHAR(255)", // 負責的管理區域
  "created_at": "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP", // 創建時間
  "updated_at": "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP",  // 更新時間
  "last_active": "TIMESTAMP WITH TIME ZONE"  // 最後活動時間
}
```

### Student (學伴)

用於存儲學伴資料的表格。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",          // 唯一識別符
  "name": "VARCHAR(255) NOT NULL",               // 學伴姓名
  "gender": "VARCHAR(10) NOT NULL",    // 性別
  "grade": "VARCHAR(10) NOT NULL",       // 年級
  "class": "VARCHAR(50) NOT NULL",              // 班級
  "email": "VARCHAR(255) UNIQUE",      // 電子郵件
  "region": "VARCHAR(255)",      // 地區
  "student_type": "VARCHAR(10) NOT NULL", // 學伴類型
  "is_disadvantaged": "VARCHAR(10) NOT NULL", // 是否為弱勢生
  "family_background": "TEXT",  // 家庭背景描述
  "cultural_disadvantage_factors": "TEXT", // 文化不利因素描述
  "personal_background_notes": "TEXT",     // 個人背景補充說明
  "registration_motivation": "TEXT",       // 報名動機
  "additional_info": "JSONB DEFAULT '{}'::jsonb",               // 額外資訊 (JSON格式)
  "account_username": "VARCHAR(255)",
  "account_password": "VARCHAR(255)",
  "created_at": "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP",        // 創建時間
  "updated_at": "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP"         // 更新時間
}
```

### Forms (表單)

用於存儲表單定義的表格。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
  "title": "VARCHAR(255) NOT NULL",                    // 表單標題
  "description": "TEXT",                               // 表單描述
  "form_type": "VARCHAR(50) NOT NULL",                 // 表單類型：registration, profile, survey 等
  "target_role": "VARCHAR(50) NOT NULL",               // 目標角色
  "status": "VARCHAR(20) DEFAULT 'draft'",             // 狀態：draft, active, inactive, archived
  "is_required": "BOOLEAN DEFAULT false",              // 是否必填
  "allow_multiple_submissions": "BOOLEAN DEFAULT false", // 是否允許多次提交
  "submission_deadline": "TIMESTAMP WITH TIME ZONE",   // 提交截止時間
  "created_by": "UUID REFERENCES users(id)",           // 創建者
  "created_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  "updated_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
}
```

### FormFields (表單欄位)

用於存儲表單欄位定義的表格。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
  "form_id": "UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE",
  "field_name": "VARCHAR(100) NOT NULL",               // 欄位名稱
  "field_label": "VARCHAR(255) NOT NULL",              // 欄位標籤
  "field_type": "VARCHAR(50) NOT NULL",                // 欄位類型：text, textarea, radio, checkbox, select, email 等
  "display_order": "INTEGER NOT NULL DEFAULT 0",      // 顯示順序
  "is_required": "BOOLEAN DEFAULT false",              // 是否必填
  "is_active": "BOOLEAN DEFAULT true",                 // 是否啟用
  "placeholder": "TEXT",                               // 佔位符文字
  "help_text": "TEXT",                                 // 幫助文字
  "validation_rules": "JSONB",                         // 驗證規則
  "conditional_logic": "JSONB",                        // 條件顯示邏輯
  "default_value": "TEXT",                             // 預設值
  "min_length": "INTEGER",                             // 最小長度
  "max_length": "INTEGER",                             // 最大長度
  "pattern": "VARCHAR(255)",                           // 正規表達式驗證
  "student_field_mapping": "VARCHAR(100)",             // 對應到 students 表格的欄位名稱
  "auto_populate_from": "VARCHAR(100)",                // 自動從其他欄位填入
  "created_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  "updated_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  "UNIQUE(form_id, field_name)"                        // 確保同一表單內欄位名稱唯一
}
```

### FormFieldOptions (表單欄位選項)

用於存儲選項型欄位的選項定義。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
  "field_id": "UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE",
  "option_value": "VARCHAR(255) NOT NULL",             // 選項值
  "option_label": "VARCHAR(255) NOT NULL",             // 選項標籤
  "display_order": "INTEGER NOT NULL DEFAULT 0",      // 顯示順序
  "is_active": "BOOLEAN DEFAULT true",                 // 是否啟用
  "created_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  "UNIQUE(field_id, option_value)"                     // 確保同一欄位內選項值唯一
}
```

### FormResponses (表單回應)

用於存儲表單回應主表。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
  "form_id": "UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE",
  "respondent_id": "UUID",                             // 回應者 ID（可以是 users.id 或 students.id）
  "respondent_type": "VARCHAR(20) NOT NULL",           // 回應者類型：user, student, anonymous
  "submission_status": "VARCHAR(20) DEFAULT 'draft'",  // 提交狀態：draft, submitted, reviewed, approved, rejected
  "submitted_at": "TIMESTAMP WITH TIME ZONE",          // 提交時間
  "reviewed_at": "TIMESTAMP WITH TIME ZONE",           // 審核時間
  "reviewed_by": "UUID REFERENCES users(id)",          // 審核者
  "review_notes": "TEXT",                              // 審核備註
  "metadata": "JSONB",                                 // 額外的元資料
  "created_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  "updated_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
}
```

### FormFieldResponses (表單欄位回應)

用於存儲表單欄位的具體回應內容。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
  "response_id": "UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE",
  "field_id": "UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE",
  "field_value": "TEXT",                               // 單一值（text, radio, select 等）
  "field_values": "JSONB",                             // 多值（checkbox, 複雜資料等）
  "created_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  "updated_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  "UNIQUE(response_id, field_id)"                      // 確保同一回應內每個欄位只有一筆記錄
}
```

### UserFormAccess (使用者表單存取權限)

用於控制使用者對表單的存取權限。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
  "form_id": "UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE",
  "user_id": "UUID REFERENCES users(id) ON DELETE CASCADE",
  "role": "VARCHAR(50)",                               // 當指定角色時，該角色的所有使用者都可存取
  "access_type": "VARCHAR(20) DEFAULT 'read'",         // 存取類型：read, edit
  "granted_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  "granted_by": "UUID REFERENCES users(id)",
  "expires_at": "TIMESTAMP WITH TIME ZONE",
  "is_active": "BOOLEAN DEFAULT true",
  "UNIQUE(form_id, user_id)",                          // 確保不會有重複的權限記錄
  "UNIQUE(form_id, role)",
  "CHECK ((user_id IS NOT NULL AND role IS NULL) OR (user_id IS NULL AND role IS NOT NULL))", // 確保 user_id 和 role 至少有一個不為空
  "CHECK (access_type IN ('read', 'edit'))"            // 確保 access_type 只能是 'read' 或 'edit'
}
```

### FormTemplates (表單模板)

用於存儲表單模板的表格。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
  "name": "VARCHAR(255) NOT NULL",                     // 模板名稱
  "description": "TEXT",                               // 模板描述
  "template_data": "JSONB NOT NULL",                   // 儲存完整的表單結構
  "category": "VARCHAR(100)",                          // 模板分類：registration, profile, survey 等
  "is_system_template": "BOOLEAN DEFAULT false",       // 是否為系統內建模板
  "created_by": "UUID REFERENCES users(id)",
  "created_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  "updated_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
}
```

### TeacherStudentAccess (教師-學伴權限關聯)

用於建立教師與學伴之間的存取權限關係的表格。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",             // 唯一識別符
  "teacher_id": "UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE",     // 參照 User 表的教師 ID
  "student_id": "UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE",     // 參照 Student 表的學伴 ID
  "created_at": "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP", // 創建時間
  "UNIQUE(teacher_id, student_id)" // 確保每個教師-學伴組合只會出現一次
}
```

## 關係說明

### 表單系統關係

1. **Forms 和 FormFields 之間一對多關係**
   - 一個表單可以有多個欄位
   - 每個欄位只能屬於一個表單

2. **FormFields 和 FormFieldOptions 之間一對多關係**
   - 一個欄位可以有多個選項（適用於 radio, checkbox, select 等類型）
   - 每個選項只能屬於一個欄位

3. **Forms 和 FormResponses 之間一對多關係**
   - 一個表單可以有多個回應
   - 每個回應只能屬於一個表單

4. **FormResponses 和 FormFieldResponses 之間一對多關係**
   - 一個表單回應可以包含多個欄位回應
   - 每個欄位回應只能屬於一個表單回應

5. **FormFields 和 FormFieldResponses 之間一對多關係**
   - 一個欄位可以有多個回應（來自不同的表單提交）
   - 每個欄位回應只能對應一個欄位

6. **Forms 和 UserFormAccess 之間一對多關係**
   - 一個表單可以有多個存取權限設定
   - 每個權限設定只能屬於一個表單

### 原有系統關係

1. **User 和 Student 之間多對多關係**
   - 一個教師可以查看多個學伴的資料
   - 一個學伴的資料可以被多個教師查看
   - 這種多對多關係通過 `TeacherStudentAccess` 表實現

2. **User 和 TeacherStudentAccess 之間一對多關係**
   - 一個教師可以有多個與學伴的存取權限關聯
   - 每個關聯只能屬於一個教師

3. **Student 和 TeacherStudentAccess 之間一對多關係**
   - 一個學伴可以有多個與教師的存取權限關聯
   - 每個關聯只能屬於一個學伴

## 權限控制邏輯

### 表單系統權限

1. **系統管理員** (`role = 'admin'`) 擁有以下權限：
   - 創建、編輯、刪除所有表單
   - 查看所有表單回應
   - 管理表單存取權限
   - 審核表單回應

2. **計畫主持** (`role = 'project_manager'`) 擁有以下權限：
   - 創建、編輯表單
   - 查看所有表單回應
   - 管理表單存取權限
   - 審核表單回應

3. **學伴** (`role = 'student'`) 擁有以下權限：
   - 填寫被授權的表單
   - 查看和編輯自己的表單回應
   - 查看自己的個人資料

4. **教師** (`role = 'teacher'`) 擁有以下權限：
   - 查看被授權的表單回應
   - 查看被授權的學伴資料

### 原有系統權限

1. 管理員 (`role = 'admin'` 或 `role = 'root'`) 擁有以下權限：
   - 查看、新增、編輯和刪除所有學伴資料
   - 管理用戶（教師和管理員）
   - 分配教師對學伴的查看權限

2. 教師 (`role = 'teacher'`) 擁有以下權限：
   - 僅能查看被授權的學伴資料（透過 TeacherStudentAccess 表關聯）
   - 不能新增或刪除學伴資料
   - 不能管理用戶或權限

## 資料儲存考量

1. 學伴的額外資訊使用 JSONB 類型儲存，可以靈活存放不同類型的附加資訊
2. 表單的驗證規則、條件邏輯和模板資料使用 JSONB 類型儲存，提供靈活性
3. 所有時間欄位使用帶時區的時間戳記 (TIMESTAMP WITH TIME ZONE)
4. 所有 ID 欄位使用 UUID 類型，提高安全性並避免序列暴露
5. 使用適當的約束條件確保資料完整性
6. 使用索引提高查詢效能，特別是在經常查詢的欄位上
7. 使用觸發器自動更新 updated_at 欄位

## API 端點設計

### 表單管理 API

- `POST /api/forms/` - 創建新表單
- `GET /api/forms/[id]` - 取得特定表單詳情
- `PUT /api/forms/[id]` - 更新表單
- `DELETE /api/forms/[id]` - 刪除表單
- `GET /api/forms/` - 取得表單列表

### 表單回應 API

- `POST /api/form-responses/` - 創建新的表單回應
- `PUT /api/form-responses/[id]` - 更新表單回應
- `GET /api/form-responses/[id]` - 取得特定表單回應
- `DELETE /api/form-responses/[id]` - 刪除表單回應

### 表單模板 API

- `GET /api/form-templates/` - 取得表單模板列表
- `POST /api/form-templates/` - 創建新模板
- `GET /api/form-templates/[id]` - 取得特定模板 