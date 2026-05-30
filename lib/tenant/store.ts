import "server-only";

import { JsonStore } from "@/lib/server/jsonStore";
import { TENANT_STORE_PATH } from "@/lib/server/env";
import {
  DEFAULT_PLAN,
  PLANS,
  getPlanInfo,
  isTenantPlan,
  type TenantPlan,
} from "./plans";

export type TenantRecord = {
  address: `0x${string}`;
  handle?: string;
  plan: TenantPlan;
  createdAt: number;
  /** Usage keyed by month "YYYY-MM" (UTC). */
  usage: Record<string, { orders: number }>;
};

export type TenantUsage = {
  month: string;
  orders: number;
  limit: number | null;
  remaining: number | null;
};

const store = new JsonStore<TenantRecord>(TENANT_STORE_PATH);

function key(address: string): string {
  return address.toLowerCase();
}

export function currentMonth(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getTenant(address: string): Promise<TenantRecord | undefined> {
  return store.get(key(address));
}

/** Creates the tenant on first use (auto-provision on registerSeller). */
export async function ensureTenant(
  address: `0x${string}`,
  handle?: string
): Promise<TenantRecord> {
  return store.mutate((data) => {
    const k = key(address);
    let tenant = data[k];
    if (!tenant) {
      tenant = {
        address: address.toLowerCase() as `0x${string}`,
        handle,
        plan: DEFAULT_PLAN,
        createdAt: Date.now(),
        usage: {},
      };
      data[k] = tenant;
    } else if (handle && tenant.handle !== handle) {
      tenant.handle = handle;
    }
    return tenant;
  });
}

export function usageFor(tenant: TenantRecord, month = currentMonth()): TenantUsage {
  const orders = tenant.usage[month]?.orders ?? 0;
  const limit = PLANS[tenant.plan].monthlyOrderLimit;
  return {
    month,
    orders,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - orders),
  };
}

/** True when the tenant can create another sponsored order this month. */
export function canCreateOrder(tenant: TenantRecord, month = currentMonth()): boolean {
  const { limit, orders } = usageFor(tenant, month);
  return limit === null || orders < limit;
}

/** Records one sponsored order against the current month. */
export async function recordOrder(address: `0x${string}`): Promise<void> {
  const month = currentMonth();
  await store.mutate((data) => {
    const k = key(address);
    const tenant = data[k];
    if (!tenant) return;
    const bucket = tenant.usage[month] ?? { orders: 0 };
    bucket.orders += 1;
    tenant.usage[month] = bucket;
  });
}

export async function setPlan(address: `0x${string}`, plan: TenantPlan): Promise<TenantRecord | undefined> {
  if (!isTenantPlan(plan)) return undefined;
  return store.mutate((data) => {
    const tenant = data[key(address)];
    if (tenant) tenant.plan = plan;
    return tenant;
  });
}

export { getPlanInfo };
