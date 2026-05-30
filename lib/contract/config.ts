import deployment from "./deployment.json";
import { orbiTrustAbi } from "./abi";

export const ORBITRUST_ABI = orbiTrustAbi;

export const MONAD_TESTNET_CHAIN_ID = 10143 as const;

function normalizeAddress(value?: string | null): `0x${string}` | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return undefined;
  return trimmed as `0x${string}`;
}

/**
 * Contract address resolution order:
 *  1. NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS env var
 *  2. lib/contract/deployment.json written by the deploy script
 */
export const CONTRACT_ADDRESS: `0x${string}` | undefined =
  normalizeAddress(process.env.NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS) ??
  normalizeAddress(deployment.address);

export const IS_CONTRACT_CONFIGURED = Boolean(CONTRACT_ADDRESS);

export const EXPLORER_BASE_URL = "https://testnet.monadexplorer.com";

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_BASE_URL}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_BASE_URL}/address/${address}`;
}
