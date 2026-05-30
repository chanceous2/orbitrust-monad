# Foundry Reference (greenfield only)

Use this only when the user asks for **new** Monad contracts outside the OrbiTrust Hardhat setup. The OrbiTrust repo itself stays on Hardhat.

## foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
evm_version = "prague"
solc_version = "0.8.28"
```

## Deploy script template

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import "forge-std/Script.sol";
import "../src/MyContract.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        MyContract contract = new MyContract();
        console.log("Contract deployed at:", address(contract));
        vm.stopBroadcast();
    }
}
```

Deploy:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

**Do not** hardcode addresses in `vm.startBroadcast(0x...)` — use `--private-key`.

## Foundry verification API

```bash
forge verify-contract <ADDR> src/MyContract.sol:MyContract \
  --chain 10143 \
  --show-standard-json-input > /tmp/standard-input.json

cat out/MyContract.sol/MyContract.json | jq '.metadata' > /tmp/metadata.json
COMPILER_VERSION=$(jq -r '.metadata | fromjson | .compiler.version' out/MyContract.sol/MyContract.json)

curl -X POST https://agents.devnads.com/v1/verify \
  -H "Content-Type: application/json" \
  -d "{
    \"chainId\": 10143,
    \"contractAddress\": \"<ADDR>\",
    \"contractName\": \"src/MyContract.sol:MyContract\",
    \"compilerVersion\": \"v${COMPILER_VERSION}\",
    \"standardJsonInput\": $(cat /tmp/standard-input.json),
    \"foundryMetadata\": $(cat /tmp/metadata.json)
  }"
```

## Foundry flags to avoid

- `--no-commit` is not valid for `forge init` or `forge install`
- Prefer `forge script` over `forge create --broadcast` (broadcast is unreliable)
