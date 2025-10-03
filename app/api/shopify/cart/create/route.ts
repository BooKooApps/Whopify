import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '../../../../../lib/whop-sdk';
import { postgresStorage } from '../../../../../lib/server/utils/postgres';
import { createDraftOrder, completeDraftOrder, fetchProductsAdmin } from '../../../../../lib/server/shopify/admin';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experienceId = searchParams.get('experienceId');
    const variantId = searchParams.get('variantId');

    if (!experienceId || !variantId) {
      return NextResponse.json({ error: 'Missing experienceId or variantId' }, { status: 400 });
    }

    const headersList = await headers();
    const userToken = headersList.get('x-whop-user-token');
    
    if (!userToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId } = await whopSdk.verifyUserToken(headersList);
    const user = await whopSdk.users.getUser({ userId });

    const shopRecord = await postgresStorage.getShopByExperience(experienceId);
    
    if (!shopRecord?.shopDomain || !shopRecord.adminAccessToken) {
      return NextResponse.json({ error: 'Store not connected' }, { status: 404 });
    }

    const products = await fetchProductsAdmin({
      shop: shopRecord.shopDomain,
      adminAccessToken: shopRecord.adminAccessToken,
      first: 100
    });

    const product = products.find(p => p.variantId === variantId);
    
    if (!product || !product.price) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const priceInCents = Math.round(parseFloat(product.price) * 100);

    const chargeResult = await whopSdk.payments.chargeUser({
      userId: user.id,
      amount: priceInCents,
      currency: 'usd',
      description: `Purchase: ${product.title}`,
      metadata: {
        experienceId,
        variantId,
        productId: product.id,
        shopDomain: shopRecord.shopDomain
      }
    });

    if (chargeResult.status === 'needs_action') {
      return NextResponse.json({
        status: 'needs_action',
        inAppPurchase: chargeResult.inAppPurchase
      });
    }

    const draftOrder = await createDraftOrder({
      shop: shopRecord.shopDomain,
      adminAccessToken: shopRecord.adminAccessToken,
      variantId,
      quantity: 1,
      email: user.email || undefined
    });

    const completedOrder = await completeDraftOrder({
      shop: shopRecord.shopDomain,
      adminAccessToken: shopRecord.adminAccessToken,
      draftOrderId: draftOrder.orderId
    });

    return NextResponse.json({
      status: 'success',
      order: {
        id: completedOrder.orderId,
        name: completedOrder.orderName
      }
    });

  } catch (error: any) {
    console.error('Purchase error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to complete purchase' 
    }, { status: 500 });
  }
}

