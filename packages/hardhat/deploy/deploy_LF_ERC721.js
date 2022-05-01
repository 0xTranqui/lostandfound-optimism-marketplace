// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
   const { deploy } = deployments;
   const { deployer } = await getNamedAccounts();

   await deploy("lostandfound_vol_1_reloaded", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
      from: deployer,
      args: ["ipfs://bafybeigiucyvtnm25hnfrio5yg7gl6hmlrksvpww65hho6vsrziq54z6fq/"],
      log: true,
   });
};
module.exports.tags = ["lostandfound_vol_1_reloaded"];