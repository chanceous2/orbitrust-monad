import { fail, ok } from "@/lib/server/http";
import { isRelayerConfigured } from "@/lib/server/env";
import { RelayerError, getRelayerAddress, readOrder, readSeller } from "@/lib/relayer/client";
import { explorerTxUrl } from "@/lib/contract/config";
import { STATUS_LABELS, orderNo } from "@/lib/orbitrust";
import { getOrderByToken, isExpired, type BuyerActionName } from "@/lib/orders/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ON_CHAIN = { Created: 0, Accepted: 1, Fulfilled: 2, Completed: 3, Cancelled: 4 };

function nextAction(status: number, reviewed: boolean): BuyerActionName | null {
  if (reviewed) return null;
  if (
    status === ON_CHAIN.Created ||
    status === ON_CHAIN.Accepted ||
    status === ON_CHAIN.Fulfilled ||
    status === ON_CHAIN.Completed
  ) {
    return "review";
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const token = params.token;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return fail("Token inválido.", 400);
  }

  const record = await getOrderByToken(token);
  if (!record) return fail("Orden no encontrada o link inválido.", 404);
  if (isExpired(record)) return fail("Este link de reseña expiró.", 410);

  if (!isRelayerConfigured) {
    return fail("El relayer no está configurado en el servidor.", 503);
  }

  try {
    const order = await readOrder(BigInt(record.orderId));
    let handle = record.sellerHandle;
    try {
      const seller = await readSeller(order.seller);
      if (seller.exists && seller.handle) handle = seller.handle;
    } catch {
      // keep stored handle
    }

    const action = nextAction(order.status, order.reviewed);

    return ok({
      order: {
        orderId: record.orderId,
        orderNo: orderNo(record.orderId),
        seller: order.seller,
        sellerHandle: handle ?? null,
        amount: order.amount.toString(),
        description: record.description,
        status: order.status,
        statusName: STATUS_LABELS[order.status] ?? "Unknown",
        reviewed: order.reviewed,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
      },
      nextAction: action,
      actionsDone: Object.fromEntries(
        Object.entries(record.actions).map(([k, v]) => [k, v ? explorerTxUrl(v.txHash) : null])
      ),
      relayer: getRelayerAddress(),
      sponsored: true,
    });
  } catch (err) {
    if (err instanceof RelayerError) return fail(err.message, err.status);
    return fail("No se pudo leer la orden.", 500);
  }
}
