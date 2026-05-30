/**
 * End-to-end smoke test for the sponsored-gas flow against a running app.
 *
 * Usage: BASE_URL=http://localhost:3000 node scripts/smoke-sponsored.mjs
 */
import { createPublicClient, http } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { monadTestnet } from "viem/chains";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const RPC = process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

let CONTRACT = process.env.NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS || "";
let domain;

const TYPES = {
  RegisterSeller: [
    { name: "handle", type: "string" },
    { name: "metadataURI", type: "string" },
    { name: "nonce", type: "uint256" },
  ],
  CreateOrder: [
    { name: "buyer", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "metadataHash", type: "string" },
    { name: "nonce", type: "uint256" },
  ],
};

const READ_ABI = [
  { type: "function", name: "nonces", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "getSeller",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "handle", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "completedSales", type: "uint256" },
          { name: "reviewsCount", type: "uint256" },
          { name: "ratingSum", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
  },
];

const publicClient = createPublicClient({ chain: monadTestnet, transport: http(RPC) });

async function api(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(`POST ${path} -> ${res.status}: ${data.error || JSON.stringify(data)}`);
  }
  return data;
}

function nonceOf(addr) {
  return publicClient.readContract({ address: CONTRACT, abi: READ_ABI, functionName: "nonces", args: [addr] });
}

function sign(account, primaryType, message) {
  return account.signTypedData({ domain, types: { [primaryType]: TYPES[primaryType] }, primaryType, message });
}

async function main() {
  const health = await fetch(`${BASE_URL}/api/health`).then((r) => r.json());
  CONTRACT = (CONTRACT || health.contract).trim();
  domain = { name: "OrbiTrust", version: "1", chainId: 10143, verifyingContract: CONTRACT };
  console.log("Contract:", CONTRACT, "| Base:", BASE_URL);
  console.log("Relayer configured:", health.relayerConfigured, "| relayer:", health.relayerAddress);
  if (!health.relayerConfigured) throw new Error("Relayer not configured");

  const seller = privateKeyToAccount(generatePrivateKey());
  console.log("\nThrowaway seller:", seller.address, "(never funded)");

  let n = await nonceOf(seller.address);
  const handle = `smoke_${Date.now().toString().slice(-6)}`;
  let sig = await sign(seller, "RegisterSeller", { handle, metadataURI: "ipfs://demo", nonce: n });
  let r = await api("/api/relay", { action: "registerSeller", payload: { handle, metadataURI: "ipfs://demo" }, nonce: n.toString(), signature: sig });
  console.log("1) registerSeller ->", r.hash);

  const prep = await api("/api/orders/prepare", { seller: seller.address });
  const payload = { buyer: prep.buyer, amount: "15000", metadataHash: "demo:Campera negra talle M" };
  sig = await sign(seller, "CreateOrder", { buyer: payload.buyer, amount: 15000n, metadataHash: payload.metadataHash, nonce: BigInt(prep.nonce) });
  const created = await api("/api/orders", { token: prep.token, payload, nonce: prep.nonce, signature: sig });
  console.log("2) createOrder    -> orderId", created.orderId, "| link", created.reviewPath ?? created.confirmPath);

  r = await api(`/api/orders/${prep.token}/review`, { rating: 5, text: "Todo perfecto, llego rapido" });
  console.log("3) buyer review   ->", r.hash);

  const s = await publicClient.readContract({ address: CONTRACT, abi: READ_ABI, functionName: "getSeller", args: [seller.address] });
  console.log("\nOn-chain seller:", { handle: s.handle, completedSales: s.completedSales.toString(), reviewsCount: s.reviewsCount.toString(), ratingSum: s.ratingSum.toString() });
  if (s.completedSales !== 1n || s.reviewsCount !== 1n) throw new Error("Unexpected on-chain seller state");
  console.log("\n✅ Sponsored E2E OK — review closes the sale, buyer acted without a wallet.");
}

main().catch((e) => {
  console.error("\n❌ Smoke test failed:", e.message);
  process.exit(1);
});
