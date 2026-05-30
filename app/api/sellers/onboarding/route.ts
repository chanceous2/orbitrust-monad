import { fail, getClientIp, ok } from "@/lib/server/http";
import { getSessionUser } from "@/lib/auth/session";
import {
  isRelayerConfigured,
  isSellerCustodyConfigured,
  SPONSORED_TX_DAILY_LIMIT,
} from "@/lib/server/env";
import { checkGlobalSponsoredLimit, checkIpLimit } from "@/lib/server/rateLimit";
import { explorerTxUrl } from "@/lib/contract/config";
import { getWalletByUserAndHandle, toStoreView } from "@/lib/sellers/store";
import {
  registerSellerOnChain,
  SellerActionError,
} from "@/lib/sellers/sellerActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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

  let body: { handle?: string };
  try {
    body = await req.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const handle = body.handle?.trim();
  if (!handle) return fail("Elegí un nombre de tienda.", 400);
  if (handle.length > 40) return fail("El nombre de tienda es demasiado largo.", 400);

  if (!checkGlobalSponsoredLimit(SPONSORED_TX_DAILY_LIMIT).ok) {
    return fail("Se alcanzó el límite diario de ventas incluidas en el plan.", 429);
  }

  try {
    const result = await registerSellerOnChain(user.id, handle);
    const wallet = await getWalletByUserAndHandle(user.id, handle);
    return ok({
      sellerAddress: result.sellerAddress,
      handle: result.handle,
      store: wallet ? toStoreView(wallet) : null,
      alreadyRegistered: result.alreadyRegistered,
      hash: result.hash,
      explorerUrl: result.hash ? explorerTxUrl(result.hash) : undefined,
      sponsored: true,
    });
  } catch (err) {
    if (err instanceof SellerActionError) return fail(err.message, err.status);
    const code = (err as { code?: number }).code;
    if (code === 11000) {
      return fail("Ese nombre de tienda ya está en uso.", 409);
    }
    return fail("No se pudo registrar la tienda.", 500);
  }
}
