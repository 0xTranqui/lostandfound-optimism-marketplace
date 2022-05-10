# Lost & Found NFT Marketplace Powered by 0x Protocol
##### A starter-kit for creating your own NFT collection + marketplace on top of 0x public marketplace protocols. oPeNsEa who ???
---
## Introduction - What Are We Doing Here ?
This guide will walk you step-by-step through the process of deploying your own NFT contract and creating a website that allows people to mint NFTs and list/buy/sell pieces from your collection on a marketplace. What is unique about this guide is that it uses [0x v4 NFT Swap Protocol](https://docs.0x.org/nft-support/docs/introduction) which enable anyone to list/buy/sell NFTs in a completely on-chain + permisonless + trustless fashion. If you want to learn more about the importance of open protocols, check out this [detailed thread](https://twitter.com/0xTranqui/status/1506722429208567819?s=20&t=yhPlg9n-hxi_tPGOouoqKw) I wrote about the subject. 

I cannot emphasize enough how important it is to be able to build on top of a public marketplace protocol that is both immutable (code will never change) + permisonless (no one can prevent you from access the code). For context, most of the web3 universe still relies on broad market aggregators like Opensea to facilitate the buying/selling of NFTs. However, relying on platforms like Opensea who use protocols that move crucial marketplace functions off-chain (ex: final settlement of orders) creates an enormous level of risk to the long term health + stability of the web3 ecocystem by introducing blackboxes around market data and the need to trust a centralized party (ex: Opensea) to remain a "good actor" in perpetuity. 

This repo gives you the tools to break the cycle, and claim full ownership/soveriengty over your digital assets and the marketplace where they are bought and sold. All made possible by 0x public marketplace protocols.
---
## 🏄‍♂️ Getting Started - IDE Setup + Environment Variables

> Clone the repo
```
gh repo clone 0xTranqui/lostandfound-optimism-marketplace
```

> Install
```
cd lostandfound-optimism-marketplace
yarn install
```

This 🏗 scaffold-eth fork is pointed at the **Ethereum Mainnet** out of the box (instead of localhost like usual).

Before we do anything, we will set up our environment variables which are needed to interact with both the frontend marketplace and 
contract deployment functionality of this repo. We will be setting up two different .env files, one at the root level of packages/react-app
and one at the root level of packages/hardhat
\
Open up your text editor (this guide assumes VSCode) to better navigate through your files:
```
cd lostandfound-optimism-marketplace
code . 
```
Navigate to + expand the the packages directory, and then right click on the react-app folder and create a new file. Name this file ".env"
Add in the following 2 lines of code:
```
REACT_APP_ALCHEMY_KEY = enter your key here (without quotes)
REACT_APP_ETHERSCAN_KEY= enter your key here (without quotes)
```
This allows the constants.js file in the react-app/src directory to pull these keys into the react-app without needing to expose them publicly.

Navigate to + expand the the packages directory, and then right click on the hardhat folder and create a new file. Name this file ".env"
Add in the following 6 lines of code (the mainnet lines are optional) :
```
ROPSTEN_ALCHEMY_KEY = enter your key here (without quotes)
ROPSTEN_ETHERSCAN_API_KEY = enter your key here (without quotes)
ROPSTEN_DEPLOYER_PRIV_KEY = enter your key here (without quotes)

OPTIMISM_ALCHEMY_KEY = enter your key here (without quotes)
OPTIMISM_ETHERSCAN_API_KEY = enter your key here (without quotes)
OPTIMISM_DEPLOYER_PRIV_KEY = enter your key here (without quotes)
```
This allows the hardhat.config.js file in the packages/hardhat directory to use these keys for the smart contract deployment and 
verification functionality we will be implementing without having to expose them publicly.

## Setting Up the Front End

From here, you can now run the following code to interact with your own local frontend that points at the existing Lost & Found marketplace located at   https://www.lostfound.world/. Note: it won't work unless you have set up the .env in pacakges/react-app. All you have to do is run the following from the root level of the project directory:
```
cd lostandfound-zora-marketplace
yarn start
```

You now have a direct window into the Lost & Found marketplace! You'll notice that the app points at Optimism if you look at the top
right corner of the site, where the network the app is pointed at is listed. Both the NFT contract and 0x marketplace protocols live on
Optimism as well. You are "yarn-starting" into a production ready app!

We'll come back to learning how to edit the front end, but first lets reconfigure the app so that it points at ropsten which is a more 
suitable environment for testing

### App.jsx Updates (packages/react-app/src/App.jsx)

- Line 58: Replace "optimism" with "ropsten"
- Line 73: Replace "lostandFoundOptimism" with "lostandFoundContract4"
- Line 74: Replace "0xa4248aC1a4Fc557134802f39cddF830Fde6DdA06" with "0x9fd7ad2ecf7510eddcf0e6a345188d9df23805ac"
- Line 76: Replace "zeroExErc721StatusOPTIMISM" with "zeroExErc721OrdersFeatureROPSTEN"

### OldEnglish.jsx Updates (packages/react-app/src/views/OldEnglish.jsx)

- Line 13: Change the subgraph APIURL from optimism link: 'https://api.thegraph.com/subgraphs/name/0xtranqui/zeroex-nft-swap-v4-optimism-v4' to ropsten link: 'https://api.thegraph.com/subgraphs/name/0xtranqui/zeroex-nft-swap-v4-ropsten-v2'

When you press save (on both files) to run this code, you will get a pop up on the site that alerts you that you are on the wrong network and you
need to switch to rinkeby to continue using the app. Follow those instructions :) (your screenshot will say rinkeby instead of mainnet)

*** FINAL SECTIONS IN PROGRESS :) ***

Fin 🏁🏁
