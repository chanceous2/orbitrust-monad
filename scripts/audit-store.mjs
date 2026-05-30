import { MongoClient } from "mongodb";
import { createPublicClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const env = readFileSync(join(root, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}
loadEnv();

const deployment = JSON.parse(readFileSync(join(root, "lib/contract/deployment.json"), "utf8"));
const { orbiTrustAbi: ABI } = await import(join(root, "lib/contract/abi.ts"));
const CONTRACT = process.env.NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS || deployment.address;
const EXPLORER = "https://testnet.monadexplorer.com";
const APP = process.env.BETTER_AUTH_URL || "http://localhost:3000";

const STATUS = ["created", "accepted", "fulfilled", "completed", "cancelled"];

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  const user = await db.collection("user").findOne({ email: "christopherchance67@gmail.com" });
  const wallet = await db.collection("seller_wallets").findOne({ userId: user._id.toString() });
  const mongoOrders = await db
    .collection("order_magic_links")
    .find({ tokenHash: { $exists: true } })
    .toArray();

  const seller = wallet.address.toLowerCase();
  const rpc = createPublicClient({
    chain: monadTestnet,
    transport: http(process.env.MONAD_RPC_URL),
  });

  const sellerOnChain = await rpc.readContract({
    address: CONTRACT,
    abi: ABI,
    functionName: "getSeller",
    args: [seller],
  });
  const nextId = await rpc.readContract({
    address: CONTRACT,
    abi: ABI,
    functionName: "nextOrderId",
  });

  const chainOrders = [];
  for (let i = 0n; i < nextId; i++) {
    const o = await rpc.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "getOrder",
      args: [i],
    });
    if (o.seller.toLowerCase() === seller) {
      chainOrders.push({ id: Number(i), ...o, statusName: STATUS[Number(o.status)] });
    }
  }

  const report = {
    contract: CONTRACT,
    contractExplorer: `${EXPLORER}/address/${CONTRACT}`,
    user: {
      mongoId: user._id.toString(),
      email: user.email,
      activeStoreAddress: user.activeStoreAddress,
    },
    store: {
      mongoCollection: "seller_wallets",
      handle: wallet.handle,
      address: wallet.address,
      registeredOnChain: wallet.registeredOnChain,
      createdAt: new Date(wallet.createdAt).toISOString(),
      profileUrl: `${APP}/seller/${wallet.address}`,
      chainSeller: {
        handle: sellerOnChain.handle,
        completedSales: sellerOnChain.completedSales.toString(),
        reviewsCount: sellerOnChain.reviewsCount.toString(),
        ratingSum: sellerOnChain.ratingSum.toString(),
        exists: sellerOnChain.exists,
      },
      sellerExplorer: `${EXPLORER}/address/${wallet.address}`,
    },
    orders: [],
  };

  for (const mo of mongoOrders.filter((o) => o.seller.toLowerCase() === seller)) {
    const co = chainOrders.find((c) => c.id === mo.orderId);
    const reviewTx = mo.actions?.review?.txHash;
    report.orders.push({
      label: mo.description,
      mongo: {
        collection: "order_magic_links",
        tokenHash: mo.tokenHash,
        orderId: mo.orderId,
        seller: mo.seller,
        buyer: mo.buyer,
        amount: mo.amount,
        metadataHash: mo.metadataHash,
        status: mo.status,
        reviewed: mo.reviewed,
        actions: mo.actions,
        createdAt: new Date(mo.createdAt).toISOString(),
        expiresAt: new Date(mo.expiresAt).toISOString(),
      },
      chain: co
        ? {
            orderId: co.id,
            buyer: co.buyer,
            amount: co.amount.toString(),
            metadataHash: co.metadataHash,
            status: co.statusName,
            reviewed: co.reviewed,
            createdAt: co.createdAt.toString(),
            matchMongo: co.buyer.toLowerCase() === mo.buyer.toLowerCase() && co.reviewed === mo.reviewed,
          }
        : null,
      links: {
        orderPage: `${APP}/order/${mo.orderId}`,
        reviewNote: "El token del magic link NO se guarda en Mongo (solo tokenHash). Sin el token original no se puede reconstruir /review/{token}.",
        reviewTx: reviewTx ? `${EXPLORER}/tx/${reviewTx}` : null,
      },
    });
  }

  console.log(JSON.stringify(report, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2));
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
