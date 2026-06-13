/**
 * TESTING BRANCH OVERRIDE
 * ─────────────────────────────────────────────────────────────────
 * This file exists only on feat/testing-paid-feat.
 * It forces every business to appear as if they are on the 'pro' plan,
 * so all paid features can be tested without a real Razorpay subscription.
 *
 * To revert: delete this file and remove all getEffectivePlan() calls.
 * ─────────────────────────────────────────────────────────────────
 */

const FORCE_PLAN = 'pro' as const;

/**
 * Returns the effective plan for the business.
 * In this testing branch, always returns 'pro'.
 */
export function getEffectivePlan(_actual: string): 'free' | 'growth' | 'pro' {
  return FORCE_PLAN;
}

/**
 * Returns true if the effective plan is NOT free.
 */
export function isPaidPlan(_actual: string): boolean {
  return true;
}

/**
 * Returns true if the effective plan is 'pro'.
 */
export function isProPlan(_actual: string): boolean {
  return true;
}
