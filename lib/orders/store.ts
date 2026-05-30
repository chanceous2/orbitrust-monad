import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { JsonStore } from "@/lib/server/jsonStore";
import {
  ORDER_STORE_PATH,
  ORDER_TOKEN_SECRET,
  ORDER_TOKEN_TTL_DAYS,
} from "@/lib/server/env";

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

const store = new JsonStore<OrderRecord>(ORDER_STORE_PATH);

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
// Persistence
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
  await store.mutate((data) => {
    data[tokenHash] = record;
  });
  return record;
}

export async function getOrderByToken(token: string): Promise<OrderRecord | undefined> {
  return store.get(hashToken(token));
}

export function isExpired(record: OrderRecord, now = Date.now()): boolean {
  return now > record.expiresAt;
}

export async function updateOrderStatus(
  token: string,
  status: OrderStatusName,
  opts?: { reviewed?: boolean }
): Promise<void> {
  const tokenHash = hashToken(token);
  await store.mutate((data) => {
    const record = data[tokenHash];
    if (!record) return;
    record.status = status;
    if (opts?.reviewed !== undefined) record.reviewed = opts.reviewed;
  });
}

/** Marks a buyer action as used (single-use) and stores its tx hash. */
export async function markActionUsed(
  token: string,
  action: BuyerActionName,
  txHash: string
): Promise<void> {
  const tokenHash = hashToken(token);
  await store.mutate((data) => {
    const record = data[tokenHash];
    if (!record) return;
    record.actions[action] = { txHash, at: Date.now() };
  });
}

export async function findByOrderId(orderId: number): Promise<OrderRecord | undefined> {
  const all = await store.all();
  return Object.values(all).find((r) => r.orderId === orderId);
}

/**
 * Syncs the off-chain status for an order touched by a seller action
 * (fulfill/cancel) that does not flow through the magic-link endpoints.
 */
export async function updateStatusByOrderId(
  orderId: number,
  status: OrderStatusName
): Promise<void> {
  await store.mutate((data) => {
    const record = Object.values(data).find((r) => r.orderId === orderId);
    if (record) record.status = status;
  });
}
