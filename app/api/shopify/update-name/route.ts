import { NextRequest, NextResponse } from 'next/server';
import { postgresStorage as storage } from '../../../../lib/server/utils/postgres';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experienceId = searchParams.get('experienceId');
    const name = searchParams.get('name');
    
    if (!experienceId || !name) {
      return NextResponse.json({ error: 'Missing experienceId or name parameter' }, { status: 400 });
    }

    if (name.trim().length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    const result = await storage.updateShopName(experienceId, name.trim());
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message, name: result.name });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Update shop name error:', error);
    return NextResponse.json({ error: 'Failed to update shop name' }, { status: 500 });
  }
}

