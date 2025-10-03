import { NextRequest, NextResponse } from 'next/server';
import { postgresStorage as storage } from '../../../../lib/server/utils/postgres';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const experienceId = url.searchParams.get('experienceId');
    
    if (!experienceId) {
      return NextResponse.json({ error: 'Missing experienceId parameter' }, { status: 400 });
    }

    const result = await storage.softDeleteShop(experienceId);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Close store error:', error);
    return NextResponse.json({ error: 'Failed to close store' }, { status: 500 });
  }
}
