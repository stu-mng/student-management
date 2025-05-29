import { createClient } from '@/database/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 假設在線使用者的閾值為15分鐘
const ONLINE_THRESHOLD_MS = 15 * 60 * 1000; // 15分鐘

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 獲取認證的用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 從用戶表中獲取用戶角色
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        role:roles(id, name, order, display_name)
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 檢查用戶是否有權限查看分析數據 (root, admin, manager 可以查看)
    const userRole = (userData.role as any);
    const allowedRoles = ['root', 'admin', 'manager'];
    if (!userRole || !allowedRoles.includes(userRole.name)) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }
    
    // 取得所有用戶的最後活動時間
    const { data: activeUsers, error: activeError } = await supabase
      .from('users')
      .select(`
        id, 
        name, 
        email, 
        updated_at, 
        last_active,
        role:roles(id, name, order, display_name)
      `)
      .order('last_active', { ascending: false });
    
    if (activeError) {
      return NextResponse.json({ error: activeError.message }, { status: 500 });
    }

    // 更新當前用戶的活動時間
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_active: now })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating user activity:', updateError);
    }

    // 計算在線使用者
    const currentTime = new Date().getTime();
    const onlineUsers = activeUsers.filter(u => {
      if (!u.last_active) return false;
      const lastActiveTime = new Date(u.last_active).getTime();
      return (currentTime - lastActiveTime) < ONLINE_THRESHOLD_MS;
    });

    // 按角色分組 (根據新的角色結構)
    const usersByRole = {
      root: onlineUsers.filter(u => (u.role as any)?.order === 0).length,           // 系統管理員
      admin: onlineUsers.filter(u => (u.role as any)?.order === 1).length,          // 計畫主持人
      manager: onlineUsers.filter(u => (u.role as any)?.order === 2).length,        // 帶班老師
      subjectTeacher: onlineUsers.filter(u => (u.role as any)?.order === 3).length, // 科任老師
      teacher: onlineUsers.filter(u => (u.role as any)?.order === 4).length,        // 大學伴
      candidate: onlineUsers.filter(u => (u.role as any)?.order === 5).length,      // 儲備大學伴
      total: onlineUsers.length
    };

    // 構建回應
    return NextResponse.json({
      online: {
        users: onlineUsers.map(u => ({
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'Unknown',
          role: (u.role as any)?.name || 'unknown',
          roleDisplayName: (u.role as any)?.display_name || 'Unknown',
          roleOrder: (u.role as any)?.order ?? -1,
          last_active: u.last_active
        })),
        byRole: usersByRole
      }
    });
    
  } catch (error) {
    console.error('Sessions API error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: '取得在線用戶資料失敗' },
      { status: 500 }
    );
  }
} 