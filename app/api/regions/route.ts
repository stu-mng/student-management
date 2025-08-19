import type { ErrorResponse, RegionsResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { getUserFromHeaders } from '@/lib/middleware-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/regions
 * 
 * 返回所有小學伴的唯一區域集合
 * Permission check handled by middleware
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user info from middleware headers (already authenticated and authorized)
    const userInfo = getUserFromHeaders(request);
    
    if (!userInfo) {
      // Fallback if middleware didn't process this request
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    // 查詢區域資料
    const query = supabase.from('students').select('region');
    
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