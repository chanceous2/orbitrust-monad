import "server-only";

import { monadTestnet } from "viem/chains";
import { CONTRACT_ADDRESS } from "@/lib/contract/config";
import {
  buildSignTypedDataArgs,
  type SponsoredActionId,
  type SponsoredPayloads,
} from "@/lib/contract/eip712";
import { descriptionToMetadataHash, metadataHashToLabel } from "@/lib/orbitrust";
import {
  RelayerError,
  readNonce,
  readOrder,
  readSeller,
  relaySponsored,
  type RelayResult,
} from "@/lib/relayer/client";
import {
  buyerAddressForToken,
  createOrderToken,
  saveOrder,
  updateStatusByOrderId,
} from "@/lib/orders/store";
import { ensureTenant, recordOrder } from "@/lib/tenant/store";
import {
  createWallet,
  getWalletByUserAndHandle,
  resolveActiveWallet,
  accountFromWallet,
  isHandleTaken,
  markRegistered,
  normalizeHandle,
  listWalletsByUserId,
  type SellerWalletRecord,
} from "@/lib/sellers/store";

export class SellerActionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "SellerActionError";
    this.status = status;
  }
}

async function runSellerActionForWallet<A extends SponsoredActionId>(
  wallet: SellerWalletRecord,
  action: A,
  payload: SponsoredPayloads[A]
): Promise<RelayResult> {
  if (!CONTRACT_ADDRESS) {
    throw new SellerActionError("No hay contrato OrbiTrust configurado.", 503);
  }

  const account = accountFromWallet(wallet);
  const nonce = await readNonce(account.address);
  const typed = buildSignTypedDataArgs(
    action,
    payload,
    nonce,
    CONTRACT_ADDRESS,
    monadTestnet.id
  );

  const signature = await account.signTypedData({
    domain: typed.domain,
    types: typed.types as Record<string, readonly { name: string; type: string }[]>,
    primaryType: typed.primaryType,
    message: typed.message,
  } as Parameters<typeof account.signTypedData>[0]);

  try {
    return await relaySponsored(action, payload as never, nonce, signature);
  } catch (err) {
    if (err instanceof RelayerError) throw new SellerActionError(err.message, err.status);
    const e = err as { shortMessage?: string; message?: string };
    throw new SellerActionError(
      e.shortMessage || e.message?.split("\n")[0] || "No se pudo completar la acción.",
      400
    );
  }
}

async function runSellerAction<A extends SponsoredActionId>(
  userId: string,
  action: A,
  payload: SponsoredPayloads[A],
  activeStoreAddress?: string | null
): Promise<RelayResult> {
  const wallet = await resolveActiveWallet(userId, activeStoreAddress);
  if (!wallet) {
    throw new SellerActionError("Completá el onboarding antes de continuar.", 400);
  }
  return runSellerActionForWallet(wallet, action, payload);
}

/** Repara flags locales cuando la tienda ya existe on-chain pero Mongo quedó desincronizado. */
export async function syncRegisteredStoresForUser(userId: string): Promise<SellerWalletRecord[]> {
  const wallets = await listWalletsByUserId(userId);
  for (const wallet of wallets) {
    if (wallet.registeredOnChain) continue;
    try {
      const onchain = await readSeller(wallet.address);
      if (onchain.exists) {
        await markRegistered(wallet.address);
        wallet.registeredOnChain = true;
        wallet.address = wallet.address.toLowerCase() as `0x${string}`;
      }
    } catch {
      // Sin contrato o RPC caído — dejar flag como está.
    }
  }
  return wallets.filter((wallet) => wallet.registeredOnChain);
}

export async function registerSellerOnChain(
  userId: string,
  handle: string
): Promise<{
  sellerAddress: `0x${string}`;
  handle: string;
  hash?: `0x${string}`;
  alreadyRegistered: boolean;
}> {
  normalizeHandle(handle);

  let wallet = await getWalletByUserAndHandle(userId, handle);
  if (wallet?.registeredOnChain) {
    return {
      sellerAddress: wallet.address,
      handle: wallet.handle,
      alreadyRegistered: true,
    };
  }

  if (await isHandleTaken(handle, userId)) {
    throw new SellerActionError("Ese nombre de tienda ya está en uso.", 409);
  }

  if (!wallet) {
    wallet = await createWallet(userId, handle);
  }

  const payload = { handle: wallet.handle, metadataURI: "ipfs://demo" };
  const result = await runSellerActionForWallet(wallet, "registerSeller", payload);
  await ensureTenant(wallet.address, wallet.handle);
  await markRegistered(wallet.address);

  return {
    sellerAddress: wallet.address,
    handle: wallet.handle,
    hash: result.hash,
    alreadyRegistered: false,
  };
}

export async function createSellerOrder(
  userId: string,
  input: { amount: string; description: string },
  activeStoreAddress?: string | null
): Promise<{
  orderId: number;
  token: string;
  reviewPath: string;
  hash: `0x${string}`;
}> {
  const wallet = await resolveActiveWallet(userId, activeStoreAddress);
  if (!wallet?.registeredOnChain) {
    throw new SellerActionError("Completá el onboarding antes de crear órdenes.", 400);
  }

  const metadataHash = descriptionToMetadataHash(input.description);
  const { token } = createOrderToken();
  const buyer = buyerAddressForToken(token);
  const payload = {
    buyer,
    amount: String(Math.trunc(Number(input.amount))),
    metadataHash,
  };

  const result = await runSellerActionForWallet(wallet, "createOrder", payload);
  if (result.orderId === undefined) {
    throw new SellerActionError("No se pudo leer el id de la orden creada.", 502);
  }

  const onchain = await readSeller(wallet.address);
  await recordOrder(wallet.address);
  await saveOrder({
    token,
    orderId: Number(result.orderId),
    seller: wallet.address,
    buyer,
    amount: payload.amount,
    metadataHash,
    description: metadataHashToLabel(metadataHash),
    sellerHandle: onchain.handle || wallet.handle,
  });

  return {
    orderId: Number(result.orderId),
    token,
    reviewPath: `/review/${token}`,
    hash: result.hash,
  };
}

async function assertOrderOwner(
  userId: string,
  orderId: number,
  activeStoreAddress?: string | null
): Promise<`0x${string}`> {
  const wallet = await resolveActiveWallet(userId, activeStoreAddress);
  if (!wallet?.registeredOnChain) {
    throw new SellerActionError("Completá el onboarding antes de gestionar órdenes.", 400);
  }

  const order = await readOrder(BigInt(orderId));
  if (order.seller.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new SellerActionError("No sos el vendedor de esta orden.", 403);
  }

  return wallet.address;
}

export async function cancelOrder(
  userId: string,
  orderId: number,
  activeStoreAddress?: string | null
): Promise<{ hash: `0x${string}` }> {
  const walletAddress = await assertOrderOwner(userId, orderId, activeStoreAddress);
  const wallet = await resolveActiveWallet(userId, walletAddress);
  if (!wallet) {
    throw new SellerActionError("No se encontró la tienda activa.", 404);
  }
  const result = await runSellerActionForWallet(wallet, "cancelOrder", {
    orderId: String(orderId),
  });
  await updateStatusByOrderId(orderId, "cancelled");
  return { hash: result.hash };
}
