"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import {
  useSeller,
  useTrustScore,
  useAverageRating,
  useSellerOrderIds,
} from "@/lib/hooks";
import { useSellerSession } from "@/lib/sellers/useSellerSession";
import { formatRating } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";
import { TrustScoreCard } from "@/components/TrustScoreCard";
import { PlanCard } from "@/components/PlanCard";
import { DashboardStoreHero } from "@/components/dashboard/DashboardStoreHero";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardConnections } from "@/components/dashboard/DashboardConnections";
import { DashboardSalesLedger } from "@/components/dashboard/DashboardSalesLedger";
import {
  DashboardGuestGate,
  DashboardGuestLoading,
} from "@/components/DashboardGuestGate";

export default function DashboardPage() {
  const router = useRouter();
  const mounted = useMounted();
  const { data: session, isPending: sessionPending } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const { profile, isLoading: profileLoading, refetch: refetchProfile } =
    useSellerSession(isLoggedIn);

  const sellerAddress = profile?.sellerAddress ?? undefined;
  const hasActiveStore = Boolean(
    sellerAddress && profile?.stores.some((s) => s.registeredOnChain)
  );
  const activeHandle = profile?.handle ?? profile?.stores.find((s) => s.registeredOnChain)?.handle;

  const { seller, refetch: refetchSeller } = useSeller(sellerAddress);
  const { trustScore, refetch: refetchScore } = useTrustScore(sellerAddress);
  const { refetch: refetchAvg } = useAverageRating(sellerAddress);
  const { orderIds, refetch: refetchOrders } = useSellerOrderIds(sellerAddress);

  useEffect(() => {
    if (!mounted || sessionPending || !isLoggedIn || profileLoading || !profile) return;
    if (!profile.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [mounted, sessionPending, isLoggedIn, profileLoading, profile, router]);

  function refetchAll() {
    refetchProfile();
    refetchSeller();
    refetchScore();
    refetchAvg();
    refetchOrders();
  }

  const orderList = orderIds ? [...orderIds].reverse() : [];
  const tenant = profile?.tenant ?? null;

  if (!mounted || sessionPending) {
    return <DashboardGuestLoading />;
  }

  if (!isLoggedIn) {
    return <DashboardGuestGate />;
  }

  if (profileLoading || !profile?.onboardingComplete) {
    return <DashboardGuestLoading />;
  }

  if (!hasActiveStore || !sellerAddress || !seller || !activeHandle) {
    return (
      <div className="container-app py-12 sm:py-16">
        <div className="mx-auto max-w-lg border border-line bg-surface p-8 text-center sm:p-10">
          <h1 className="font-display text-3xl text-ink">Completá tu tienda</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-2">
            Todavía no hay una tienda activa en tu cuenta. Terminá la configuración
            inicial para ver tu reputación acá.
          </p>
          <Link href="/onboarding" className="btn-primary btn-lg mt-8 inline-flex">
            Ir a configuración
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = formatRating(seller.ratingSum, seller.reviewsCount);
  const score = trustScore !== undefined ? Number(trustScore) : 0;

  return (
    <div className="container-app py-10 sm:py-14">
      <DashboardStoreHero
        handle={seller.handle || activeHandle}
        profileHref={`/seller/${sellerAddress}`}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <PlanCard tenant={tenant} loading={profileLoading} />
          <TrustScoreCard score={score} loading={trustScore === undefined} />
        </aside>

        <div className="min-w-0 space-y-12">
          <DashboardMetrics
            completedSales={seller.completedSales}
            reviewsCount={seller.reviewsCount}
            averageRating={averageRating}
            trustScore={score}
          />

          <DashboardConnections />

          <DashboardSalesLedger
            orderIds={orderList}
            sellerAddress={sellerAddress}
            onChanged={refetchAll}
          />
        </div>
      </div>
    </div>
  );
}
