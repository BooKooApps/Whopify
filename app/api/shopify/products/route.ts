import { NextRequest, NextResponse } from 'next/server';
import { postgresStorage as storage } from '../../../../lib/server/utils/postgres-storage';
import { fetchProductsAdmin } from '../../../../lib/server/shopify/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const experienceId = searchParams.get('experienceId');
  const first = searchParams.get('first');

  if (!experienceId) {
    return NextResponse.json({ error: 'Missing experienceId' }, { status: 400 });
  }

  try {
    const rec = await storage.getShopByExperience(experienceId);
    if (!rec?.adminAccessToken) {
      return NextResponse.json({ error: 'Not connected' }, { status: 404 });
    }

    const firstNum = first ? parseInt(first, 10) : 20;
    const items = await fetchProductsAdmin({ 
      shop: rec.shopDomain, 
      adminAccessToken: rec.adminAccessToken, 
      first: firstNum 
    });

    return NextResponse.json({ 
      shopDomain: rec.shopDomain, 
      products: items 
    });
  } catch (error: any) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 502 });
  }
}
