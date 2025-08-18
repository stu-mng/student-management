import type { ErrorResponse, LoginRequest, LoginResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 * 
 * 使用 Google OAuth 進行用戶身份驗證
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { token }: LoginRequest = await request.json();

    if (!token) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Missing Google OAuth token' },
        { status: 400 }
      );
    }

    // 向 Supabase 提交 Google token 進行身份驗證
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token,
    });

    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 401 });
    }

    // 獲取完整的用戶資訊
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json<LoginResponse>({
      token: data.session?.access_token as string,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 