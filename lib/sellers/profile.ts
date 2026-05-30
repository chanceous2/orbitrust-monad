import {
  listWalletsByUserId,
  resolveActiveWallet,
  toStoreView,
  type SellerStoreView,
} from "@/lib/sellers/store";
import { getUserOnboardingFields } from "@/lib/users/onboarding";
import { syncRegisteredStoresForUser } from "@/lib/sellers/sellerActions";
import { DEFAULT_PLAN, getPlanInfo, PLANS } from "@/lib/tenant/plans";
import { getTenant, usageFor, currentMonth } from "@/lib/tenant/store";

export type SellerMeResponse = {
  email: string;
  onboardingComplete: boolean;
  stores: SellerStoreView[];
  sellerAddress: `0x${string}` | null;
  handle: string | null;
  tenant: unknown;
};

export async function buildSellerProfile(user: {
  id: string;
  email: string;
  activeStoreAddress?: string | null;
}): Promise<SellerMeResponse> {
  const onboarding = await getUserOnboardingFields(user.id);
  await syncRegisteredStoresForUser(user.id);
  const wallets = await listWalletsByUserId(user.id);
  const stores = wallets.map(toStoreView);
  const active =
    (await resolveActiveWallet(user.id, user.activeStoreAddress ?? onboarding.activeStoreAddress)) ??
    null;

  let tenantView;
  if (active?.registeredOnChain) {
    const tenant = await getTenant(active.address);
    if (tenant) {
      tenantView = {
        provisioned: true,
        plan: tenant.plan,
        planInfo: getPlanInfo(tenant.plan),
        handle: tenant.handle ?? active.handle,
        usage: usageFor(tenant),
        plans: PLANS,
      };
    }
  }

  if (!tenantView) {
    const info = getPlanInfo(DEFAULT_PLAN);
    tenantView = {
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
    };
  }

  return {
    email: user.email,
    onboardingComplete: onboarding.onboardingComplete,
    stores,
    sellerAddress: active?.address ?? null,
    handle: active?.handle ?? null,
    tenant: tenantView,
  };
}
