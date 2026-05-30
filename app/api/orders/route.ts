import { fail, getClientIp, isAddress, isHexSignature, ok } from "@/lib/server/http";
import { checkGlobalSponsoredLimit, checkIpLimit } from "@/lib/server/rateLimit";
import { isRelayerConfigured, SPONSORED_TX_DAILY_LIMIT } from "@/lib/server/env";
import {
  RelayerError,
  readSeller,
  recoverSponsoredSigner,
  relaySponsored,
} from "@/lib/relayer/client";
import { explorerTxUrl } from "@/lib/contract/config";
import { metadataHashToLabel } from "@/lib/orbitrust";
import {
  buyerAddressForToken,
  saveOrder,
} from "@/lib/orders/store";
import {
  canCreateOrder,
  ensureTenant,
  getTenant,
  recordOrder,
  usageFor,
} from "@/lib/tenant/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_RE = /^[0-9a-f]{64}$/;

/**
 * Step 2 of sponsored order creation. The seller signs CreateOrder over the
 * buyer address derived in /api/orders/prepare; OrbiTrust submits + pays gas.
 */
export async function POST(req: Request) {
  if (!isRelayerConfigured) {
    return fail("El relayer no está configurado en el servidor.", 503);
  }
  const ip = getClientIp(req);
  if (!checkIpLimit(ip).ok) {
    return fail("Demasiadas solicitudes. Probá de nuevo en un momento.", 429);
  }

  let body: {
    token?: string;
    payload?: { buyer?: string; amount?: string; metadataHash?: string };
    nonce?: string;
    signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const { token, payload, nonce, signature } = body;
  if (!token || !TOKEN_RE.test(token)) return fail("Token inválido.", 400);
  if (!payload || !isAddress(payload.buyer)) return fail("Buyer inválido.", 400);
  if (payload.amount === undefined || !/^\d+$/.test(String(payload.amount))) {
    return fail("Monto inválido.", 400);
  }
  if (typeof payload.metadataHash !== "string" || payload.metadataHash.length === 0) {
    return fail("Falta la descripción de la orden.", 400);
  }
  if (!isHexSignature(signature)) return fail("Firma inválida.", 400);
  if (nonce === undefined || !/^\d+$/.test(String(nonce))) return fail("Nonce inválido.", 400);

  // The buyer address must match the one derived from the magic-link token.
  const derivedBuyer = buyerAddressForToken(token);
  if (derivedBuyer.toLowerCase() !== payload.buyer.toLowerCase()) {
    return fail("El comprador no coincide con el token.", 400);
  }

  const orderPayload = {
    buyer: payload.buyer,
    amount: String(payload.amount),
    metadataHash: payload.metadataHash,
  };
  const nonceBig = BigInt(nonce);

  let seller: `0x${string}`;
  try {
    seller = await recoverSponsoredSigner("createOrder", orderPayload, nonceBig, signature);
  } catch {
    return fail("No se pudo verificar la firma del vendedor.", 400);
  }

  try {
    const onchain = await readSeller(seller);
    if (!onchain.exists) {
      return fail("Registrá tu perfil de vendedor antes de crear órdenes.", 400);
    }

    const tenant = (await getTenant(seller)) ?? (await ensureTenant(seller, onchain.handle));
    if (!canCreateOrder(tenant)) {
      return fail("Alcanzaste el límite de órdenes de tu plan este mes.", 403, {
        plan: tenant.plan,
        usage: usageFor(tenant),
      });
    }

    if (!checkGlobalSponsoredLimit(SPONSORED_TX_DAILY_LIMIT).ok) {
      return fail("Se alcanzó el límite diario de ventas incluidas en el plan.", 429);
    }

    const result = await relaySponsored("createOrder", orderPayload, nonceBig, signature);
    if (result.orderId === undefined) {
      return fail("No se pudo leer el id de la orden creada.", 502);
    }

    await recordOrder(seller);
    await saveOrder({
      token,
      orderId: Number(result.orderId),
      seller,
      buyer: derivedBuyer,
      amount: orderPayload.amount,
      metadataHash: orderPayload.metadataHash,
      description: metadataHashToLabel(orderPayload.metadataHash),
      sellerHandle: onchain.handle,
    });

    return ok({
      orderId: Number(result.orderId),
      token,
      reviewPath: `/review/${token}`,
      confirmPath: `/review/${token}`,
      hash: result.hash,
      explorerUrl: explorerTxUrl(result.hash),
      relayer: result.relayer,
      sponsored: true,
    });
  } catch (err) {
    if (err instanceof RelayerError) return fail(err.message, err.status);
    const e = err as { shortMessage?: string; message?: string };
    return fail(e.shortMessage || e.message?.split("\n")[0] || "No se pudo crear la orden.", 400);
  }
}
