import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Form, notification, Select } from "antd";

//========== my custom import
import "./Mint.css";
import LF_Logo_V2_5 from "./LF_Logo_V2_5.png";
import Premint_Artwork from "./Untitled_Artwork.png";
import Confetti from 'react-confetti';
import { useWindowWidth, useWindowHeight } from '@react-hook/window-size';
//========== my custom import

var count = 0; // this saves count that is used to determine what state setting is used when tracking active user mints


//==== new imports for the 0x marketplace
import { NftSwapV4 } from '@traderxyz/nft-swap-sdk';

const { ERC721Order, NFTOrder } = require("@0x/protocol-utils");
const utils = require("@0x/utils");

//== new imports for the 0x marketplace


function OldEnglish({
   readContracts,
   mainnetProvider,
   blockExplorer,
   totalSupply,
   DEBUG,
   writeContracts,
   tx,
   address,
   localProvider,
   oldEnglishContract,
   startBlock,
   userSigner,
   //===my custom imports
   lostandfoundNFTContract,
   priceOfMint,
   maxSupply,
   remainingMints,
   nftContractURI
}) {

   const onFinishFailed = errorInfo => {
      console.log("Failed:", errorInfo);
   };

   //=====MINT FORM + STATE
   const [mintForm] = Form.useForm();
   const [mint, setMint] = useState(false);

   //====SAVING MINT STATE
   const [tokenIdMinted1, setTokenIdMinted1] = useState("");
   const [tokenIdMinted2, setTokenIdMinted2] = useState("");

   //=====Saving image urls for each mint
   const [mintImageURL1, setMintImageURL1] = useState("");
   const [mintImageURL2, setMintImageURL2] = useState("");

   //====saving nft names for each mint
   const [mintName1, setMintName1] = useState("");
   const [mintName2, setMintName2] = useState("");

   //====defining window size for confetti animation
   const width = useWindowWidth();
   const height = useWindowHeight();

   //===fetching metadata
   const fetchMetadataMint1 = async (tokenId) => {
      try {
         const mintedTokenId1 = tokenId;
         const metadataURL1 = "https://ipfs.io/ipfs/" + nftContractURI.substring(7) + "/" + mintedTokenId1 + ".token.json"; 
         const mintMetadataFetch1 = await fetch(metadataURL1);
         
         try {
            const metadataObject1 = await mintMetadataFetch1.json();
            const imageURL1 = "https://ipfs.io/ipfs/" + metadataObject1.image.substring(7);
            const nftName1 = metadataObject1.name;
            setMintImageURL1(imageURL1);
            setMintName1(nftName1);

         } catch(e) {
            console.log(e);
         }
      }  catch (e) {
         console.log(e);
      }
   };

   const fetchMetadataMint2 = async (tokenId) => {
      try {
         const mintedTokenId2 = tokenId;
         const metadataURL2 = "https://ipfs.io/ipfs/" + nftContractURI.substring(7) + "/" + mintedTokenId2 + ".token.json";
         const mintMetadataFetch2 = await fetch(metadataURL2);
         
         try {
            const metadataObject2 = await mintMetadataFetch2.json();
            const imageURL2 = "https://ipfs.io/ipfs/" + metadataObject2.image.substring(7);
            const nftName2 = metadataObject2.name;
            setMintImageURL2(imageURL2);
            setMintName2(nftName2);

         } catch(e) {
            console.log(e);
         }
      }  catch (e) {
         console.log(e);
      }
   };

   //=======0x Protocol Create Order Flow===========

   const createOrder = async () => {

      console.log("createOrder function running");

      const CHAIN_ID = 3; //3 = ropsten

      const lostandfound_token_0 = {
         tokenAddress: '0xd373B9C8acc3439d42359bDAd3a0e3cC4BD0Ff66', //ropsten deployment
         tokenId: '0', //this should be angel
         type: 'ERC721'
      }

      const price_to_list_for = {
         tokenAddress: "0x0000000000000000000000000000000000000000", //nulladdress so that lister gets paid in eth
         amount: "10000000000000000", //16 zeroes aka 0.01eth
         type: 'ERC20'
      }

      const walletAddressUserA = '0x153D2A196dc8f1F6b9Aa87241864B3e4d4FEc170'
      const nftToSwapUserA = lostandfound_token_0;

      const wallerAddressUserB = '0x806164c929Ad3A6f4bd70c2370b3Ef36c64dEaa8'
      const ethToSwapUserB = price_to_list_for;

      const nftSwapSdk = new NftSwapV4(localProvider, userSigner, CHAIN_ID);

   // Check if we need to approve the NFT for swapping
      const approvalStatusForUserA = await nftSwapSdk.loadApprovalStatus(
         nftToSwapUserA,
         walletAddressUserA
      );

      // If we do need to approve User A's NFT for swapping, let's do that now
      if (!approvalStatusForUserA.contractApproved) {
         const approvalTx = await nftSwapSdk.approveTokenOrNftByAsset(
         nftToSwapUserA,
         walletAddressUserA
         );
         const approvalTxReceipt = await approvalTx.wait();
/*          console.log(
         `Approved ${assetsToSwapUserA[0].tokenAddress} contract to swap with 0x v4 (txHash: ${approvalTxReceipt.transactionHash})`
         ); */
      }   

      // Create the order (Remember, User A initiates the trade, so User A creates the order)
      const order = nftSwapSdk.buildOrder(
         nftToSwapUserA,
         ethToSwapUserB,
         walletAddressUserA
      );
      // Sign the order (User A signs since they are initiating the trade)
      console.log("onchainOrder getting made: ")
      const onchainOrder = await nftSwapSdk.exchangeProxy.preSignERC721Order(order); 
      console.log("onchainOrder finished!")
   }

/*     //=======0x Protocol Cancel Order Flow===========
   
   await nftSwapSdk.cancelOrder(onchainOrder); */
   
    //=======0x Protocol Fill Order Flow===========

   const fillOrder = async () => {

      console.log ("fillOrder function running");

      const nftSwapSdk = new NftSwapV4(localProvider, userSigner, CHAIN_ID);

      if (!approvalStatusForUserB.contractApproved) {
         const approvalTx = await nftSwapSdk.approveTokenOrNftByAsset(
         ethToSwapUserB,
         walletAddressUserB
         );
         const approvalTxReceipt = await approvalTx.wait();
/*          console.log(
         `Approved ${assetsToSwapUserA[0].tokenAddress} contract to swap with 0x v4 (txHash: ${approvalTxReceipt.transactionHash})`
         ); */
      }   

      
      const fillTx = await nftSwapSdk.fillpreSignERC721Order(onchainOrder);
      const fillTxReceipt = await nftSwapSdk.awaitTransactionHash(fillTx);
/*       console.log('Filled order! 🎉', fillTxReceipt.transactionHash);  */
   
   }


   return (
      <div className="mint">
         <div className="beforeMintRender">
            <div className="mintPageExplanation">
               <img className="logoWidth" src={LF_Logo_V2_5}></img>
               <br /> 
               <div className="mintPageExplanationBody">
                  <Button
                  style={{ backgroundColor: "black", color: "white", border: "4px solid black", fontSize: "1.25rem", height: "auto", borderRadius: 20  }} 
                  type="primary"
                  onClick={createOrder}
                  >
                     List Item
                  </Button>
               </div>
               <div className="mintPageExplanationBody">
                  <Button
                  style={{ backgroundColor: "black", color: "white", border: "4px solid black", fontSize: "1.25rem", height: "auto", borderRadius: 20  }} 
                  type="primary"                  
                  >
                     Update Listing
                  </Button>
               </div>
               <div className="mintPageExplanationBody">
                  <Button
                  style={{ backgroundColor: "black", color: "white", border: "4px solid black", fontSize: "1.25rem", height: "auto", borderRadius: 20  }} 
                  type="primary"                  
                  >
                     Cancel Listing
                  </Button>
               </div>
               <div className="mintPageExplanationBody">
                  <Button
                  style={{ backgroundColor: "black", color: "white", border: "4px solid black", fontSize: "1.25rem", height: "auto", borderRadius: 20  }} 
                  type="primary"   
                  onClick={fillOrder}               
                  >
                     Buy Item
                  </Button>
               </div>
            </div>                     
         </div>
      </div>
   );
}

export default OldEnglish;