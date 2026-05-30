import { ok } from "@/lib/server/http";
import { getRelayerAddress } from "@/lib/relayer/client";
import {
  isRelayerConfigured,
  relayerConfigIssue,
  SPONSORED_TX_DAILY_LIMIT,
} from "@/lib/server/env";
import { CONTRACT_ADDRESS, MONAD_TESTNET_CHAIN_ID } from "@/lib/contract/config";
import { db, ensureMongoConnected } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUILD_MARKER = "orders-mongo-v3";

async function mongoStatus() {
  try {
    await ensureMongoConnected();
    const dbName = db.databaseName;
    const orderLinks = await db.collection("order_magic_links").countDocuments();
    return { connected: true, dbName, orderLinks, error: null as string | null };
  } catch (err) {
    return {
      connected: false,
      dbName: null,
      orderLinks: null,
      error: (err as Error).message?.slice(0, 160) ?? "unknown",
    };
  }
}

export async function GET() {
  return ok({
    build: BUILD_MARKER,
    relayerConfigured: isRelayerConfigured,
    relayerAddress: getRelayerAddress(),
    relayerIssue: relayerConfigIssue(),
    contract: CONTRACT_ADDRESS ?? null,
    chainId: MONAD_TESTNET_CHAIN_ID,
    dailyLimit: SPONSORED_TX_DAILY_LIMIT,
    mongo: await mongoStatus(),
  });
}
