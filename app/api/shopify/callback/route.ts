import { NextRequest, NextResponse } from 'next/server';
import { verifyHmac, exchangeCodeForToken } from '../../../../lib/server/shopify/utils';
import { postgresStorage as storage } from '../../../../lib/server/utils/postgres-storage';
import { createStorefrontAccessToken, registerAppUninstalledWebhook } from '../../../../lib/server/shopify/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const hmac = searchParams.get('hmac');

  if (!shop || !code || !state || !hmac) {
    return NextResponse.json({ error: 'Invalid callback params' }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const searchParamsObj = new URLSearchParams(url.search);
    const isValid = verifyHmac(searchParamsObj);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const token = await exchangeCodeForToken({ shop, code });
    await storage.saveShop({ 
      shopDomain: shop, 
      adminAccessToken: token.access_token 
    });

    try {
      const sfToken = await createStorefrontAccessToken({ 
        shop, 
        adminAccessToken: token.access_token 
      });
      await storage.saveShop({ 
        shopDomain: shop, 
        adminAccessToken: token.access_token, 
        storefrontAccessToken: sfToken 
      });
    } catch (e: any) {
      console.warn('Storefront token creation failed:', e.message);
    }

    try {
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host') || 'localhost:3000';
      const callbackUrl = `${proto}://${host}/api/shopify/webhooks/app_uninstalled`;
      
      await registerAppUninstalledWebhook({ 
        shop, 
        adminAccessToken: token.access_token, 
        callbackUrl 
      });
    } catch (e: any) {
      console.warn('Webhook registration failed:', e.message);
    }

    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const experienceId = stateData.experienceId;
    
    if (experienceId) {
      await storage.saveExperienceMapping(experienceId, shop);
    }

    console.log(`OAuth install success for shop: ${shop}, experience: ${experienceId}`);

    if (stateData.returnUrl) {
      return NextResponse.redirect(stateData.returnUrl);
    }
    
    return NextResponse.json({ ok: true, shop, experienceId });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: error.message || 'OAuth callback failed' }, { status: 500 });
  }
}
