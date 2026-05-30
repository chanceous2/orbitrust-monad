import { fail, getClientIp, ok } from "@/lib/server/http";
import { checkIpLimit } from "@/lib/server/rateLimit";
import { isRelayerConfigured } from "@/lib/server/env";
import { explorerTxUrl } from "@/lib/contract/config";
import { BuyerActionError, runBuyerAction } from "@/lib/orders/buyerActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { token: string } }) {
  if (!isRelayerConfigured) return fail("El relayer no está configurado.", 503);
  if (!checkIpLimit(getClientIp(req)).ok) {
    return fail("Demasiadas solicitudes. Probá de nuevo en un momento.", 429);
  }
  const token = params.token;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return fail("Token inválido.", 400);

  try {
    const result = await runBuyerAction(token, "accept");
    return ok({
      hash: result.hash,
      explorerUrl: explorerTxUrl(result.hash),
      alreadyDone: result.alreadyDone,
      status: result.status,
      reviewed: result.reviewed,
      sponsored: true,
    });
  } catch (err) {
    if (err instanceof BuyerActionError) return fail(err.message, err.status);
    return fail("No se pudo aceptar la orden.", 500);
  }
}
