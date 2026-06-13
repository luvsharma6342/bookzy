import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getRazorpay } from '@/lib/razorpay';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { businessId } = await req.json();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || business.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!business.razorpaySubscriptionId) {
      return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
    }

    // Cancel at period end (cancel_at_cycle_end = true means they keep access until period ends)
    await getRazorpay().subscriptions.cancel(business.razorpaySubscriptionId, true);

    // Mark as cancelled in our DB (they still have access until planExpiresAt)
    const updated = await prisma.business.update({
      where: { id: businessId },
      data: { planStatus: 'cancelled' },
    });

    return NextResponse.json({
      success: true,
      planStatus: updated.planStatus,
      planExpiresAt: updated.planExpiresAt,
      message: 'Subscription cancelled. You retain access until the current billing period ends.',
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: error?.error?.description || error?.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
