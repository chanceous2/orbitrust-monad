import { fail, ok } from "@/lib/server/http";
import { isRelayerConfigured, isSellerCustodyConfigured } from "@/lib/server/env";
import { listRealStoreMerchants } from "@/lib/simulator/merchants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isRelayerConfigured) {
    return fail("El servicio de registro no está disponible.", 503);
  }
  if (!isSellerCustodyConfigured) {
    return fail("El servicio de tiendas no está disponible.", 503);
  }

  try {
    const catalog = await listRealStoreMerchants();
    return ok(catalog);
  } catch (err) {
    const e = err as Error;
    return fail(e.message || "No se pudo cargar tiendas.", 500);
  }
}
