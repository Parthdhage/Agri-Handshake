const fs = require('fs');
const path = require('path');

async function main() {
  // Deploy a dummy contract first to "burn" the default first address
  // (0x5FbDB...) which MetaMask/Blockaid flags as malicious
  const Dummy = await ethers.getContractFactory("AgriEscrow");
  const dummy = await Dummy.deploy();
  await dummy.waitForDeployment();
  console.log("⏩ Dummy deployed (skipped):", await dummy.getAddress());

  // Now deploy the real contract — gets a clean, unflagged address
  const AgriEscrow = await ethers.getContractFactory("AgriEscrow");
  const contract = await AgriEscrow.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("🚜 AgriEscrow deployed to:", addr);

  // === Auto-update frontend constants ===
  const contractJsPath = path.join(__dirname, '..', 'frontend', 'src', 'constants', 'contract.js');
  if (fs.existsSync(contractJsPath)) {
    let content = fs.readFileSync(contractJsPath, 'utf8');
    content = content.replace(
      /export const CONTRACT_ADDRESS = "0x[0-9a-fA-F]+"/,
      `export const CONTRACT_ADDRESS = "${addr}"`
    );
    fs.writeFileSync(contractJsPath, content);
    console.log("✅ Updated frontend/src/constants/contract.js");
  }

  // === Auto-create/update backend .env ===
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  const envContent = `PORT=5000\nCONTRACT_ADDRESS=${addr}\n`;
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, 'utf8');
    if (env.includes('CONTRACT_ADDRESS=')) {
      env = env.replace(
        /CONTRACT_ADDRESS=0x[0-9a-fA-F]*/,
        `CONTRACT_ADDRESS=${addr}`
      );
    } else {
      env += `\nCONTRACT_ADDRESS=${addr}\n`;
    }
    fs.writeFileSync(envPath, env);
  } else {
    fs.writeFileSync(envPath, envContent);
  }
  console.log("✅ Updated backend/.env");

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Deployment complete!");
  console.log("   Contract Address:", addr);
  console.log("   Network: localhost (Chain ID: 31337)");
  console.log("=".repeat(50));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
