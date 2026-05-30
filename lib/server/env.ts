import "server-only";

/**
 * Server-only environment access for the sponsored-gas backend.
 * Secrets (relayer key, HMAC secret) are read here and NEVER logged or sent
 * to the client. Public config (addresses, limits) can be surfaced via APIs.
 */

function readRelayerKey(): `0x${string}` | undefined {
  // RELAYER_PRIVATE_KEY pays gas. In dev it may equal the deploy PRIVATE_KEY.
  const raw = process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const prefixed = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(prefixed)) return undefined;
  return prefixed as `0x${string}`;
}

export const RELAYER_PRIVATE_KEY = readRelayerKey();

export const ORDER_TOKEN_SECRET = (process.env.ORDER_TOKEN_SECRET || "").trim();

export const MONAD_RPC_URL =
  process.env.MONAD_RPC_URL ||
  process.env.NEXT_PUBLIC_MONAD_RPC_URL ||
  "https://testnet-rpc.monad.xyz";

/** Vercel serverless only allows writes under /tmp; repo ./data is read-only there. */
function defaultJsonStorePath(fileName: string, envOverride: string | undefined): string {
  if (envOverride?.trim()) return envOverride.trim();
  if (process.env.VERCEL) return `/tmp/orbitrust/${fileName}`;
  return `./data/${fileName}`;
}

export const TENANT_STORE_PATH = defaultJsonStorePath(
  "tenants.json",
  process.env.TENANT_STORE_PATH
);

export const ORDER_STORE_PATH = defaultJsonStorePath(
  "orders.json",
  process.env.ORDER_STORE_PATH
);

export const SPONSORED_TX_DAILY_LIMIT = (() => {
  const n = Number(process.env.SPONSORED_TX_DAILY_LIMIT);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 100;
})();

/** Magic-link lifetime in days. */
export const ORDER_TOKEN_TTL_DAYS = (() => {
  const n = Number(process.env.ORDER_TOKEN_TTL_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 7;
})();

/** True when the relayer can sign and submit sponsored transactions. */
export const isRelayerConfigured = Boolean(
  RELAYER_PRIVATE_KEY && ORDER_TOKEN_SECRET
);

/** Human-readable reason the relayer is disabled, for diagnostics (no secrets). */
export function relayerConfigIssue(): string | null {
  if (!RELAYER_PRIVATE_KEY) return "RELAYER_PRIVATE_KEY missing or malformed";
  if (!ORDER_TOKEN_SECRET) return "ORDER_TOKEN_SECRET missing";
  return null;
}

// ---------------------------------------------------------------------------
// Seller auth (Better Auth + Mongo) + custodial wallets
// ---------------------------------------------------------------------------

export const MONGODB_URI =
  (process.env.MONGODB_URI || "mongodb://localhost:27017/orbitrust").trim();

export const BETTER_AUTH_SECRET = (process.env.BETTER_AUTH_SECRET || "").trim();

export const BETTER_AUTH_URL = (
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).trim();

/** Encrypts custodial seller private keys at rest. Distinct from ORDER_TOKEN_SECRET. */
export const SELLER_WALLET_SECRET = (process.env.SELLER_WALLET_SECRET || "").trim();

/** True when custodial seller wallets can be created and used. */
export const isSellerCustodyConfigured = Boolean(SELLER_WALLET_SECRET);

export function sellerCustodyConfigIssue(): string | null {
  if (!SELLER_WALLET_SECRET) return "SELLER_WALLET_SECRET missing";
  if (!MONGODB_URI) return "MONGODB_URI missing";
  if (!BETTER_AUTH_SECRET) return "BETTER_AUTH_SECRET missing";
  return null;
}
