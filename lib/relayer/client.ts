import "server-only";

import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
  recoverTypedDataAddress,
  type Abi,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";
import { ORBITRUST_ABI, CONTRACT_ADDRESS } from "@/lib/contract/config";
import {
  SPONSORED_ACTIONS,
  buildContractArgs,
  buildSignTypedDataArgs,
  type AnySponsoredPayload,
  type SponsoredActionId,
} from "@/lib/contract/eip712";
import {
  RELAYER_PRIVATE_KEY,
  MONAD_RPC_URL,
  isRelayerConfigured,
} from "@/lib/server/env";

const ABI = ORBITRUST_ABI as unknown as Abi;

type Relayer = {
  address: `0x${string}`;
  publicClient: PublicClient;
  walletClient: WalletClient;
};

let cached: Relayer | null = null;

export class RelayerError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "RelayerError";
    this.status = status;
  }
}

function getRelayer(): Relayer {
  if (!isRelayerConfigured || !RELAYER_PRIVATE_KEY) {
    throw new RelayerError(
      "El relayer no está configurado (faltan RELAYER_PRIVATE_KEY u ORDER_TOKEN_SECRET).",
      503
    );
  }
  if (!CONTRACT_ADDRESS) {
    throw new RelayerError("No hay contrato OrbiTrust configurado.", 503);
  }
  if (cached) return cached;

  const account = privateKeyToAccount(RELAYER_PRIVATE_KEY);
  const transport = http(MONAD_RPC_URL);
  cached = {
    address: account.address,
    publicClient: createPublicClient({ chain: monadTestnet, transport }),
    walletClient: createWalletClient({ account, chain: monadTestnet, transport }),
  };
  return cached;
}

export function getRelayerAddress(): `0x${string}` | null {
  if (!isRelayerConfigured || !RELAYER_PRIVATE_KEY) return null;
  try {
    return privateKeyToAccount(RELAYER_PRIVATE_KEY).address;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function readNonce(actor: `0x${string}`): Promise<bigint> {
  const { publicClient } = getRelayer();
  return (await publicClient.readContract({
    address: CONTRACT_ADDRESS!,
    abi: ABI,
    functionName: "nonces",
    args: [actor],
  })) as bigint;
}

type OnchainSeller = {
  owner: `0x${string}`;
  handle: string;
  metadataURI: string;
  completedSales: bigint;
  reviewsCount: bigint;
  ratingSum: bigint;
  exists: boolean;
};

export async function readSeller(address: `0x${string}`): Promise<OnchainSeller> {
  const { publicClient } = getRelayer();
  return (await publicClient.readContract({
    address: CONTRACT_ADDRESS!,
    abi: ABI,
    functionName: "getSeller",
    args: [address],
  })) as OnchainSeller;
}

type OnchainOrder = {
  id: bigint;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  amount: bigint;
  metadataHash: string;
  status: number;
  reviewed: boolean;
  createdAt: bigint;
};

export async function readOrder(orderId: bigint): Promise<OnchainOrder> {
  const { publicClient } = getRelayer();
  return (await publicClient.readContract({
    address: CONTRACT_ADDRESS!,
    abi: ABI,
    functionName: "getOrder",
    args: [orderId],
  })) as OnchainOrder;
}

export async function readNextOrderId(): Promise<bigint> {
  const { publicClient } = getRelayer();
  return (await publicClient.readContract({
    address: CONTRACT_ADDRESS!,
    abi: ABI,
    functionName: "nextOrderId",
  })) as bigint;
}

// ---------------------------------------------------------------------------
// Off-chain signature recovery (defensive validation before paying gas)
// ---------------------------------------------------------------------------

export async function recoverSponsoredSigner(
  action: SponsoredActionId,
  payload: AnySponsoredPayload,
  nonce: bigint,
  signature: Hex
): Promise<`0x${string}`> {
  const { domain, types, primaryType, message } = buildSignTypedDataArgs(
    action,
    payload as never,
    nonce,
    CONTRACT_ADDRESS!,
    monadTestnet.id
  );
  return recoverTypedDataAddress({
    domain,
    types,
    primaryType,
    message,
    signature,
  } as Parameters<typeof recoverTypedDataAddress>[0]);
}

// ---------------------------------------------------------------------------
// Sponsored submission (serialized to avoid relayer nonce collisions)
// ---------------------------------------------------------------------------

let submitQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = submitQueue.then(task, task);
  // Keep the chain alive even if a task rejects.
  submitQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export type RelayResult = {
  hash: `0x${string}`;
  blockNumber: bigint;
  /** Present for createOrder. */
  orderId?: bigint;
  relayer: `0x${string}`;
};

export async function relaySponsored(
  action: SponsoredActionId,
  payload: AnySponsoredPayload,
  nonce: bigint,
  signature: Hex
): Promise<RelayResult> {
  const relayer = getRelayer();
  const functionName = SPONSORED_ACTIONS[action].functionName;
  const args = buildContractArgs(action, payload as never, nonce, signature);

  return enqueue(async () => {
    const hash = await relayer.walletClient.writeContract({
      address: CONTRACT_ADDRESS!,
      abi: ABI,
      functionName,
      args: args as unknown[],
      account: relayer.walletClient.account!,
      chain: monadTestnet,
    });

    const receipt = await relayer.publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      throw new RelayerError("La transacción patrocinada falló on-chain.", 502);
    }

    let orderId: bigint | undefined;
    if (action === "createOrder") {
      const events = parseEventLogs({
        abi: ABI,
        logs: receipt.logs,
        eventName: "OrderCreated",
      }) as unknown as { args: { orderId: bigint } }[];
      orderId = events[0]?.args?.orderId;
    }

    return {
      hash,
      blockNumber: receipt.blockNumber,
      orderId,
      relayer: relayer.address,
    };
  });
}
