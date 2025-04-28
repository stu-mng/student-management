# 學生資料管理系統資料模型

本文件定義了學生資料管理系統的資料模型以及實體關係。

## 資料模型定義

### User (用戶)

用於存儲系統管理員與教師資訊的表格。

```json
{
  "id": "UUID DEFAULT gen_random_uuid() UNIQUE",          // 唯一識別符
  "email": "VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE",      // 電子郵件，用於登入
  "name": "VARCHAR(255)",               // 用戶姓名
  "role": "VARCHAR(10) NOT NULL CHECK (role IN ('teacher', 'admin', 'root'))", // 用戶角色：教師、管理員或最高管理員
  "avatar_url": "TEXT", // 頭貼超連結
  "created_at": "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP", // 創建時間
  "updated_at": "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP"  // 更新時間
}
```

### Student (學生)

用於存儲學生資料的表格。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",          // 唯一識別符
  "name": "VARCHAR(255) NOT NULL",               // 學生姓名
  "gender": "VARCHAR(4) NOT NULL CHECK (gender IN ('男', '女'))",    // 性別
  "grade": "VARCHAR(10) NOT NULL",       // 年級
  "class": "VARCHAR(10) NOT NULL",              // 班級
  "email": "VARCHAR(255) UNIQUE",      // 電子郵件
  "student_type": "VARCHAR(4) NOT NULL CHECK (student_type IN ('新生', '舊生'))", // 學生類型
  "is_disadvantaged": "VARCHAR(4) NOT NULL CHECK (is_disadvantaged IN ('是', '否'))", // 是否為弱勢生
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

### TeacherStudentAccess (教師-學生權限關聯)

用於建立教師與學生之間的存取權限關係的表格。

```json
{
  "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",             // 唯一識別符
  "teacher_id": "UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE",     // 參照 User 表的教師 ID
  "student_id": "UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE",     // 參照 Student 表的學生 ID
  "created_at": "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP", // 創建時間
  "UNIQUE(teacher_id, student_id)" // 確保每個教師-學生組合只會出現一次
}
```

## 關係說明

1. **User 和 Student 之間多對多關係**
   - 一個教師可以查看多個學生的資料
   - 一個學生的資料可以被多個教師查看
   - 這種多對多關係通過 `TeacherStudentAccess` 表實現

2. **User 和 TeacherStudentAccess 之間一對多關係**
   - 一個教師可以有多個與學生的存取權限關聯
   - 每個關聯只能屬於一個教師

3. **Student 和 TeacherStudentAccess 之間一對多關係**
   - 一個學生可以有多個與教師的存取權限關聯
   - 每個關聯只能屬於一個學生

## 權限控制邏輯

1. 管理員 (`role = 'admin'` 或 `role = 'root'`) 擁有以下權限：
   - 查看、新增、編輯和刪除所有學生資料
   - 管理用戶（教師和管理員）
   - 分配教師對學生的查看權限

2. 教師 (`role = 'teacher'`) 擁有以下權限：
   - 僅能查看被授權的學生資料（透過 TeacherStudentAccess 表關聯）
   - 不能新增或刪除學生資料
   - 不能管理用戶或權限

## 資料儲存考量

1. 學生的額外資訊使用 JSONB 類型儲存，可以靈活存放不同類型的附加資訊
2. 所有時間欄位使用帶時區的時間戳記 (TIMESTAMP WITH TIME ZONE)
3. 所有 ID 欄位使用 UUID 類型，提高安全性並避免序列暴露
4. 學生的弱勢生狀態和學生類型使用字串枚舉限制可能的值
5. 使用索引提高查詢效能，特別是在經常查詢的欄位上
6. 使用觸發器自動更新 updated_at 欄位

## 資料庫結構 SQL

```sql
-- 刪除已存在的用戶表（如果存在）以及所有依賴它的物件
DROP TABLE IF EXISTS "users" CASCADE;

-- 創建用戶表
CREATE TABLE "users" (
  "id" UUID DEFAULT gen_random_uuid() UNIQUE, 
  "email" VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE,
  "name" VARCHAR(255),
  "role" VARCHAR(10) NOT NULL CHECK (role IN ('teacher', 'admin', 'root')),
  "avatar_url" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 刪除已存在的學生表（如果存在）以及所有依賴它的物件
DROP TABLE IF EXISTS "students" CASCADE;

-- 創建學生表
CREATE TABLE "students" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "gender" VARCHAR(4) NOT NULL CHECK (gender IN ('男', '女')),
  "grade" VARCHAR(10) NOT NULL,
  "class" VARCHAR(10) NOT NULL,
  "email" VARCHAR(255) UNIQUE,
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

-- 刪除已存在的教師-學生權限關聯表（如果存在）
DROP TABLE IF EXISTS "teacher_student_access";

-- 創建教師-學生權限關聯表
CREATE TABLE "teacher_student_access" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacher_id" UUID NOT NULL REFERENCES "users" (id) ON DELETE CASCADE,
  "student_id" UUID NOT NULL REFERENCES "students" (id) ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- 確保每個教師-學生組合只會出現一次
  UNIQUE(teacher_id, student_id)
);

-- 創建索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_grade_class ON students(grade, class);
CREATE INDEX IF NOT EXISTS idx_students_student_type ON students(student_type);
CREATE INDEX IF NOT EXISTS idx_students_is_disadvantaged ON students(is_disadvantaged);
CREATE INDEX IF NOT EXISTS idx_teacher_student_access_teacher_id ON teacher_student_access(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_access_student_id ON teacher_student_access(student_id);

-- 刪除已存在的 update_timestamp 函數（如果存在）
DROP FUNCTION IF EXISTS update_timestamp();

-- 創建觸發器以自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除已存在的 update_users_timestamp 觸發器（如果存在）
DROP TRIGGER IF EXISTS update_users_timestamp ON users;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 刪除已存在的 update_students_timestamp 觸發器（如果存在）
DROP TRIGGER IF EXISTS update_students_timestamp ON students;

CREATE TRIGGER update_students_timestamp
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
``` 