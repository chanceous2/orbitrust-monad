import "server-only";

/**
 * Tiny in-memory fixed-window rate limiter. Sufficient for a hackathon MVP;
 * resets on server restart and does not span multiple instances.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export type RateResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    windows.set(key, { count: 1, resetAt });
    return { ok: true, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/** Per-IP burst guard. */
export function checkIpLimit(ip: string): RateResult {
  return rateLimit(`ip:${ip}`, 40, MINUTE_MS);
}

/** Global cap on sponsored (gas-paying) transactions per rolling day. */
export function checkGlobalSponsoredLimit(dailyLimit: number): RateResult {
  return rateLimit("global:sponsored:day", dailyLimit, DAY_MS);
}
