const { ethers } = require("hardhat");

async function main() {
  const UserReputation = await ethers.getContractFactory("UserReputation");
  const reputation = await UserReputation.deploy();

  await reputation.waitForDeployment();

  const NoShowDeposit = await ethers.getContractFactory("NoShowDeposit");
  const noShowDeposit = await NoShowDeposit.deploy(await reputation.getAddress());

  await noShowDeposit.waitForDeployment();

  const tx = await reputation.setAuthorizedUpdater(
    await noShowDeposit.getAddress(),
    true
  );
  await tx.wait();

  console.log("UserReputation deployed to:", await reputation.getAddress());
  console.log("NoShowDeposit deployed to:", await noShowDeposit.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
