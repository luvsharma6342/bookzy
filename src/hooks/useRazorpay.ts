'use client';

import { useCallback } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OpenRazorpayOptions {
  plan: 'growth' | 'pro';
  businessId: string;
  onSuccess: (plan: string) => void;
  onError?: (error: string) => void;
}

export function useRazorpay() {
  const loadScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const openCheckout = useCallback(async (options: OpenRazorpayOptions) => {
    const { plan, businessId, onSuccess, onError } = options;

    // Load Razorpay SDK
    const loaded = await loadScript();
    if (!loaded) {
      onError?.('Failed to load Razorpay SDK. Check your internet connection.');
      return;
    }

    // Create subscription on server
    const res = await fetch('/api/payment/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, businessId }),
    });

    if (!res.ok) {
      const err = await res.json();
      onError?.(err.error || 'Failed to create subscription.');
      return;
    }

    const { subscriptionId, keyId, businessName, userEmail, userName } = await res.json();

    const planLabels: Record<string, string> = { growth: 'Growth — ₹499/month', pro: 'Pro — ₹1,499/month' };

    const rzp = new window.Razorpay({
      key: keyId,
      subscription_id: subscriptionId,
      name: 'Bookze',
      description: planLabels[plan] || plan,
      image: '', // Add your logo URL here
      prefill: {
        name: userName || '',
        email: userEmail || '',
      },
      notes: { businessId, plan, businessName },
      theme: { color: '#6366f1' },
      modal: {
        ondismiss: () => {
          onError?.('Payment was cancelled.');
        },
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_subscription_id: string;
        razorpay_signature: string;
      }) => {
        // Verify payment on server and upgrade plan
        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
            businessId,
            plan,
          }),
        });

        if (verifyRes.ok) {
          onSuccess(plan);
        } else {
          const err = await verifyRes.json();
          onError?.(err.error || 'Payment verification failed.');
        }
      },
    });

    rzp.open();
  }, [loadScript]);

  return { openCheckout };
}
