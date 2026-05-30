/**
 * Multitenant plans for OrbiTrust (sponsored-gas SaaS model).
 *
 * Single source of truth for plan limits and labels. Plans are fictitious for
 * the hackathon: there is no real billing, only gating + upgrade prompts.
 * The seller pays a plan to OrbiTrust; OrbiTrust sponsors buyer + seller gas.
 */

export type TenantPlan = "basico" | "pro" | "ultra";

export type PlanInfo = {
  id: TenantPlan;
  name: string;
  tagline: string;
  /** Sponsored TrustOrders included per calendar month. null = unlimited. */
  monthlyOrderLimit: number | null;
  /** Reference price in ARS (display only, no billing). */
  priceArs: number;
};

export const PLANS: Record<TenantPlan, PlanInfo> = {
  basico: {
    id: "basico",
    name: "Básico",
    tagline: "Empezá a construir reputación verificable",
    monthlyOrderLimit: 50,
    priceArs: 0,
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Hacé crecer tu reputación sin fricción",
    monthlyOrderLimit: 500,
    priceArs: 19999,
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    tagline: "Escalá como una marca confiable",
    monthlyOrderLimit: null,
    priceArs: 49999,
  },
};

export const PLAN_IDS: TenantPlan[] = ["basico", "pro", "ultra"];

export const DEFAULT_PLAN: TenantPlan = "basico";

export function isTenantPlan(value: unknown): value is TenantPlan {
  return value === "basico" || value === "pro" || value === "ultra";
}

export function getPlanInfo(plan: TenantPlan): PlanInfo {
  return PLANS[plan];
}

/** Returns the next plan up, or null at the top tier. */
export function nextPlan(plan: TenantPlan): TenantPlan | null {
  const idx = PLAN_IDS.indexOf(plan);
  return idx >= 0 && idx < PLAN_IDS.length - 1 ? PLAN_IDS[idx + 1] : null;
}
