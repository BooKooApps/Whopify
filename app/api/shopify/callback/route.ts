import { NextRequest, NextResponse } from 'next/server';
import { verifyHmac, exchangeCodeForToken } from '../../../../lib/server/shopify/utils';
import { postgresStorage as storage } from '../../../../lib/server/utils/postgres';
import { createStorefrontAccessToken, registerAppUninstalledWebhook } from '../../../../lib/server/shopify/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const hmac = searchParams.get('hmac');

  console.log('OAuth callback received:', { shop, code: code ? 'present' : 'missing', state: state ? 'present' : 'missing', hmac: hmac ? 'present' : 'missing' });

  if (!shop || !code || !state || !hmac) {
    console.error('Missing callback params:', { shop, code, state, hmac });
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
    
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      console.log('Parsed state data:', stateData);
    } catch (parseError) {
      console.error('Failed to parse state data:', parseError);
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }
    
    await storage.saveShop({ 
      shopDomain: shop, 
      adminAccessToken: token.access_token,
      creator: stateData.creator
    });

    try {
      const sfToken = await createStorefrontAccessToken({ 
        shop, 
        adminAccessToken: token.access_token 
      });
      await storage.saveShop({ 
        shopDomain: shop, 
        adminAccessToken: token.access_token, 
        storefrontAccessToken: sfToken,
        creator: stateData.creator
      });
    } catch (e: any) {
      console.warn('Storefront token creation failed:', e.message);
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      const callbackUrl = `${baseUrl}/api/shopify/webhooks/app_uninstalled`;
      console.log('Registering webhook with URL:', callbackUrl);
      
      await registerAppUninstalledWebhook({ 
        shop, 
        adminAccessToken: token.access_token, 
        callbackUrl 
      });
      console.log('Webhook registered successfully');
    } catch (e: any) {
      console.error('Webhook registration failed:', e.message);
    }

    const experienceId = stateData.experienceId;
    
    if (experienceId) {
      await storage.saveExperienceMapping(experienceId, shop, stateData.creator);
      console.log('Saved experience mapping:', { experienceId, shop });
    }

    if (stateData.returnUrl) {
      console.log('Redirecting to return URL:', stateData.returnUrl);
      return NextResponse.redirect(stateData.returnUrl);
    }
    
    console.log('OAuth callback completed successfully:', { shop, experienceId });
    return NextResponse.json({ ok: true, shop, experienceId });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: error.message || 'OAuth callback failed' }, { status: 500 });
  }
}
