import { fail, getClientIp, ok } from "@/lib/server/http";
import { getSessionUser } from "@/lib/auth/session";
import { checkIpLimit } from "@/lib/server/rateLimit";
import { getWalletByAddress } from "@/lib/sellers/store";
import { setActiveStoreAddress } from "@/lib/users/onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return fail("No autenticado.", 401);

  if (!checkIpLimit(getClientIp(req)).ok) {
    return fail("Demasiadas solicitudes.", 429);
  }

  let body: { address?: string };
  try {
    body = await req.json();
  } catch {
    return fail("JSON inválido.", 400);
  }

  const address = body.address?.trim().toLowerCase();
  if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
    return fail("Elegí una tienda válida.", 400);
  }

  const wallet = await getWalletByAddress(address);
  if (!wallet || wallet.userId !== user.id) {
    return fail("Esa tienda no pertenece a tu cuenta.", 403);
  }

  await setActiveStoreAddress(user.id, wallet.address);

  return ok({
    activeStoreAddress: wallet.address,
    handle: wallet.handle,
  });
}
