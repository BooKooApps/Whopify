import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookHmac } from '../../../../../lib/server/shopify/utils';
import { postgresStorage as storage } from '../../../../../lib/server/utils/postgres';

export async function POST(request: NextRequest) {
  try {
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const rawBody = await request.arrayBuffer();
    
    if (!verifyWebhookHmac(hmac, rawBody)) {
      return new Response('invalid hmac', { status: 401 });
    }
    
    const shop = request.headers.get('x-shopify-shop-domain');
    if (shop) {
      await storage.saveShop({ shopDomain: shop, adminAccessToken: '' });
    }
    
    console.log('Webhook app_uninstalled received:', { shop });
    return new Response('ok');
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response('error', { status: 500 });
  }
}
