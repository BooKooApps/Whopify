import { NextRequest, NextResponse } from 'next/server';
import { postgresStorage as storage } from '../../../../lib/server/utils/postgres-storage';
import { fetchShopInfo } from '../../../../lib/server/shopify/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const experienceId = searchParams.get('experienceId');

  if (!experienceId) {
    return NextResponse.json({ error: 'Missing experienceId' }, { status: 400 });
  }

  try {
    const rec = await storage.getShopByExperience(experienceId);
    if (!rec?.adminAccessToken) {
      return NextResponse.json({ error: 'Not connected' }, { status: 404 });
    }

    const shopInfo = await fetchShopInfo({ 
      shop: rec.shopDomain, 
      adminAccessToken: rec.adminAccessToken 
    });

    if (!shopInfo) {
      return NextResponse.json({ error: 'Shop information not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      shopDomain: rec.shopDomain, 
      shopInfo 
    });
  } catch (error: any) {
    console.error('Shop info fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch shop information' }, { status: 502 });
  }
}
