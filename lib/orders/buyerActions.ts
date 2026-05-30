import "server-only";

import { monadTestnet } from "viem/chains";
import { CONTRACT_ADDRESS } from "@/lib/contract/config";
import {
  buildSignTypedDataArgs,
  type SponsoredActionId,
} from "@/lib/contract/eip712";
import { SPONSORED_TX_DAILY_LIMIT } from "@/lib/server/env";
import { checkGlobalSponsoredLimit } from "@/lib/server/rateLimit";
import {
  RelayerError,
  readNonce,
  readOrder,
  relaySponsored,
} from "@/lib/relayer/client";
import {
  deriveBuyerAccount,
  getOrderByToken,
  isExpired,
  markActionUsed,
  updateOrderStatus,
  type BuyerActionName,
  type OrderRecord,
  type OrderStatusName,
} from "./store";

// On-chain OrderStatus enum values (mirror of the contract).
const ON_CHAIN = { Created: 0, Accepted: 1, Fulfilled: 2, Completed: 3, Cancelled: 4 };

const REVIEWABLE_STATUSES = new Set([
  ON_CHAIN.Created,
  ON_CHAIN.Accepted,
  ON_CHAIN.Fulfilled,
  ON_CHAIN.Completed,
]);

const ACTION_MAP: Record<
  BuyerActionName,
  { action: SponsoredActionId; nextStatus: OrderStatusName; requires?: number }
> = {
  accept: { action: "acceptOrder", nextStatus: "accepted", requires: ON_CHAIN.Created },
  review: { action: "leaveReview", nextStatus: "completed" },
};

export class BuyerActionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "BuyerActionError";
    this.status = status;
  }
}

export type BuyerActionResult = {
  hash: string;
  alreadyDone: boolean;
  status: OrderStatusName;
  reviewed: boolean;
};

export async function runBuyerAction(
  token: string,
  action: BuyerActionName,
  review?: { rating: number; reviewHash: string }
): Promise<BuyerActionResult> {
  const record = await getOrderByToken(token);
  if (!record) throw new BuyerActionError("Orden no encontrada o link inválido.", 404);
  if (isExpired(record)) throw new BuyerActionError("Este link de reseña expiró.", 410);

  // Single-use per action: return the existing tx instead of paying gas twice.
  const used = record.actions[action];
  if (used) {
    return {
      hash: used.txHash,
      alreadyDone: true,
      status: record.status,
      reviewed: record.reviewed,
    };
  }

  const order = await readOrder(BigInt(record.orderId));
  validateState(action, order.status, order.reviewed);

  const buyerAccount = deriveBuyerAccount(token);
  if (buyerAccount.address.toLowerCase() !== order.buyer.toLowerCase()) {
    throw new BuyerActionError("El comprador del link no coincide con la orden.", 400);
  }

  const { action: actionId, nextStatus } = ACTION_MAP[action];
  const payload =
    action === "review"
      ? {
          orderId: String(record.orderId),
          rating: review!.rating,
          reviewHash: review!.reviewHash,
        }
      : { orderId: String(record.orderId) };

  const nonce = await readNonce(buyerAccount.address);
  const typed = buildSignTypedDataArgs(
    actionId,
    payload as never,
    nonce,
    CONTRACT_ADDRESS!,
    monadTestnet.id
  );

  // The buyer "signs" via the server using the key derived from the magic link.
  const signature = await buyerAccount.signTypedData({
    domain: typed.domain,
    types: typed.types as Record<string, readonly { name: string; type: string }[]>,
    primaryType: typed.primaryType,
    message: typed.message,
  } as Parameters<typeof buyerAccount.signTypedData>[0]);

  if (!checkGlobalSponsoredLimit(SPONSORED_TX_DAILY_LIMIT).ok) {
    throw new BuyerActionError("Se alcanzó el límite diario de ventas incluidas en el plan.", 429);
  }

  let hash: string;
  try {
    const result = await relaySponsored(actionId, payload as never, nonce, signature);
    hash = result.hash;
  } catch (err) {
    if (err instanceof RelayerError) throw new BuyerActionError(err.message, err.status);
    const e = err as { shortMessage?: string; message?: string };
    throw new BuyerActionError(
      e.shortMessage || e.message?.split("\n")[0] || "No se pudo confirmar la acción.",
      400
    );
  }

  await markActionUsed(token, action, hash);
  await updateOrderStatus(token, nextStatus, action === "review" ? { reviewed: true } : undefined);

  return {
    hash,
    alreadyDone: false,
    status: nextStatus,
    reviewed: action === "review" ? true : record.reviewed,
  };
}

function validateState(action: BuyerActionName, status: number, reviewed: boolean): void {
  if (status === ON_CHAIN.Cancelled) {
    throw new BuyerActionError("Esta orden fue cancelada por el vendedor.", 409);
  }
  if (action === "review") {
    if (reviewed) {
      throw new BuyerActionError("Esta orden ya tiene una reseña.", 409);
    }
    if (!REVIEWABLE_STATUSES.has(status)) {
      throw new BuyerActionError("La orden todavía no está lista para reseña.", 409);
    }
    return;
  }
  const { requires } = ACTION_MAP[action];
  if (status !== requires) {
    throw new BuyerActionError("Esta orden ya fue aceptada o no está disponible.", 409);
  }
}

export type { OrderRecord };
