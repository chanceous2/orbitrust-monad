import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { CONTRACT_ADDRESS } from "@/lib/contract/config";
import { metadataHashToLabel } from "@/lib/orbitrust";
import { db, ensureMongoConnected } from "@/lib/mongo";
import { readNextOrderId, readOrder, readSeller } from "@/lib/relayer/client";
import { isRelayerConfigured, ORDER_TOKEN_SECRET, ORDER_TOKEN_TTL_DAYS } from "@/lib/server/env";

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

const ON_CHAIN_STATUS: Record<number, OrderStatusName> = {
  0: "created",
  1: "accepted",
  2: "fulfilled",
  3: "completed",
  4: "cancelled",
};

let indexesReady: Promise<void> | null = null;

function collection() {
  return db.collection<OrderRecord>(COLLECTION);
}

async function ensureIndexes(): Promise<void> {
  await ensureMongoConnected();
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
  const result = await collection().updateOne({ tokenHash }, { $set: record }, { upsert: true });
  if (!result.acknowledged) {
    throw new Error("No se pudo guardar el link de reseña en la base de datos.");
  }
  return record;
}

function recordFromOnchainOrder(
  token: string,
  match: Awaited<ReturnType<typeof readOrder>>,
  sellerHandle?: string
): OrderRecord {
  const tokenHash = hashToken(token);
  const createdMs =
    match.createdAt > 0n ? Number(match.createdAt) * 1000 : Date.now();
  const ttlMs = ORDER_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  return {
    tokenHash,
    orderId: Number(match.id),
    seller: match.seller,
    buyer: match.buyer,
    amount: match.amount.toString(),
    metadataHash: match.metadataHash,
    description: metadataHashToLabel(match.metadataHash),
    sellerHandle,
    createdAt: createdMs,
    expiresAt: createdMs + ttlMs,
    status: ON_CHAIN_STATUS[match.status] ?? "created",
    reviewed: match.reviewed,
    actions: {},
  };
}

async function persistRecovered(record: OrderRecord): Promise<void> {
  const result = await collection().updateOne(
    { tokenHash: record.tokenHash },
    { $set: record },
    { upsert: true }
  );
  if (!result.acknowledged) {
    throw new Error("No se pudo persistir el link de reseña recuperado.");
  }
}

/** Fast path when the simulator/API included ?order= in the review URL. */
async function recoverOrderRecordById(
  token: string,
  orderId: number
): Promise<OrderRecord | undefined> {
  if (!isRelayerConfigured || !CONTRACT_ADDRESS) return undefined;
  if (!Number.isFinite(orderId) || orderId < 0) return undefined;

  const buyer = buyerAddressForToken(token).toLowerCase();
  let match: Awaited<ReturnType<typeof readOrder>>;
  try {
    match = await readOrder(BigInt(orderId));
  } catch {
    return undefined;
  }
  if (match.buyer.toLowerCase() !== buyer) return undefined;

  let sellerHandle: string | undefined;
  try {
    const seller = await readSeller(match.seller);
    if (seller.exists && seller.handle) sellerHandle = seller.handle;
  } catch {
    /* optional */
  }

  return recordFromOnchainOrder(token, match, sellerHandle);
}

async function recoverOrderRecordFromChain(token: string): Promise<OrderRecord | undefined> {
  if (!isRelayerConfigured || !CONTRACT_ADDRESS) return undefined;

  const buyer = buyerAddressForToken(token).toLowerCase();
  const nextId = await readNextOrderId();
  let match: Awaited<ReturnType<typeof readOrder>> | undefined;
  const scanLimit = 24n;
  const start = nextId > scanLimit ? nextId - scanLimit : 0n;

  for (let id = nextId - 1n; id >= start; id--) {
    try {
      const order = await readOrder(id);
      if (order.buyer.toLowerCase() === buyer) {
        match = order;
        break;
      }
    } catch {
      /* skip */
    }
  }
  if (!match) return undefined;

  let sellerHandle: string | undefined;
  try {
    const seller = await readSeller(match.seller);
    if (seller.exists && seller.handle) sellerHandle = seller.handle;
  } catch {
    /* optional */
  }

  return recordFromOnchainOrder(token, match, sellerHandle);
}

export async function getOrderByToken(
  token: string,
  orderIdHint?: number
): Promise<OrderRecord | undefined> {
  await ensureIndexes();
  const tokenHash = hashToken(token);
  const doc = await collection().findOne({ tokenHash });
  if (doc) return doc;

  const recovered =
    orderIdHint !== undefined
      ? await recoverOrderRecordById(token, orderIdHint)
      : await recoverOrderRecordFromChain(token);
  if (!recovered) return undefined;

  await persistRecovered(recovered);
  return recovered;
}

export function reviewPathFor(token: string, orderId: number): string {
  return `/review/${token}?order=${orderId}`;
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
