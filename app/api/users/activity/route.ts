import { createClient } from '@/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/users/activity
 * 
 * 更新當前用戶的最後活動時間
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 獲取當前用戶的認證資料
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 更新用戶的最後活動時間
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('users')
      .update({ last_active: now })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating activity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ updated: true, timestamp: now });
  } catch (error) {
    console.error('Update activity error:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
} 