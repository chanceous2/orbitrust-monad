"use client";

import { useCallback, useEffect, useState } from "react";
import type { TenantView } from "@/lib/sponsored/client";

export type SellerStore = {
  address: `0x${string}`;
  handle: string;
  registeredOnChain: boolean;
  createdAt: number;
};

export type SellerProfile = {
  email: string;
  sellerAddress: `0x${string}` | null;
  handle: string | null;
  onboardingComplete: boolean;
  stores: SellerStore[];
  tenant: TenantView;
};

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string };
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

export function useSellerSession(enabled = true) {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback((options?: { silent?: boolean }) => {
    if (!enabled) {
      setProfile(null);
      return Promise.resolve(null);
    }
    if (!options?.silent) setIsLoading(true);
    return fetch("/api/sellers/me", { cache: "no-store" })
      .then((res) => parse<SellerProfile>(res))
      .then((data) => {
        setProfile(data);
        setError(null);
        return data;
      })
      .catch((err) => {
        setProfile(null);
        setError((err as Error)?.message || "No se pudo cargar el perfil.");
        return null;
      })
      .finally(() => {
        if (!options?.silent) setIsLoading(false);
      });
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, isLoading, error, refetch };
}
