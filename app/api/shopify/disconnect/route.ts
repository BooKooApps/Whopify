import { NextRequest, NextResponse } from 'next/server';
import { postgresStorage as storage } from '../../../../lib/server/utils/postgres-storage';

export async function POST(request: NextRequest) {
  try {
    const { experienceId } = await request.json();
    
    if (!experienceId) {
      return NextResponse.json({ error: 'Missing experienceId' }, { status: 400 });
    }

    const result = await storage.disconnectShop(experienceId);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect shop' }, { status: 500 });
  }
}
