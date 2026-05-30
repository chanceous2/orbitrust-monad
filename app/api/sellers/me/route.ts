import { fail, ok } from "@/lib/server/http";
import { getSessionUser } from "@/lib/auth/session";
import { buildSellerProfile } from "@/lib/sellers/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return fail("No autenticado.", 401);

  try {
    const profile = await buildSellerProfile(user);
    return ok(profile);
  } catch {
    return fail("No se pudo cargar tu perfil de vendedor.", 500);
  }
}
