-- SQL seed file for students management system

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
  last_active TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  grade CHAR(1) NOT NULL,
  class VARCHAR(10) NOT NULL,
  family_background TEXT,
  is_disadvantaged CHAR(1) NOT NULL,
  cultural_disadvantage_factors TEXT,
  personal_background_notes TEXT,
  registration_motivation TEXT,
  student_type VARCHAR(10) NOT NULL,
  account_username VARCHAR(50) NOT NULL UNIQUE,
  account_password VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_student_access (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Insert users data
INSERT INTO users (email, name, role, created_at, updated_at) VALUES
('admin@example.com', '管理員', 'admin', '2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z'),
('teacher1@example.com', '王老師', 'teacher', '2023-01-02T00:00:00Z', '2023-01-02T00:00:00Z'),
('teacher2@example.com', '李老師', 'teacher', '2023-01-03T00:00:00Z', '2023-01-03T00:00:00Z'),
('teacher3@example.com', '張老師', 'teacher', '2023-01-04T00:00:00Z', '2023-01-04T00:00:00Z'),
('teacher4@example.com', '陳老師', 'teacher', '2023-01-05T00:00:00Z', '2023-01-05T00:00:00Z'),
('teacher5@example.com', '林老師', 'teacher', '2023-01-06T00:00:00Z', '2023-01-06T00:00:00Z');

-- Insert students data
INSERT INTO students (name, gender, grade, class, family_background, is_disadvantaged, cultural_disadvantage_factors, personal_background_notes, registration_motivation, student_type, account_username, account_password, email, created_at, updated_at) VALUES
('王小明', '男', '2', '1', '雙親家庭，父母皆為上班族', '否', '無', '對程式設計有濃厚興趣', '希望能透過課程提升自己的專業能力', '新生', 'wangxm', 'pass1234', 'student1@example.com', '2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z'),
('李小華', '女', '1', '2', '單親家庭，與母親同住', '是', '經濟弱勢', '積極向上，課餘時間打工貼補家用', '希望能增加就業競爭力', '新生', 'lixh', 'pass5678', 'student2@example.com', '2023-01-02T00:00:00Z', '2023-01-02T00:00:00Z'),
('張小芳', '女', '3', '3', '雙親家庭，家中經營小型企業', '否', '無', '擅長人際溝通，有領導能力', '想學習更多商業與技術結合的知識', '舊生', 'zhangxf', 'zhang123', 'student3@example.com', '2023-01-03T00:00:00Z', '2023-01-03T00:00:00Z'),
('陳小強', '男', '4', '4', '雙親家庭，父親為工程師', '否', '無', '已有多個專案開發經驗', '為畢業後就業做準備', '舊生', 'chenxq', 'chen456', 'student4@example.com', '2023-01-04T00:00:00Z', '2023-01-04T00:00:00Z'),
('林小美', '女', '2', '5', '雙親家庭，家住偏遠地區', '是', '居住偏遠地區', '喜歡數學與物理', '想增強電腦專業技能', '舊生', 'linxm', 'lin789', 'student5@example.com', '2023-01-05T00:00:00Z', '2023-01-05T00:00:00Z'),
('黃小剛', '男', '1', '6', '雙親家庭，父母皆為教師', '否', '無', '對商業分析有興趣', '希望能學習數據分析技能', '新生', 'huangxg', 'huang123', 'student6@example.com', '2023-01-06T00:00:00Z', '2023-01-06T00:00:00Z'),
('劉小芬', '女', '3', '1', '單親家庭，與父親同住', '否', '無', '熱愛程式開發', '想深入學習軟體工程實踐', '舊生', 'liuxf', 'liu456', 'student7@example.com', '2023-01-07T00:00:00Z', '2023-01-07T00:00:00Z'),
('吳小傑', '男', '4', '2', '隔代教養，與祖父母同住', '是', '隔代教養', '自學能力強', '為研究所考試做準備', '舊生', 'wuxj', 'wu789', 'student8@example.com', '2023-01-08T00:00:00Z', '2023-01-08T00:00:00Z'),
('楊小雯', '女', '2', '3', '雙親家庭，家中有三個小孩', '是', '經濟弱勢', '擅長組織活動', '想學習專案管理知識', '舊生', 'yangxw', 'yang123', 'student9@example.com', '2023-01-09T00:00:00Z', '2023-01-09T00:00:00Z'),
('趙小龍', '男', '1', '4', '雙親家庭，父母為小商家老闆', '否', '無', '對人工智能特別感興趣', '希望能參與研究項目', '新生', 'zhaoxl', 'zhao456', 'student10@example.com', '2023-01-10T00:00:00Z', '2023-01-10T00:00:00Z'),
('孫小梅', '女', '3', '5', '雙親家庭，家住原住民部落', '是', '原住民身份', '熱愛文化傳承', '希望將科技帶回部落幫助社區', '舊生', 'sunxm', 'sun789', 'student11@example.com', '2023-01-11T00:00:00Z', '2023-01-11T00:00:00Z'),
('周小倫', '男', '4', '6', '單親家庭，母親為公務員', '否', '無', '曾獲多次程式競賽獎項', '為就業做最後準備', '舊生', 'zhouxl', 'zhou123', 'student12@example.com', '2023-01-12T00:00:00Z', '2023-01-12T00:00:00Z'),
('胡小玲', '女', '2', '1', '雙親家庭，家中有四個小孩', '是', '經濟弱勢', '課餘時間在圖書館打工', '希望能學習新技術提升自我', '舊生', 'huxl', 'hu456', 'student13@example.com', '2023-01-13T00:00:00Z', '2023-01-13T00:00:00Z'),
('郭小雄', '男', '1', '2', '雙親家庭，父母為醫生', '否', '無', '擅長理論研究', '希望探索電機與計算機交叉領域', '新生', 'guoxx', 'guo789', 'student14@example.com', '2023-01-14T00:00:00Z', '2023-01-14T00:00:00Z'),
('鄭小婷', '女', '3', '3', '雙親家庭，家中經營農場', '是', '農村地區', '對數據科學有強烈興趣', '希望能將數據分析應用於農業', '舊生', 'zhengxt', 'zheng123', 'student15@example.com', '2023-01-15T00:00:00Z', '2023-01-15T00:00:00Z'),
('何小偉', '男', '4', '4', '雙親家庭，父親為工程師', '否', '無', '已有兩份實習經驗', '希望能強化履歷', '舊生', 'hexw', 'he456', 'student16@example.com', '2023-01-16T00:00:00Z', '2023-01-16T00:00:00Z'),
('馬小琳', '女', '2', '5', '新住民家庭，母親來自越南', '是', '新住民家庭', '語言能力強，會三種語言', '希望能提升專業技能', '舊生', 'maxl', 'ma789', 'student17@example.com', '2023-01-17T00:00:00Z', '2023-01-17T00:00:00Z'),
('蕭小宏', '男', '1', '6', '雙親家庭，父親為教授', '否', '無', '對商業分析有強烈興趣', '希望能提早接觸專業知識', '新生', 'xiaoxh', 'xiao123', 'student18@example.com', '2023-01-18T00:00:00Z', '2023-01-18T00:00:00Z'),
('朱小瑜', '女', '3', '1', '雙親家庭，家中經營小餐館', '否', '無', '參與過多個開源項目', '希望能深入理解軟體開發流程', '舊生', 'zhuxy', 'zhu456', 'student19@example.com', '2023-01-19T00:00:00Z', '2023-01-19T00:00:00Z'),
('唐小鈞', '男', '4', '2', '單親家庭，父親早逝', '是', '經濟弱勢', '堅強自立，課餘做家教', '希望能增強就業競爭力', '舊生', 'tangxj', 'tang789', 'student20@example.com', '2023-01-20T00:00:00Z', '2023-01-20T00:00:00Z'),
('宋小萱', '女', '2', '3', '隔代教養，與祖母同住', '是', '隔代教養', '性格獨立，自主學習能力強', '希望能提升專業能力', '舊生', 'songxx', 'song123', 'student21@example.com', '2023-01-21T00:00:00Z', '2023-01-21T00:00:00Z'),
('高小峰', '男', '1', '4', '雙親家庭，父母為企業主管', '否', '無', '從高中開始自學程式設計', '希望能系統性學習計算機科學', '新生', 'gaoxf', 'gao456', 'student22@example.com', '2023-01-22T00:00:00Z', '2023-01-22T00:00:00Z'),
('盧小琪', '女', '3', '5', '雙親家庭，家住離島', '是', '離島地區', '對電路設計特別有興趣', '希望能拓展知識面', '舊生', 'luxq', 'lu789', 'student23@example.com', '2023-01-23T00:00:00Z', '2023-01-23T00:00:00Z'),
('曾小豪', '男', '4', '6', '雙親家庭，父母皆為教師', '否', '無', '曾獲創業比賽獎項', '希望能將所學應用於創業', '舊生', 'zengxh', 'zeng123', 'student24@example.com', '2023-01-24T00:00:00Z', '2023-01-24T00:00:00Z'),
('方小儀', '女', '2', '1', '單親家庭，與母親同住', '是', '經濟弱勢', '喜歡解決問題，善於邏輯思考', '希望能學習更多前沿技術', '舊生', 'fangxy', 'fang456', 'student25@example.com', '2023-01-25T00:00:00Z', '2023-01-25T00:00:00Z');

-- Insert teacher-student access data - use subqueries to get the IDs
INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher1@example.com'),
  (SELECT id FROM students WHERE email = 'student1@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher2@example.com'),
  (SELECT id FROM students WHERE email = 'student1@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher3@example.com'),
  (SELECT id FROM students WHERE email = 'student2@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher4@example.com'),
  (SELECT id FROM students WHERE email = 'student2@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher5@example.com'),
  (SELECT id FROM students WHERE email = 'student2@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher1@example.com'),
  (SELECT id FROM students WHERE email = 'student3@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher2@example.com'),
  (SELECT id FROM students WHERE email = 'student4@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher3@example.com'),
  (SELECT id FROM students WHERE email = 'student4@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher4@example.com'),
  (SELECT id FROM students WHERE email = 'student5@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher1@example.com'),
  (SELECT id FROM students WHERE email = 'student6@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher2@example.com'),
  (SELECT id FROM students WHERE email = 'student6@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher3@example.com'),
  (SELECT id FROM students WHERE email = 'student7@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher4@example.com'),
  (SELECT id FROM students WHERE email = 'student8@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher5@example.com'),
  (SELECT id FROM students WHERE email = 'student8@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher1@example.com'),
  (SELECT id FROM students WHERE email = 'student9@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher2@example.com'),
  (SELECT id FROM students WHERE email = 'student10@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher3@example.com'),
  (SELECT id FROM students WHERE email = 'student10@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher4@example.com'),
  (SELECT id FROM students WHERE email = 'student11@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher5@example.com'),
  (SELECT id FROM students WHERE email = 'student11@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher1@example.com'),
  (SELECT id FROM students WHERE email = 'student12@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher2@example.com'),
  (SELECT id FROM students WHERE email = 'student13@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher3@example.com'),
  (SELECT id FROM students WHERE email = 'student13@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher4@example.com'),
  (SELECT id FROM students WHERE email = 'student14@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher1@example.com'),
  (SELECT id FROM students WHERE email = 'student15@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher2@example.com'),
  (SELECT id FROM students WHERE email = 'student15@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher3@example.com'),
  (SELECT id FROM students WHERE email = 'student16@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher4@example.com'),
  (SELECT id FROM students WHERE email = 'student16@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher5@example.com'),
  (SELECT id FROM students WHERE email = 'student16@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher1@example.com'),
  (SELECT id FROM students WHERE email = 'student17@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher2@example.com'),
  (SELECT id FROM students WHERE email = 'student18@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher3@example.com'),
  (SELECT id FROM students WHERE email = 'student18@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher4@example.com'),
  (SELECT id FROM students WHERE email = 'student19@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher5@example.com'),
  (SELECT id FROM students WHERE email = 'student19@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher1@example.com'),
  (SELECT id FROM students WHERE email = 'student20@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher2@example.com'),
  (SELECT id FROM students WHERE email = 'student21@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher3@example.com'),
  (SELECT id FROM students WHERE email = 'student21@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher4@example.com'),
  (SELECT id FROM students WHERE email = 'student22@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher5@example.com'),
  (SELECT id FROM students WHERE email = 'student22@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher1@example.com'),
  (SELECT id FROM students WHERE email = 'student23@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher2@example.com'),
  (SELECT id FROM students WHERE email = 'student24@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher3@example.com'),
  (SELECT id FROM students WHERE email = 'student24@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher4@example.com'),
  (SELECT id FROM students WHERE email = 'student25@example.com'),
  '2023-01-01T00:00:00Z';

INSERT INTO teacher_student_access (teacher_id, student_id, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'teacher5@example.com'),
  (SELECT id FROM students WHERE email = 'student25@example.com'),
  '2023-01-01T00:00:00Z'; 