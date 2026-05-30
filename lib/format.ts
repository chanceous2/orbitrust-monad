export function shortAddress(address?: string | null, size = 4): string {
  if (!address) return "—";
  if (address.length <= size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function shortHash(hash?: string | null, size = 6): string {
  if (!hash) return "—";
  if (hash.length <= size * 2 + 2) return hash;
  return `${hash.slice(0, size + 2)}…${hash.slice(-size)}`;
}

/** Amounts are stored as plain integers (no decimals assumed in V1). */
export function formatAmount(amount?: bigint | number | string | null): string {
  if (amount === undefined || amount === null) return "0";
  try {
    const value = typeof amount === "bigint" ? amount : BigInt(amount);
    return value.toLocaleString("en-US");
  } catch {
    return String(amount);
  }
}

/** One-decimal average rating, computed bigint-safe. */
export function formatRating(ratingSum: bigint, reviewsCount: bigint): string {
  if (reviewsCount === 0n) return "0.0";
  const tenths = (ratingSum * 10n) / reviewsCount;
  const whole = tenths / 10n;
  const frac = tenths % 10n;
  return `${whole.toString()}.${frac.toString()}`;
}

export function isValidAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function formatTimestamp(seconds?: bigint | number | null): string {
  if (!seconds) return "—";
  const ms = Number(seconds) * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
