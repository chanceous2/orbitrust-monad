"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useSignTypedData,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ORBITRUST_ABI, CONTRACT_ADDRESS } from "@/lib/contract/config";
import type { OrderData, SellerData } from "@/lib/orbitrust";
import {
  buildSellerTypedData,
  fetchHealth,
  fetchTenant,
  postRelay,
  readSignatureNonce,
  type HealthView,
  type RelaySuccess,
  type TenantView,
} from "@/lib/sponsored/client";
import type { SponsoredActionId, SponsoredPayloads } from "@/lib/contract/eip712";
import { readableError } from "@/lib/errors";

const baseEnabled = Boolean(CONTRACT_ADDRESS);

/** Seller actions that flow through the generic /api/relay endpoint. */
type SellerRelayAction = "registerSeller" | "markFulfilled" | "cancelOrder";

export function useSeller(address?: `0x${string}`) {
  const query = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORBITRUST_ABI,
    functionName: "getSeller",
    args: address ? [address] : undefined,
    query: { enabled: baseEnabled && Boolean(address) },
  });
  return { ...query, seller: query.data as SellerData | undefined };
}

export function useTrustScore(address?: `0x${string}`) {
  const query = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORBITRUST_ABI,
    functionName: "getTrustScore",
    args: address ? [address] : undefined,
    query: { enabled: baseEnabled && Boolean(address) },
  });
  return { ...query, trustScore: query.data as bigint | undefined };
}

export function useAverageRating(address?: `0x${string}`) {
  const query = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORBITRUST_ABI,
    functionName: "getAverageRating",
    args: address ? [address] : undefined,
    query: { enabled: baseEnabled && Boolean(address) },
  });
  return { ...query, averageRating: query.data as bigint | undefined };
}

export function useSellerOrderIds(address?: `0x${string}`) {
  const query = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORBITRUST_ABI,
    functionName: "getSellerOrderIds",
    args: address ? [address] : undefined,
    query: { enabled: baseEnabled && Boolean(address) },
  });
  return { ...query, orderIds: query.data as readonly bigint[] | undefined };
}

export function useOrder(orderId?: bigint) {
  const query = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ORBITRUST_ABI,
    functionName: "getOrder",
    args: orderId !== undefined ? [orderId] : undefined,
    query: { enabled: baseEnabled && orderId !== undefined },
  });
  return { ...query, order: query.data as OrderData | undefined };
}

/**
 * Wraps a single write + receipt wait so every action can show a tx hash and a
 * "Verified on Monad Testnet" badge once the receipt confirms.
 */
export function useTxAction() {
  const {
    writeContractAsync,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  return {
    writeContractAsync,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isBusy: isPending || isConfirming,
    error: writeError ?? receiptError ?? null,
    reset,
  };
}

/**
 * Sponsored seller action: the seller signs EIP-712 typed data with their
 * wallet (no gas), OrbiTrust's relayer submits and pays. Because the API waits
 * for the receipt, a resolved relay means the tx is already confirmed on Monad.
 */
export function useSponsoredTx() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [isSigning, setIsSigning] = useState(false);
  const [isRelaying, setIsRelaying] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsSigning(false);
    setIsRelaying(false);
    setHash(undefined);
    setIsConfirmed(false);
    setError(null);
  }, []);

  const send = useCallback(
    async <A extends SellerRelayAction>(
      action: A,
      payload: SponsoredPayloads[A]
    ): Promise<RelaySuccess | null> => {
      if (!address) {
        setError("Conectá tu wallet para firmar.");
        return null;
      }
      reset();
      try {
        setIsSigning(true);
        const nonce = await readSignatureNonce(address);
        const typed = buildSellerTypedData(action as SponsoredActionId, payload, nonce);
        const signature = await signTypedDataAsync(typed);
        setIsSigning(false);

        setIsRelaying(true);
        const res = await postRelay({
          action,
          payload: payload as Record<string, unknown>,
          nonce: nonce.toString(),
          signature,
        });
        setHash(res.hash);
        setIsConfirmed(true);
        return res;
      } catch (err) {
        setError(readableError(err) || (err as Error)?.message || "Error inesperado");
        return null;
      } finally {
        setIsSigning(false);
        setIsRelaying(false);
      }
    },
    [address, signTypedDataAsync, reset]
  );

  return {
    send,
    isSigning,
    isRelaying,
    isBusy: isSigning || isRelaying,
    hash,
    isConfirmed,
    error,
    reset,
  };
}

/** Tenant plan + monthly usage for the connected seller. */
export function useTenant(address?: `0x${string}`) {
  const [tenant, setTenant] = useState<TenantView | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(() => {
    if (!address) return;
    setIsLoading(true);
    fetchTenant(address)
      .then(setTenant)
      .catch(() => setTenant(null))
      .finally(() => setIsLoading(false));
  }, [address]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tenant, isLoading, refetch };
}

/** Relayer / sponsored-gas configuration health. */
export function useSponsorHealth() {
  const [health, setHealth] = useState<HealthView | null>(null);

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((h) => active && setHealth(h))
      .catch(() => active && setHealth(null));
    return () => {
      active = false;
    };
  }, []);

  return health;
}
