import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { razorpay, RAZORPAY_PLAN_IDS } from '@/lib/razorpay';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { plan, businessId } = await req.json();

    if (!plan || !['growth', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Must be growth or pro.' }, { status: 400 });
    }
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    // Verify the business belongs to the logged-in user
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (business.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const planId = RAZORPAY_PLAN_IDS[plan];
    if (!planId || planId.startsWith('plan_XXXX')) {
      return NextResponse.json(
        { error: 'Razorpay plan IDs are not configured. Please add RAZORPAY_PLAN_GROWTH and RAZORPAY_PLAN_PRO to your .env file.' },
        { status: 500 }
      );
    }

    // If there's an existing active subscription, cancel it first
    if (business.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(business.razorpaySubscriptionId, false);
      } catch {
        // Ignore errors cancelling old subscription (may already be inactive)
      }
    }

    // Create a new Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 billing cycles (1 year)
      quantity: 1,
      customer_notify: 1,
      notes: {
        businessId,
        userId: session.user.id,
        plan,
        businessName: business.name,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan,
      businessName: business.name,
      userEmail: session.user.email,
      userName: session.user.name,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error?.error?.description || error?.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
