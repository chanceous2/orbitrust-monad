import { fail } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manual order creation from the merchant dashboard was removed.
 * TrustOrders are created only via the integration API:
 *   POST /api/orders/prepare → POST /api/orders
 */
export async function POST() {
  return fail(
    "La creación manual de órdenes está deshabilitada. Usá la API de integración (POST /api/orders/prepare + POST /api/orders).",
    403,
    {
      docs: {
        prepare: "POST /api/orders/prepare { seller }",
        create: "POST /api/orders { token, payload, nonce, signature }",
        review: "POST /api/orders/:token/review { rating, text }",
      },
    }
  );
}
