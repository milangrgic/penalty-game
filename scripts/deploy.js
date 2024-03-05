// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { writeFileSync } = require("fs");
const {ethers} = require("hardhat");

async function main() {

  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy("Community Token", "COM");

  console.log("Token contract successfully deployed to: ", token.target);

  const Pool = await ethers.getContractFactory("PoolContract");
  const pool = await Pool.deploy(token.target);

  console.log("Pool contract successfully deployed to: ", pool.target);

  const Community = await ethers.getContractFactory("CommunityContract");
  const community = await Community.deploy(token.target, pool.target);

  console.log("Community contract successfully deployed to: ", community.target);
  
  await pool.setCommunity(community.target);

  const deployedData = {
    token: token.target,
    pool: pool.target,
    community: community.target
  };

  writeFileSync('./app/src/static/contracts.json', JSON.stringify(deployedData, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
