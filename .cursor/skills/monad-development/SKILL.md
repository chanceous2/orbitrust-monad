---
name: monad-development
description: >-
  Builds and deploys OrbiTrust on Monad Testnet. Use when working on
  OrbiTrustRegistry, Hardhat compile/test/deploy, wagmi/viem frontend hooks,
  contract verification, faucet funding, or Monad testnet/mainnet configuration.
license: MIT
compatibility: Requires Node 18+, npm, curl, and internet access for faucet and verification APIs
metadata:
  author: monad-skills
  version: "1.0.0"
  project: orbitrust
---

# Monad Development (OrbiTrust)

OrbiTrust is a portable trust profile for social-commerce sellers on Monad Testnet. This repo uses **Hardhat** for contracts and **Next.js + wagmi + viem** for the frontend.

For questions not covered here, fetch https://docs.monad.xyz/llms.txt

## Quick Reference

### Defaults
- **Network:** Always use **testnet** (chain ID `10143`) unless the user says "mainnet"
- **Verification:** Verify contracts after deployment unless the user says not to
- **Framework:** Use the existing **Hardhat** setup in this repo (do not migrate to Foundry unless asked)
- **Wallet:** If you generate a wallet, MUST persist it (see Wallet Persistence)
- **Contract:** `contracts/OrbiTrustRegistry.sol` — no constructor args on deploy

### Networks

| Network | Chain ID | RPC |
|---------|----------|-----|
| Testnet | 10143 | https://testnet-rpc.monad.xyz |
| Mainnet | 143 | https://rpc.monad.xyz |

Docs: https://docs.monad.xyz

### Explorers

| Explorer | Testnet | Mainnet |
|----------|---------|---------|
| Monad Explorer (used in app) | https://testnet.monadexplorer.com | — |
| Socialscan | https://monad-testnet.socialscan.io | https://monad.socialscan.io |
| MonadVision | https://testnet.monadvision.com | https://monadvision.com |
| Monadscan | https://testnet.monadscan.com | https://monadscan.com |

## Project Layout

```
contracts/OrbiTrustRegistry.sol   # trust registry smart contract
scripts/deploy.js                 # deploy + write lib/contract/deployment.json
scripts/export-abi.js             # ABI -> lib/contract/abi.ts
test/OrbiTrustRegistry.test.js    # Hardhat tests (20 cases)
lib/contract/                       # address resolution, ABI, explorer helpers
lib/wagmi.ts                      # wagmi config (monadTestnet from viem/chains)
lib/hooks.ts                      # wagmi read/write hooks for OrbiTrust
app/                              # /, /dashboard, /order/[id], /seller/[address], /simulador
```

### Contract address resolution

The frontend resolves the deployed address in this order (`lib/contract/config.ts`):

1. `NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS` in `.env`
2. `lib/contract/deployment.json` (written by `npm run deploy`)

If neither is set, the UI shows a config banner but still renders; use `/simulador` to exercise the API flow without a configured contract.

## Agent APIs

**IMPORTANT:** Do NOT use a browser. Use these APIs directly with curl.

### Faucet (Testnet Funding)

```bash
curl -X POST https://agents.devnads.com/v1/faucet \
  -H "Content-Type: application/json" \
  -d '{"chainId": 10143, "address": "0xYOUR_ADDRESS"}'
```

Returns: `{"txHash": "0x...", "amount": "1000000000000000000", "chain": "Monad Testnet"}`

**Fallback (official faucet):** https://faucet.monad.xyz  
If the agent faucet fails, ask the user to fund via the official faucet (do not use a browser yourself).

### Verification (All Explorers)

Prefer the verification API — it verifies on MonadVision, Socialscan, and Monadscan in one call.

**OrbiTrustRegistry (Hardhat, no constructor args):**

```bash
# 1. Compile so artifacts exist
npm run compile

# 2. Build standard JSON input from Hardhat build info
BUILD_INFO=$(ls -t artifacts/build-info/*.json | head -1)
STANDARD_INPUT=$(jq '.input' "$BUILD_INFO")
COMPILER_VERSION=$(jq -r '.solcVersion' "$BUILD_INFO")

# 3. Call verification API
cat > /tmp/verify-orbitrust.json << EOF
{
  "chainId": 10143,
  "contractAddress": "0xYOUR_CONTRACT_ADDRESS",
  "contractName": "contracts/OrbiTrustRegistry.sol:OrbiTrustRegistry",
  "compilerVersion": "v${COMPILER_VERSION}",
  "standardJsonInput": $STANDARD_INPUT
}
EOF

curl -X POST https://agents.devnads.com/v1/verify \
  -H "Content-Type: application/json" \
  -d @/tmp/verify-orbitrust.json
```

**With constructor arguments:** Add `constructorArgs` (ABI-encoded, WITHOUT `0x` prefix):

```bash
ARGS=$(cast abi-encode "constructor(uint256)" 1000000000000000000000000)
ARGS_NO_PREFIX=${ARGS#0x}
# Add to request: "constructorArgs": "$ARGS_NO_PREFIX"
```

Requires `cast` (Foundry) or equivalent ABI encoding for constructor args only.

**Hardhat fallback (if API fails):**

```bash
npx hardhat verify --network monadTestnet <CONTRACT_ADDRESS>
```

**Sourcify fallback:**

```bash
npx hardhat verify --network monadTestnet <CONTRACT_ADDRESS> \
  --verifier sourcify \
  --verifier-url "https://sourcify-api-monad.blockvision.org/"
```

## Wallet Persistence

**CRITICAL for agents:** If you generate a wallet, you MUST persist it for future use.

When generating a new wallet:

1. Create wallet: `cast wallet new` (or any secure generator)
2. **Immediately save** address and private key to `.env` as `PRIVATE_KEY=` (never commit)
3. Tell the user where credentials are stored
4. Fund via faucet before deploying

**Storage options:**

- Project `.env` (already gitignored)
- `~/.monad-wallet` with `chmod 600`
- Return credentials to the user and ask them to save securely

## Local Development

```bash
npm install
npm run compile    # hardhat compile + export ABI to lib/contract/abi.ts
npm test           # 20 Hardhat tests
npm run dev        # http://localhost:3000
```

Copy env template before deploy:

```bash
cp .env.example .env
# Set PRIVATE_KEY (testnet only), optionally NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS
```

### Environment variables

| Variable | Used by | Description |
| --- | --- | --- |
| `PRIVATE_KEY` | deploy | Testnet deployer key. **Never commit.** |
| `MONAD_RPC_URL` | deploy | Defaults to `https://testnet-rpc.monad.xyz` |
| `NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS` | frontend | Overrides `deployment.json` |
| `NEXT_PUBLIC_CHAIN_ID` | frontend | `10143` |
| `NEXT_PUBLIC_MONAD_RPC_URL` | frontend | Optional browser RPC override |

## Deploy Workflow

This project deploys with Hardhat, not Foundry:

```bash
npm run deploy
# equivalent: hardhat run scripts/deploy.js --network monadTestnet
```

The deploy script:

1. Deploys `OrbiTrustRegistry` (no constructor args)
2. Writes `lib/contract/deployment.json` with address, chainId, network, timestamp
3. Runs `export-abi.js` to refresh `lib/contract/abi.ts`

After deploy:

```bash
# Optional — deployment.json is enough for local dev
echo "NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS=0x..." >> .env

npm run dev
```

Then verify on explorers (see Verification section above).

## Contract Change Workflow

When editing `contracts/OrbiTrustRegistry.sol`:

1. `npm run compile` — refreshes artifacts and `lib/contract/abi.ts`
2. `npm test` — run the full test suite before deploy
3. `npm run deploy` — only when the user wants a new on-chain deployment
4. Update frontend hooks/components if function signatures or events changed

**Hardhat config** (`hardhat.config.js`): Solidity `0.8.24`, optimizer 200 runs, network `monadTestnet` on chain `10143`.

## Frontend

Import chain from `viem/chains` — do NOT define a custom chain:

```ts
import { monadTestnet } from "viem/chains";
```

Wagmi is already configured in `lib/wagmi.ts`:

```ts
import { createConfig, http } from "wagmi";
import { monadTestnet } from "viem/chains";

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL),
  },
});
```

Contract reads/writes go through `lib/hooks.ts` using `ORBITRUST_ABI` and `CONTRACT_ADDRESS` from `lib/contract/config.ts`. After ABI changes, regenerate via `npm run compile` — do not hand-edit `lib/contract/abi.ts`.

Explorer links use `EXPLORER_BASE_URL` (`https://testnet.monadexplorer.com`) and helpers `explorerTxUrl` / `explorerAddressUrl`.

## Technical Details

### EVM Version (Monad)

Monad targets the **Prague** EVM. New contracts or toolchain upgrades should use `evmVersion: "prague"` with Solidity `0.8.27+`. The current OrbiTrust config uses `0.8.24`; bump solc and set Prague when touching compiler settings.

### TrustOrder lifecycle (domain)

```
registerSeller → createOrder → leaveReview
```

`leaveReview` completes the sale (increments `completedSales`) when the order is still open. Receiving a review link implies the buyer got the product — no separate confirm or seller shipping step in the app flow. Legacy on-chain paths (`acceptOrder`, `markFulfilled`, `confirmReceived`) remain for backward compatibility.

Reviews only count when linked to a completed TrustOrder. Trust score V1: `completedSales * 10 + averageRating * 10`, capped at 100.

### Demo fallback

If RPC or wallet fails during a pitch, use `/simulador` for the integration demo with sample merchants and products.

## Foundry Reference (new greenfield contracts only)

If the user explicitly asks to scaffold **new** Monad contracts outside this Hardhat repo, use Foundry with `evm_version = "prague"` and deploy via `forge script` (not `forge create --broadcast`). See [reference.md](reference.md) for the upstream Foundry ERC20 template.
