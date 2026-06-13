import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy Razorpay instance — only created when a request actually needs it,
// so the build never crashes when env vars are missing/placeholder.
let _instance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_instance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId.includes('XXXX') || keySecret.includes('XXXX')) {
      throw new Error('Razorpay keys are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables.');
    }
    _instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _instance;
}

// Map our plan slugs to Razorpay Plan IDs
export const RAZORPAY_PLAN_IDS: Record<string, string> = {
  growth: process.env.RAZORPAY_PLAN_GROWTH || '',
  pro: process.env.RAZORPAY_PLAN_PRO || '',
};

// Plan display config
export const PLAN_CONFIG = {
  free: { label: 'Free', price: 0, color: '#64748b' },
  growth: { label: 'Growth', price: 499, color: '#6366f1' },
  pro: { label: 'Pro', price: 1499, color: '#a855f7' },
};

/**
 * Verify a Razorpay payment signature (for checkout verification).
 * HMAC-SHA256 of `paymentId|subscriptionId` using key_secret.
 */
export function verifyPaymentSignature(params: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || secret.includes('XXXX')) return false;
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = params;
  const body = razorpay_payment_id + '|' + razorpay_subscription_id;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === razorpay_signature;
}

/**
 * Verify a Razorpay webhook signature.
 * HMAC-SHA256 of raw request body using RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || secret.includes('your_webhook')) return false;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
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

