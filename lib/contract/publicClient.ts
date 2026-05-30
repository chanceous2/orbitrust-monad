import { createPublicClient, http, type Abi } from "viem";
import { monadTestnet } from "viem/chains";
import { ORBITRUST_ABI, CONTRACT_ADDRESS } from "./config";

const rpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL;

/** Read-only viem client for public reads (nonces, etc.) from the browser. */
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(rpcUrl && rpcUrl.length > 0 ? rpcUrl : undefined),
});

/** Current signature nonce for an actor. Throws if no contract is configured. */
export async function readSignatureNonce(actor: `0x${string}`): Promise<bigint> {
  if (!CONTRACT_ADDRESS) throw new Error("No contract configured");
  return (await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ORBITRUST_ABI as unknown as Abi,
    functionName: "nonces",
    args: [actor],
  })) as bigint;
}
