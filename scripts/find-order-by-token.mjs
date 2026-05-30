import { createHmac } from "node:crypto";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const secret = env.match(/ORDER_TOKEN_SECRET=(.+)/)?.[1]?.trim();
const contract =
  env.match(/NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS=(.+)/)?.[1]?.trim() ||
  "0x34C02DCcC46A681bA78Cf8c02E3216FF6d298a8a";

const token = process.argv[2];
if (!token) {
  console.error("usage: node scripts/find-order-by-token.mjs <token>");
  process.exit(1);
}

function deriveBuyer() {
  for (let counter = 0; counter < 1000; counter++) {
    const hex = createHmac("sha256", secret)
      .update(`orbitrust:buyer:${token}:${counter}`)
      .digest("hex");
    try {
      return privateKeyToAccount(`0x${hex}`).address;
    } catch {
      /* skip */
    }
  }
  throw new Error("no buyer");
}

const buyer = deriveBuyer();
console.log("derived buyer", buyer);

const abi = [
  {
    type: "function",
    name: "getOrder",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "buyer", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "metadataHash", type: "string" },
          { name: "status", type: "uint8" },
          { name: "reviewed", type: "bool" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
  },
];

const client = createPublicClient({
  chain: monadTestnet,
  transport: http("https://testnet-rpc.monad.xyz"),
});

for (let id = 0; id < 20; id++) {
  try {
    const o = await client.readContract({
      address: contract,
      abi,
      functionName: "getOrder",
      args: [BigInt(id)],
    });
    if (o.buyer.toLowerCase() === buyer.toLowerCase()) {
      console.log("MATCH orderId", id, {
        seller: o.seller,
        amount: o.amount.toString(),
        status: o.status,
        reviewed: o.reviewed,
        metadataHash: o.metadataHash,
      });
    }
  } catch {
    /* missing */
  }
}
