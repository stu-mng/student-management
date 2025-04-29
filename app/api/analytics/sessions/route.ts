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
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 檢查用戶是否有 admin 或 root 角色
    if (userData.role !== 'admin' && userData.role !== 'root') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }
    
    // 取得所有用戶的最後活動時間
    const { data: activeUsers, error: activeError } = await supabase
      .from('users')
      .select('id, name, email, role, updated_at, last_active')
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
    const currentTime = Date.now();
    const onlineUsers = activeUsers.filter(u => {
      if (!u.last_active) return false;
      const lastActiveTime = new Date(u.last_active).getTime();
      return (currentTime - lastActiveTime) < ONLINE_THRESHOLD_MS;
    });

    // 按角色分組
    const usersByRole = {
      teachers: onlineUsers.filter(u => u.role === 'teacher').length,
      admins: onlineUsers.filter(u => u.role === 'admin').length,
      root: onlineUsers.filter(u => u.role === 'root').length,
      total: onlineUsers.length
    };

    // 構建回應
    return NextResponse.json({
      online: {
        users: onlineUsers.map(u => ({
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'Unknown',
          role: u.role,
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