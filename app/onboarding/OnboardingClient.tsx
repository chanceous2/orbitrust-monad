"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { useSellerSession } from "@/lib/sellers/useSellerSession";
import { useMounted } from "@/lib/useMounted";
import { OnboardingShell, type OnboardingStepId } from "@/components/onboarding/OnboardingShell";
import {
  OnboardingStoresStep,
  OnboardingIntegrationsStep,
} from "@/components/onboarding/OnboardingSteps";
import { DashboardGuestLoading } from "@/components/DashboardGuestGate";

export default function OnboardingClient() {
  const router = useRouter();
  const mounted = useMounted();
  const { data: session, isPending: sessionPending } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const { profile, isLoading: profileLoading, refetch } = useSellerSession(isLoggedIn);

  const [step, setStep] = useState<OnboardingStepId>("stores");
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (!mounted || sessionPending) return;
    if (!isLoggedIn) {
      router.replace("/login?mode=signup");
      return;
    }
    if (profile?.onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [mounted, sessionPending, isLoggedIn, profile?.onboardingComplete, router]);

  const hasRegisteredStore =
    profile?.stores.some((store) => store.registeredOnChain) ?? false;

  const goToIntegrations = useCallback(() => {
    if (!hasRegisteredStore) return;
    setStep("integrations");
  }, [hasRegisteredStore]);

  const goToStores = useCallback(() => {
    setStep("stores");
  }, []);

  const handleStoreCreated = useCallback(() => {
    void refetch({ silent: true }).then((data) => {
      if (data?.stores.some((store) => store.registeredOnChain)) {
        setStep("integrations");
      }
    });
  }, [refetch]);

  useEffect(() => {
    if (step === "integrations" && profile && !profile.stores.some((s) => s.registeredOnChain)) {
      setStep("stores");
    }
  }, [step, profile]);

  const finishOnboarding = useCallback(async () => {
    setFinishing(true);
    setFinishError(null);
    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string; redirectTo?: string };
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "No se pudo completar el onboarding.");
      }
      await refetch({ silent: true });
      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (err) {
      setFinishError((err as Error).message);
    } finally {
      setFinishing(false);
    }
  }, [router, refetch]);

  if (!mounted || sessionPending || profileLoading || !profile) {
    return <DashboardGuestLoading />;
  }

  if (!isLoggedIn || profile.onboardingComplete) {
    return <DashboardGuestLoading />;
  }

  return (
    <OnboardingShell step={step}>
      {step === "stores" ? (
        <OnboardingStoresStep
          stores={profile.stores}
          onStoreCreated={handleStoreCreated}
          onContinue={goToIntegrations}
        />
      ) : (
        <>
          <OnboardingIntegrationsStep
            onFinish={finishOnboarding}
            onBack={goToStores}
            finishing={finishing}
          />
          {finishError ? (
            <p className="mx-auto mt-4 max-w-4xl text-center text-sm text-danger-ink">
              {finishError}
            </p>
          ) : null}
        </>
      )}
    </OnboardingShell>
  );
}
