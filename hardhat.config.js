require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("hardhat-abi-exporter");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "localhost",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    goerli: {
      url: process.env.ENDPOINT_URL,
      accounts: [process.env.DEPLOYER_KEY]
    }
  },
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
  },
  mocha: {
    timeout: 40000
  },
  etherscan: {
    apiKey: "5A7MAGYE2WPNBNSP7CKV96885CWINAHTIZ",
  },
  abiExporter: {
    clear: true,
    flat: true,
    runOnCompile: true,
    only: ["MyToken", "PoolContract", "CommunityContract"],
    path: './app/src/static/abi'
  },
};
