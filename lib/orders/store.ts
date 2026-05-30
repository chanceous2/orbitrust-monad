import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { db } from "@/lib/mongo";
import { ORDER_TOKEN_SECRET, ORDER_TOKEN_TTL_DAYS } from "@/lib/server/env";

export type OrderStatusName =
  | "created"
  | "accepted"
  | "fulfilled"
  | "completed"
  | "cancelled";

export type BuyerActionName = "accept" | "review";

export type OrderRecord = {
  /** sha256(rawToken). The raw token lives only in the magic link, never here. */
  tokenHash: string;
  orderId: number;
  seller: `0x${string}`;
  /** Ephemeral buyer address derived from the magic-link token (custodial MVP). */
  buyer: `0x${string}`;
  amount: string;
  metadataHash: string;
  description: string;
  sellerHandle?: string;
  createdAt: number;
  expiresAt: number;
  status: OrderStatusName;
  reviewed: boolean;
  /** Single-use tracking per buyer action. */
  actions: Partial<Record<BuyerActionName, { txHash: string; at: number }>>;
};

const COLLECTION = "order_magic_links";

let indexesReady: Promise<void> | null = null;

function collection() {
  return db.collection<OrderRecord>(COLLECTION);
}

async function ensureIndexes(): Promise<void> {
  if (!indexesReady) {
    indexesReady = (async () => {
      const col = collection();
      try {
        await col.createIndex({ tokenHash: 1 }, { unique: true, name: "order_magic_links_tokenHash" });
        await col.createIndex({ orderId: 1 }, { name: "order_magic_links_orderId" });
      } catch (err) {
        const code = (err as { code?: number }).code;
        if (code === 68 || code === 85 || code === 86) return;
        throw err;
      }
    })();
  }
  await indexesReady;
}

// ---------------------------------------------------------------------------
// Token + ephemeral buyer key derivation
// ---------------------------------------------------------------------------

export function createOrderToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Derives a deterministic secp256k1 key for the buyer from the magic-link
 * token and the server secret. Only the server (holding ORDER_TOKEN_SECRET)
 * can reconstruct it; possessing the link == being able to act as the buyer.
 * The private key is never stored — it is recomputed on demand from the token.
 */
export function deriveBuyerAccount(token: string): PrivateKeyAccount {
  if (!ORDER_TOKEN_SECRET) {
    throw new Error("ORDER_TOKEN_SECRET is not configured");
  }
  for (let counter = 0; counter < 1000; counter++) {
    const hex = createHmac("sha256", ORDER_TOKEN_SECRET)
      .update(`orbitrust:buyer:${token}:${counter}`)
      .digest("hex");
    try {
      // privateKeyToAccount throws if the scalar is out of the valid range.
      return privateKeyToAccount(`0x${hex}`);
    } catch {
      // Astronomically unlikely; advance the counter and try again.
    }
  }
  throw new Error("Could not derive a valid buyer key");
}

export function buyerAddressForToken(token: string): `0x${string}` {
  return deriveBuyerAccount(token).address;
}

// ---------------------------------------------------------------------------
// Persistence (MongoDB — shared across serverless instances)
// ---------------------------------------------------------------------------

export async function saveOrder(input: {
  token: string;
  orderId: number;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  amount: string;
  metadataHash: string;
  description: string;
  sellerHandle?: string;
}): Promise<OrderRecord> {
  await ensureIndexes();
  const tokenHash = hashToken(input.token);
  const now = Date.now();
  const record: OrderRecord = {
    tokenHash,
    orderId: input.orderId,
    seller: input.seller,
    buyer: input.buyer,
    amount: input.amount,
    metadataHash: input.metadataHash,
    description: input.description,
    sellerHandle: input.sellerHandle,
    createdAt: now,
    expiresAt: now + ORDER_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    status: "created",
    reviewed: false,
    actions: {},
  };
  await collection().updateOne({ tokenHash }, { $set: record }, { upsert: true });
  return record;
}

export async function getOrderByToken(token: string): Promise<OrderRecord | undefined> {
  await ensureIndexes();
  const doc = await collection().findOne({ tokenHash: hashToken(token) });
  return doc ?? undefined;
}

export function isExpired(record: OrderRecord, now = Date.now()): boolean {
  return now > record.expiresAt;
}

export async function updateOrderStatus(
  token: string,
  status: OrderStatusName,
  opts?: { reviewed?: boolean }
): Promise<void> {
  await ensureIndexes();
  const tokenHash = hashToken(token);
  const $set: Partial<OrderRecord> = { status };
  if (opts?.reviewed !== undefined) $set.reviewed = opts.reviewed;
  await collection().updateOne({ tokenHash }, { $set });
}

/** Marks a buyer action as used (single-use) and stores its tx hash. */
export async function markActionUsed(
  token: string,
  action: BuyerActionName,
  txHash: string
): Promise<void> {
  await ensureIndexes();
  const tokenHash = hashToken(token);
  await collection().updateOne(
    { tokenHash },
    { $set: { [`actions.${action}`]: { txHash, at: Date.now() } } }
  );
}

export async function findByOrderId(orderId: number): Promise<OrderRecord | undefined> {
  await ensureIndexes();
  const doc = await collection().findOne({ orderId });
  return doc ?? undefined;
}

/**
 * Syncs the off-chain status for an order touched by a seller action
 * (fulfill/cancel) that does not flow through the magic-link endpoints.
 */
export async function updateStatusByOrderId(
  orderId: number,
  status: OrderStatusName
): Promise<void> {
  await ensureIndexes();
  await collection().updateOne({ orderId }, { $set: { status } });
}
