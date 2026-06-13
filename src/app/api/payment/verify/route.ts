import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyPaymentSignature, getNextMonthExpiry } from '@/lib/razorpay';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      businessId,
      plan,
    } = await req.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }
    if (!businessId || !plan) {
      return NextResponse.json({ error: 'Missing businessId or plan' }, { status: 400 });
    }

    // Verify business ownership
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || business.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cryptographically verify the payment signature
    const isValid = verifyPaymentSignature({
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature. Payment rejected.' }, { status: 400 });
    }

    // Upgrade the business plan in DB
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        plan,
        planStatus: 'active',
        razorpaySubscriptionId: razorpay_subscription_id,
        planExpiresAt: getNextMonthExpiry(),
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedBusiness.plan,
      planExpiresAt: updatedBusiness.planExpiresAt,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
