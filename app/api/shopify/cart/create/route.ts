import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '../../../../../lib/whop-sdk';
import { postgresStorage } from '../../../../../lib/server/utils/postgres';
import { createDraftOrder, completeDraftOrder, fetchProductsAdmin } from '../../../../../lib/server/shopify/admin';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experienceId = searchParams.get('experienceId');
    const userId = searchParams.get('userId');

    if (!experienceId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const user = await whopSdk.users.getUser({ userId });

    const shopRecord = await postgresStorage.getShopByExperience(experienceId);
    
    if (!shopRecord?.shopDomain || !shopRecord.adminAccessToken) {
      return NextResponse.json({ error: 'Store not connected' }, { status: 404 });
    }

    const totalAmount = items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    const totalInCents = Math.round(totalAmount * 100);

    const chargeResult = await whopSdk.withUser(user.id).payments.chargeUser({
      userId: user.id,
      amount: totalInCents,
      currency: 'usd',
      description: `Purchase: ${items.length} item(s) from ${shopRecord.shopDomain}`,
      metadata: {
        experienceId,
        itemCount: items.length,
        shopDomain: shopRecord.shopDomain
      }
    });

    if (chargeResult.status === 'needs_action') {
      return NextResponse.json({
        status: 'needs_action',
        inAppPurchase: chargeResult.inAppPurchase
      });
    }

    const orders = [];
    for (const item of items) {
      const draftOrder = await createDraftOrder({
        shop: shopRecord.shopDomain,
        adminAccessToken: shopRecord.adminAccessToken,
        variantId: item.variantId,
        quantity: item.quantity,
        email: user.email || undefined
      });

      const completedOrder = await completeDraftOrder({
        shop: shopRecord.shopDomain,
        adminAccessToken: shopRecord.adminAccessToken,
        draftOrderId: draftOrder.orderId
      });

      orders.push({
        id: completedOrder.orderId,
        name: completedOrder.orderName
      });
    }

    return NextResponse.json({
      status: 'success',
      orders
    });

  } catch (error: any) {
    console.error('Purchase error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to complete purchase' 
    }, { status: 500 });
  }
}

