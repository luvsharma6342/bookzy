/**
 * PLAN OVERRIDE / RESOLVER
 * ─────────────────────────────────────────────────────────────────
 * Resolves business plan tiers. If testing, this can be hardcoded
 * to 'pro' or similar. Otherwise, it resolves to the actual DB value.
 * ─────────────────────────────────────────────────────────────────
 */

export function getEffectivePlan(actual: string): 'free' | 'growth' | 'pro' {
  if (actual === 'pro' || actual === 'growth' || actual === 'free') {
    return actual;
  }
  return 'free';
}

export function isPaidPlan(actual: string): boolean {
  const plan = getEffectivePlan(actual);
  return plan === 'growth' || plan === 'pro';
}

export function isProPlan(actual: string): boolean {
  return getEffectivePlan(actual) === 'pro';
}
