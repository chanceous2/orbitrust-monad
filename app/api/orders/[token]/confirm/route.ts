import { fail } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** @deprecated Usá POST /api/orders/:token/review — la reseña cierra la venta. */
export async function POST(_req: Request, { params }: { params: { token: string } }) {
  return fail(
    "Este paso ya no existe. Usá el link de reseña para cerrar la compra.",
    410,
    { reviewPath: `/review/${params.token}` }
  );
}
