import "server-only";

import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { db } from "@/lib/mongo";
import { decryptPrivateKey, encryptPrivateKey } from "@/lib/sellers/crypto";

const COLLECTION = "seller_wallets";

export type SellerWalletRecord = {
  userId: string;
  address: `0x${string}`;
  handle: string;
  handleLower: string;
  encryptedPrivateKey: string;
  registeredOnChain: boolean;
  createdAt: number;
};

export type SellerStoreView = {
  address: `0x${string}`;
  handle: string;
  registeredOnChain: boolean;
  createdAt: number;
};

let indexesReady: Promise<void> | null = null;

async function safeCreateIndex(
  col: ReturnType<typeof db.collection<SellerWalletRecord>>,
  spec: Parameters<typeof col.createIndex>[0],
  options: Parameters<typeof col.createIndex>[1]
): Promise<void> {
  try {
    await col.createIndex(spec, options);
  } catch (err) {
    const code = (err as { code?: number }).code;
    // 68 = IndexAlreadyExists, 85/86 = options/name conflict on existing index
    if (code === 68 || code === 85 || code === 86) return;
    throw err;
  }
}

export async function ensureIndexes(): Promise<void> {
  if (!indexesReady) {
    indexesReady = (async () => {
      const col = db.collection<SellerWalletRecord>(COLLECTION);
      try {
        await safeCreateIndex(col, { userId: 1 }, { name: "seller_wallets_userId" });
        await safeCreateIndex(
          col,
          { handleLower: 1 },
          { unique: true, name: "seller_wallets_handleLower" }
        );
        await safeCreateIndex(
          col,
          { address: 1 },
          { unique: true, name: "seller_wallets_address" }
        );
        await safeCreateIndex(
          col,
          { userId: 1, handleLower: 1 },
          { unique: true, name: "seller_wallets_user_handle" }
        );
      } catch (err) {
        indexesReady = null;
        console.error("[OrbiTrust] seller_wallets indexes:", err);
      }
    })();
  }
  await indexesReady;
}

function normalizeHandle(handle: string): { handle: string; handleLower: string } {
  const trimmed = handle.trim();
  if (!trimmed) throw new Error("Handle vacío");
  if (trimmed.length > 40) throw new Error("Handle demasiado largo");
  return { handle: trimmed, handleLower: trimmed.toLowerCase() };
}

export async function listWalletsByUserId(userId: string): Promise<SellerWalletRecord[]> {
  await ensureIndexes();
  return db
    .collection<SellerWalletRecord>(COLLECTION)
    .find({ userId })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function getWalletByUserAndHandle(
  userId: string,
  handle: string
): Promise<SellerWalletRecord | null> {
  await ensureIndexes();
  const { handleLower } = normalizeHandle(handle);
  return db.collection<SellerWalletRecord>(COLLECTION).findOne({ userId, handleLower });
}

export async function resolveActiveWallet(
  userId: string,
  preferredAddress?: string | null
): Promise<SellerWalletRecord | null> {
  const wallets = await listWalletsByUserId(userId);
  if (wallets.length === 0) return null;

  if (preferredAddress) {
    const preferred = preferredAddress.toLowerCase() as `0x${string}`;
    const match = wallets.find((w) => w.address.toLowerCase() === preferred);
    if (match) return match;
  }

  return wallets.find((w) => w.registeredOnChain) ?? wallets[wallets.length - 1];
}

/** Wallet activa del usuario (compat con flujos legacy). */
export async function getWalletByUserId(
  userId: string,
  activeStoreAddress?: string | null
): Promise<SellerWalletRecord | null> {
  return resolveActiveWallet(userId, activeStoreAddress);
}

export async function getWalletByAddress(address: string): Promise<SellerWalletRecord | null> {
  await ensureIndexes();
  return db
    .collection<SellerWalletRecord>(COLLECTION)
    .findOne({ address: address.toLowerCase() as `0x${string}` });
}

/** Vendedores registrados vía panel (excluye wallets demo del simulador). */
export async function listRegisteredSellers(): Promise<SellerWalletRecord[]> {
  await ensureIndexes();
  return db
    .collection<SellerWalletRecord>(COLLECTION)
    .find({
      registeredOnChain: true,
      userId: { $not: /^simulator:/ },
    })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function isHandleTaken(handle: string, forUserId?: string): Promise<boolean> {
  await ensureIndexes();
  const { handleLower } = normalizeHandle(handle);
  const existing = await db.collection<SellerWalletRecord>(COLLECTION).findOne({ handleLower });
  if (!existing) return false;
  if (forUserId && existing.userId === forUserId) return false;
  return true;
}

function normalizeAddress(address: string): `0x${string}` {
  return address.toLowerCase() as `0x${string}`;
}

export async function createWallet(userId: string, handle: string): Promise<SellerWalletRecord> {
  await ensureIndexes();
  const { handle: normalizedHandle, handleLower } = normalizeHandle(handle);
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const record: SellerWalletRecord = {
    userId,
    address: normalizeAddress(account.address),
    handle: normalizedHandle,
    handleLower,
    encryptedPrivateKey: encryptPrivateKey(privateKey),
    registeredOnChain: false,
    createdAt: Date.now(),
  };

  await db.collection<SellerWalletRecord>(COLLECTION).insertOne(record);
  return record;
}

export function accountFromWallet(wallet: SellerWalletRecord): PrivateKeyAccount {
  const privateKey = decryptPrivateKey(wallet.encryptedPrivateKey);
  return privateKeyToAccount(privateKey);
}

export async function loadAccount(
  userId: string,
  address?: string | null
): Promise<PrivateKeyAccount> {
  const wallet = address
    ? await getWalletByAddress(address)
    : await resolveActiveWallet(userId);
  if (!wallet || wallet.userId !== userId) {
    throw new Error("No hay perfil de tienda para este usuario.");
  }
  return accountFromWallet(wallet);
}

export async function markRegistered(address: `0x${string}`): Promise<void> {
  await ensureIndexes();
  const normalized = normalizeAddress(address);
  const result = await db.collection<SellerWalletRecord>(COLLECTION).updateOne(
    {
      $expr: { $eq: [{ $toLower: "$address" }, normalized] },
    },
    { $set: { registeredOnChain: true, address: normalized } }
  );

  if (result.matchedCount === 0) {
    throw new Error(`No se encontró la wallet ${normalized}.`);
  }
}

export function toStoreView(wallet: SellerWalletRecord): SellerStoreView {
  return {
    address: wallet.address,
    handle: wallet.handle,
    registeredOnChain: wallet.registeredOnChain,
    createdAt: wallet.createdAt,
  };
}

export { normalizeHandle };
