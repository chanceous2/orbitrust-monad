import { fail, isAddress, ok } from "@/lib/server/http";
import { getTenant, usageFor, currentMonth } from "@/lib/tenant/store";
import { DEFAULT_PLAN, PLANS, getPlanInfo } from "@/lib/tenant/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { address: string } }) {
  const address = params.address;
  if (!isAddress(address)) return fail("Dirección inválida.", 400);

  const tenant = await getTenant(address);

  if (!tenant) {
    const info = getPlanInfo(DEFAULT_PLAN);
    return ok({
      provisioned: false,
      plan: DEFAULT_PLAN,
      planInfo: info,
      usage: {
        month: currentMonth(),
        orders: 0,
        limit: info.monthlyOrderLimit,
        remaining: info.monthlyOrderLimit,
      },
      plans: PLANS,
    });
  }

  return ok({
    provisioned: true,
    plan: tenant.plan,
    planInfo: getPlanInfo(tenant.plan),
    handle: tenant.handle ?? null,
    usage: usageFor(tenant),
    plans: PLANS,
  });
}
