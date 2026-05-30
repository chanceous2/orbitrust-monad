import { fail, getClientIp, ok } from "@/lib/server/http";
import { getSessionUser } from "@/lib/auth/session";
import { checkIpLimit } from "@/lib/server/rateLimit";
import { resolveActiveWallet } from "@/lib/sellers/store";
import { syncRegisteredStoresForUser } from "@/lib/sellers/sellerActions";
import { markUserOnboardingComplete, setActiveStoreAddress } from "@/lib/users/onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return fail("No autenticado.", 401);

  if (!checkIpLimit(getClientIp(req)).ok) {
    return fail("Demasiadas solicitudes.", 429);
  }

  const registered = await syncRegisteredStoresForUser(user.id);
  if (registered.length === 0) {
    return fail("Creá al menos una tienda antes de continuar.", 400);
  }

  const active =
    (await resolveActiveWallet(user.id, user.activeStoreAddress)) ?? registered[0];

  await markUserOnboardingComplete(user.id, active.address);
  await setActiveStoreAddress(user.id, active.address);

  return ok({
    onboardingComplete: true,
    activeStoreAddress: active.address,
    redirectTo: "/dashboard",
  });
}
