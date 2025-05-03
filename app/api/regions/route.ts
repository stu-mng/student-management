import { ErrorResponse, RegionsResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/regions
 * 
 * 返回所有小學伴的唯一區域集合
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 獲取用戶角色和區域
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, region')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Get user role error:', userError);
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }

    if (userData.role === 'teacher') {
      return NextResponse.json<ErrorResponse>({ error: '大學伴無法查看區域列表' }, { status: 403 });
    }

    // 查詢區域資料
    let query = supabase.from('students').select('region');
    
    // 執行查詢
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 500 });
    }
    
    // 獲取唯一區域集合，過濾掉 null 和空值
    const uniqueRegionsMap: Record<string, boolean> = {};
    data.forEach(item => {
      if (item.region) {
        uniqueRegionsMap[item.region] = true;
      }
    });
    
    const uniqueRegions = Object.keys(uniqueRegionsMap);
    
    return NextResponse.json<RegionsResponse>({
      success: true,
      data: uniqueRegions
    });
  } catch (error) {
    console.error('Get regions error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to get regions' },
      { status: 500 }
    );
  }
}