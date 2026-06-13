import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, getNextMonthExpiry } from '@/lib/razorpay';
import prisma from '@/lib/prisma';

// Razorpay calls this endpoint automatically for subscription lifecycle events.
// Must be a public route (no auth guard) — verified via HMAC signature instead.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify the request came from Razorpay
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event;
    const payload = event.payload;

    console.log('[Webhook] Received:', eventType);

    // Extract subscription from payload
    const subscription = payload?.subscription?.entity;
    const subscriptionId: string | undefined = subscription?.id;
    const notes = subscription?.notes || {};
    const businessId: string | undefined = notes?.businessId;
    const plan: string | undefined = notes?.plan;

    if (!businessId) {
      console.warn('[Webhook] No businessId in subscription notes. Skipping.');
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      // Subscription became active after first payment
      case 'subscription.activated':
        await prisma.business.update({
          where: { id: businessId },
          data: {
            plan: plan || 'growth',
            planStatus: 'active',
            razorpaySubscriptionId: subscriptionId,
            planExpiresAt: getNextMonthExpiry(),
          },
        });
        break;

      // Recurring charge was collected successfully (monthly renewal)
      case 'subscription.charged': {
        const chargeAt = payload?.payment?.entity?.created_at;
        const expiresAt = chargeAt
          ? new Date((chargeAt + 30 * 24 * 60 * 60) * 1000)
          : getNextMonthExpiry();
        await prisma.business.update({
          where: { id: businessId },
          data: {
            planStatus: 'active',
            planExpiresAt: expiresAt,
          },
        });
        break;
      }

      // Merchant cancelled the subscription (will stay active until period end)
      case 'subscription.cancelled':
        await prisma.business.update({
          where: { id: businessId },
          data: { planStatus: 'cancelled' },
        });
        break;

      // Subscription fully expired — downgrade to free
      case 'subscription.completed':
        await prisma.business.update({
          where: { id: businessId },
          data: {
            plan: 'free',
            planStatus: 'active',
            razorpaySubscriptionId: null,
            planExpiresAt: null,
          },
        });
        break;

      // Payment failed — mark as past_due but don't downgrade immediately
      case 'payment.failed':
        await prisma.business.update({
          where: { id: businessId },
          data: { planStatus: 'past_due' },
        });
        break;

      default:
        console.log('[Webhook] Unhandled event:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }
}
