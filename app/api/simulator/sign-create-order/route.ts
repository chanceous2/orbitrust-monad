import { fail, getClientIp, ok } from "@/lib/server/http";
import { checkIpLimit } from "@/lib/server/rateLimit";
import { isRelayerConfigured, isSellerCustodyConfigured } from "@/lib/server/env";
import { CONTRACT_ADDRESS } from "@/lib/contract/config";
import { buildSignTypedDataArgs } from "@/lib/contract/eip712";
import { monadTestnet } from "viem/chains";
import {
  getMerchantByHandle,
  productMetadataHash,
  resolveSimulatorProduct,
  storeMerchantId,
} from "@/lib/simulator/catalog";
import { SellerActionError } from "@/lib/sellers/sellerActions";
import { getWalletByAddress, loadAccount } from "@/lib/sellers/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isRelayerConfigured) return fail("El relayer no está configurado.", 503);
  if (!isSellerCustodyConfigured) {
    return fail("La custodia de tiendas no está configurada.", 503);
  }
  if (!CONTRACT_ADDRESS) return fail("No hay contrato configurado.", 503);

  if (!checkIpLimit(getClientIp(req)).ok) {
    return fail("Demasiadas solicitudes.", 429);
  }

  let body: {
    sellerAddress?: string;
    productId?: string;
    token?: string;
    buyer?: string;
    nonce?: string;
  };
  try {
    body = await req.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const { sellerAddress, productId, token, buyer, nonce } = body;
  if (!sellerAddress || !productId || !token || !buyer || !nonce) {
    return fail("Faltan datos para simular la venta.", 400);
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(sellerAddress)) {
    return fail("Tienda inválida.", 400);
  }
  if (!/^[0-9a-f]{64}$/.test(token)) return fail("Token inválido.", 400);
  if (!/^\d+$/.test(nonce)) return fail("Nonce inválido.", 400);

  try {
    const wallet = await getWalletByAddress(sellerAddress);
    if (!wallet) {
      return fail("Tienda no encontrada.", 404);
    }
    if (wallet.userId.startsWith("simulator:")) {
      return fail("Solo tiendas registradas en el panel.", 403);
    }
    if (!wallet.registeredOnChain) {
      return fail("La tienda aún no completó el registro.", 409);
    }

    const catalogMerchant = getMerchantByHandle(wallet.handle);
    const merchantId = catalogMerchant?.id ?? storeMerchantId(wallet.address);
    const product = resolveSimulatorProduct(productId, merchantId, wallet.handle);
    if (!product || product.merchantId !== merchantId) {
      return fail("Producto no válido para esta tienda.", 400);
    }

    const account = await loadAccount(wallet.userId, wallet.address);
    const metadataHash = productMetadataHash(product);
    const amount = String(product.priceArs);
    const payload = { buyer: buyer as `0x${string}`, amount, metadataHash };
    const nonceBig = BigInt(nonce);

    const typed = buildSignTypedDataArgs(
      "createOrder",
      payload,
      nonceBig,
      CONTRACT_ADDRESS,
      monadTestnet.id
    );

    const signature = await account.signTypedData({
      domain: typed.domain,
      types: typed.types as Record<string, readonly { name: string; type: string }[]>,
      primaryType: typed.primaryType,
      message: typed.message,
    } as Parameters<typeof account.signTypedData>[0]);

    return ok({
      signature,
      payload,
      seller: wallet.address,
      metadataHash,
      amount,
    });
  } catch (err) {
    if (err instanceof SellerActionError) return fail(err.message, err.status);
    const e = err as Error;
    return fail(e.message || "No se pudo registrar la venta.", 500);
  }
}
