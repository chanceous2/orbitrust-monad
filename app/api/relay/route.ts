import { fail, getClientIp, isHexSignature, ok } from "@/lib/server/http";
import { checkGlobalSponsoredLimit, checkIpLimit } from "@/lib/server/rateLimit";
import { isRelayerConfigured, SPONSORED_TX_DAILY_LIMIT } from "@/lib/server/env";
import {
  RelayerError,
  recoverSponsoredSigner,
  relaySponsored,
} from "@/lib/relayer/client";
import { explorerTxUrl } from "@/lib/contract/config";
import type { SponsoredActionId } from "@/lib/contract/eip712";
import { ensureTenant } from "@/lib/tenant/store";
import { updateStatusByOrderId } from "@/lib/orders/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generic seller relay. createOrder lives in /api/orders (it also mints a magic
// link); buyer actions live in /api/orders/[token]/*. This endpoint handles the
// remaining seller-signed actions.
const ALLOWED: SponsoredActionId[] = ["registerSeller", "markFulfilled", "cancelOrder"];

export async function POST(req: Request) {
  if (!isRelayerConfigured) {
    return fail("El relayer no está configurado en el servidor.", 503);
  }

  const ip = getClientIp(req);
  if (!checkIpLimit(ip).ok) {
    return fail("Demasiadas solicitudes. Probá de nuevo en un momento.", 429);
  }

  let body: {
    action?: string;
    payload?: Record<string, unknown>;
    nonce?: string;
    signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const { action, payload, nonce, signature } = body;
  if (!action || !ALLOWED.includes(action as SponsoredActionId)) {
    return fail("Acción no soportada por este endpoint.", 400);
  }
  if (!payload || typeof payload !== "object") return fail("Falta payload.", 400);
  if (!isHexSignature(signature)) return fail("Firma inválida.", 400);
  if (nonce === undefined || !/^\d+$/.test(String(nonce))) {
    return fail("Nonce inválido.", 400);
  }

  const actionId = action as SponsoredActionId;
  const nonceBig = BigInt(nonce);

  // Recover the seller off-chain so we can identify the tenant before paying gas.
  let seller: `0x${string}`;
  try {
    seller = await recoverSponsoredSigner(actionId, payload as never, nonceBig, signature);
  } catch {
    return fail("No se pudo verificar la firma.", 400);
  }

  if (!checkGlobalSponsoredLimit(SPONSORED_TX_DAILY_LIMIT).ok) {
    return fail("Se alcanzó el límite diario de ventas incluidas en el plan.", 429);
  }

  try {
    const result = await relaySponsored(actionId, payload as never, nonceBig, signature);

    if (actionId === "registerSeller") {
      const handle = typeof payload.handle === "string" ? payload.handle : undefined;
      await ensureTenant(seller, handle);
    } else if (actionId === "markFulfilled") {
      await updateStatusByOrderId(Number((payload as { orderId: string }).orderId), "fulfilled");
    } else if (actionId === "cancelOrder") {
      await updateStatusByOrderId(Number((payload as { orderId: string }).orderId), "cancelled");
    }

    return ok({
      hash: result.hash,
      explorerUrl: explorerTxUrl(result.hash),
      relayer: result.relayer,
      sponsored: true,
    });
  } catch (err) {
    if (err instanceof RelayerError) return fail(err.message, err.status);
    return fail(relayErrorMessage(err), 400);
  }
}

function relayErrorMessage(err: unknown): string {
  const e = err as { shortMessage?: string; message?: string };
  return e.shortMessage || e.message?.split("\n")[0] || "No se pudo enviar la transacción.";
}
