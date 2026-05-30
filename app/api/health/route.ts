import { ok } from "@/lib/server/http";
import { getRelayerAddress } from "@/lib/relayer/client";
import {
  isRelayerConfigured,
  relayerConfigIssue,
  SPONSORED_TX_DAILY_LIMIT,
} from "@/lib/server/env";
import { CONTRACT_ADDRESS, MONAD_TESTNET_CHAIN_ID } from "@/lib/contract/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    relayerConfigured: isRelayerConfigured,
    relayerAddress: getRelayerAddress(),
    relayerIssue: relayerConfigIssue(),
    contract: CONTRACT_ADDRESS ?? null,
    chainId: MONAD_TESTNET_CHAIN_ID,
    dailyLimit: SPONSORED_TX_DAILY_LIMIT,
  });
}
