import { createClient } from '@/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * 
 * 使當前用戶的認證令牌失效
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 登出當前用戶
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 