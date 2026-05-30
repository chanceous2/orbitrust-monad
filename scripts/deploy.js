const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { exportAbi } = require("./export-abi.js");

async function main() {
  const { ethers, network } = hre;

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  if (!deployer) {
    throw new Error(
      "No deployer account found. Set PRIVATE_KEY in your .env before deploying."
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("----------------------------------------------------");
  console.log("Network:   ", network.name, `(chainId ${network.config.chainId ?? "?"})`);
  console.log("Deployer:  ", deployer.address);
  console.log("Balance:   ", ethers.formatEther(balance), "MON");
  console.log("----------------------------------------------------");

  console.log("Deploying OrbiTrustRegistry...");
  const Factory = await ethers.getContractFactory("OrbiTrustRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("");
  console.log("OrbiTrustRegistry deployed at:", address);

  // Persist deployment metadata so the frontend works even without env vars.
  const deployment = {
    address,
    chainId: network.config.chainId ?? null,
    network: network.name,
    deployedAt: new Date().toISOString(),
  };
  const outDir = path.join(__dirname, "..", "lib", "contract");
  fs.mkdirSync(outDir, { recursive: true });
  const deploymentPath = path.join(outDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2) + "\n");
  console.log("Wrote:    ", path.relative(process.cwd(), deploymentPath));

  // Keep the frontend ABI in sync with the freshly compiled contract.
  try {
    exportAbi();
  } catch (err) {
    console.warn("[deploy] Could not export ABI automatically:", err.message);
  }

  console.log("");
  console.log("Next steps:");
  console.log(`  - Set NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS=${address} in .env (optional; deployment.json is the fallback).`);
  console.log("  - Run `npm run dev` and open http://localhost:3000");
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log(`  - Explorer: https://testnet.monadexplorer.com/address/${address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
