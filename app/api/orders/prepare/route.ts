import { fail, getClientIp, isAddress, ok } from "@/lib/server/http";
import { checkIpLimit } from "@/lib/server/rateLimit";
import { isRelayerConfigured } from "@/lib/server/env";
import { RelayerError, readNonce, readSeller } from "@/lib/relayer/client";
import { createOrderToken, buyerAddressForToken } from "@/lib/orders/store";
import { getTenant, ensureTenant, usageFor, canCreateOrder } from "@/lib/tenant/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step 1 of sponsored order creation. The seller has no buyer wallet to target,
 * so OrbiTrust mints a magic-link token and derives the buyer's ephemeral
 * address from it. The seller then signs a CreateOrder typed-data message over
 * that buyer address (step 2 = POST /api/orders).
 */
export async function POST(req: Request) {
  if (!isRelayerConfigured) {
    return fail("El relayer no está configurado en el servidor.", 503);
  }
  const ip = getClientIp(req);
  if (!checkIpLimit(ip).ok) {
    return fail("Demasiadas solicitudes. Probá de nuevo en un momento.", 429);
  }

  let body: { seller?: string };
  try {
    body = await req.json();
  } catch {
    return fail("JSON inválido.", 400);
  }
  if (!isAddress(body.seller)) return fail("Dirección de seller inválida.", 400);
  const seller = body.seller;

  try {
    const onchain = await readSeller(seller);
    if (!onchain.exists) {
      return fail(
        "Esta tienda no está registrada en el contrato actual. Entrá al panel, completá el registro de vendedor y volvé a probar.",
        400
      );
    }

    const tenant = (await getTenant(seller)) ?? (await ensureTenant(seller, onchain.handle));
    if (!canCreateOrder(tenant)) {
      const usage = usageFor(tenant);
      return fail("Alcanzaste el límite de órdenes de tu plan este mes.", 403, {
        plan: tenant.plan,
        usage,
      });
    }

    const nonce = await readNonce(seller);
    const { token } = createOrderToken();
    const buyer = buyerAddressForToken(token);

    return ok({ token, buyer, nonce: nonce.toString() });
  } catch (err) {
    if (err instanceof RelayerError) return fail(err.message, err.status);
    return fail("No se pudo preparar la orden.", 500);
  }
}
