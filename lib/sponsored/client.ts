import {
  buildSignTypedDataArgs,
  type SponsoredActionId,
  type SponsoredPayloads,
} from "@/lib/contract/eip712";
import { CONTRACT_ADDRESS } from "@/lib/contract/config";
import { readSignatureNonce } from "@/lib/contract/publicClient";
import type { PlanInfo, TenantPlan } from "@/lib/tenant/plans";

/**
 * Browser-side helpers for the sponsored-gas flow. These never touch secrets:
 * the seller signs typed data with their own wallet, the server (relayer) pays
 * gas. Buyers go through the magic-link endpoints instead.
 */

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string };
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

export function buildSellerTypedData<A extends SponsoredActionId>(
  action: A,
  payload: SponsoredPayloads[A],
  nonce: bigint
) {
  if (!CONTRACT_ADDRESS) throw new Error("No contract configured");
  return buildSignTypedDataArgs(action, payload, nonce, CONTRACT_ADDRESS);
}

export { readSignatureNonce };

export type RelaySuccess = {
  hash: `0x${string}`;
  explorerUrl: string;
  relayer: `0x${string}`;
};

export async function postRelay(input: {
  action: SponsoredActionId;
  payload: Record<string, unknown>;
  nonce: string;
  signature: `0x${string}`;
}): Promise<RelaySuccess> {
  const res = await fetch("/api/relay", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse<RelaySuccess>(res);
}

export type PreparedOrder = { token: string; buyer: `0x${string}`; nonce: string };

export async function prepareOrder(seller: `0x${string}`): Promise<PreparedOrder> {
  const res = await fetch("/api/orders/prepare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ seller }),
  });
  return parse<PreparedOrder>(res);
}

export type CreatedOrder = {
  orderId: number;
  token: string;
  confirmPath: string;
  hash: `0x${string}`;
  explorerUrl: string;
  relayer: `0x${string}`;
};

export async function postCreateOrder(input: {
  token: string;
  payload: SponsoredPayloads["createOrder"];
  nonce: string;
  signature: `0x${string}`;
}): Promise<CreatedOrder> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse<CreatedOrder>(res);
}

export type TenantView = {
  provisioned: boolean;
  plan: TenantPlan;
  planInfo: PlanInfo;
  handle?: string | null;
  usage: { month: string; orders: number; limit: number | null; remaining: number | null };
  plans: Record<TenantPlan, PlanInfo>;
};

export async function fetchTenant(address: `0x${string}`): Promise<TenantView> {
  const res = await fetch(`/api/tenant/${address}`, { cache: "no-store" });
  return parse<TenantView>(res);
}

export type HealthView = {
  relayerConfigured: boolean;
  relayerAddress: `0x${string}` | null;
  relayerIssue: string | null;
  contract: `0x${string}` | null;
  chainId: number;
  dailyLimit: number;
};

export async function fetchHealth(): Promise<HealthView> {
  const res = await fetch("/api/health", { cache: "no-store" });
  return parse<HealthView>(res);
}
