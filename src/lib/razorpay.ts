import Razorpay from 'razorpay';
import crypto from 'crypto';

// Server-side Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Map our plan slugs to Razorpay Plan IDs
export const RAZORPAY_PLAN_IDS: Record<string, string> = {
  growth: process.env.RAZORPAY_PLAN_GROWTH!,
  pro: process.env.RAZORPAY_PLAN_PRO!,
};

// Plan display config
export const PLAN_CONFIG = {
  free: { label: 'Free', price: 0, color: '#64748b' },
  growth: { label: 'Growth', price: 499, color: '#6366f1' },
  pro: { label: 'Pro', price: 1499, color: '#a855f7' },
};

/**
 * Verify a Razorpay payment signature (for checkout verification).
 * HMAC-SHA256 of `subscriptionId|paymentId` using key_secret.
 */
export function verifyPaymentSignature(params: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): boolean {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = params;
  const body = razorpay_payment_id + '|' + razorpay_subscription_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');
  return expectedSignature === razorpay_signature;
}

/**
 * Verify a Razorpay webhook signature.
 * HMAC-SHA256 of raw request body using RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Calculate expiry date (1 month from now) for the subscription.
 */
export function getNextMonthExpiry(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
}
