export interface Student { 
    id: string;
    name: string; // 姓名
    gender: string; // 性別
    grade: '1' | '2' | '3' | '4' | '5' | '6'; // 年級
    class: string; // 班級 (1-6)
    region: string; // 區域
    family_background: string; // 家庭背景
    is_disadvantaged: '是' | '否'; // 是否弱勢生
    cultural_disadvantage_factors: string; // 文化不利因素
    personal_background_notes: string; // 個人背景補充
    registration_motivation: string; // 報名動機
    student_type: '新生' | '舊生'; // 新舊生：新生/舊生
    account_username: string; // 後台帳號
    account_password: string; // 後台密碼
    email: string; // 常用電子信箱
    created_at: string;
    updated_at: string;
};

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    updated_at: string;
};
  
export type StudentFilePreview = Omit<Omit<Omit<Student, 'id'>, 'created_at'>, 'updated_at'>;
