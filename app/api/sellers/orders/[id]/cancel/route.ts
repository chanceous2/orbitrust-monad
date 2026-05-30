import { fail, getClientIp, ok } from "@/lib/server/http";
import { getSessionUser } from "@/lib/auth/session";
import {
  isRelayerConfigured,
  isSellerCustodyConfigured,
  SPONSORED_TX_DAILY_LIMIT,
} from "@/lib/server/env";
import { checkGlobalSponsoredLimit, checkIpLimit } from "@/lib/server/rateLimit";
import { explorerTxUrl } from "@/lib/contract/config";
import { cancelOrder, SellerActionError } from "@/lib/sellers/sellerActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isRelayerConfigured) {
    return fail("El relayer no está configurado en el servidor.", 503);
  }
  if (!isSellerCustodyConfigured) {
    return fail("La custodia de tiendas no está configurada.", 503);
  }

  const user = await getSessionUser(req);
  if (!user) return fail("No autenticado.", 401);

  const ip = getClientIp(req);
  if (!checkIpLimit(ip).ok) {
    return fail("Demasiadas solicitudes. Probá de nuevo en un momento.", 429);
  }

  const orderId = Number(params.id);
  if (!Number.isFinite(orderId) || orderId < 0) {
    return fail("Id de orden inválido.", 400);
  }

  if (!checkGlobalSponsoredLimit(SPONSORED_TX_DAILY_LIMIT).ok) {
    return fail("Se alcanzó el límite diario de ventas incluidas en el plan.", 429);
  }

  try {
    const result = await cancelOrder(user.id, orderId, user.activeStoreAddress);
    return ok({
      hash: result.hash,
      explorerUrl: explorerTxUrl(result.hash),
      sponsored: true,
    });
  } catch (err) {
    if (err instanceof SellerActionError) return fail(err.message, err.status);
    const e = err as { shortMessage?: string; message?: string };
    return fail(
      e.shortMessage || e.message?.split("\n")[0] || "No se pudo cancelar la orden.",
      400
    );
  }
}
