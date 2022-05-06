import React, { useEffect, useState } from "react";
import { Button, Card, List, Spin, Popover, Form, Switch, Input, Radio  } from "antd";
import { Address } from "../components";
import { ethers, BigNumber } from "ethers";

//========== MY CUSTOM IMPORTS
import mainnetZoraAddresses from "@zoralabs/v3/dist/addresses/3.json"; // Rinkeby addresses, 1.json would be Rinkeby Testnet 
import "./Marketplace.css";
import LF_Logo_V2_5 from "./LF_Logo_V2_5.png";
import LF_Logo_Blueprint from "./LF_Logo_Blueprint_0x.png";

import { NftSwapV4, ETH_ADDRESS_AS_ERC20 } from '@traderxyz/nft-swap-sdk';
import { createClient } from 'urql';

//========== MY CUSTOM IMPORTS

const APIURL = 'https://api.thegraph.com/subgraphs/name/0xtranqui/zeroex-nft-swap-v4-optimism-v4';

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
  balance,
  userSigner,
//========== MY CUSTOM IMPORTS
/*   zoraTransferHelperContract, */
  zmmContract,
  zoraAsksContract,
  zeroExErc721StatusContract,
  lostandfoundNFTContract,
  lostandfoundNFTContractAddress,
  erc721TransferHelperApproved,
  zoraModuleManagerApproved,
  maxSupply,
//========== MY CUSTOM IMPORTS
}) {
  const [allOldEnglish, setAllOldEnglish] = useState({});
  const [loadingOldEnglish, setLoadingOldEnglish] = useState(true);
  const perPage = 12;
  const [page, setPage] = useState(0);

  //===CUSTOM STATE SETTING TO HANDLE FINDERS FEE FORM INPUT LOGIC
  const [createFinderIsDisabled, setCreateFinderIsDisabled] = useState(true);
  
  const createHandleClickFalse = () => {
    setCreateFinderIsDisabled(false)
  };

  const createHandleClickTrue = () => {
    setCreateFinderIsDisabled(true)
  };

  const [fillFinderIsDisabled, setFillFinderIsDisabled] = useState(true);
  
  const fillHandleClickFalse = () => {
    setFillFinderIsDisabled(false)
  };

  const fillHandleClickTrue = () => {
    setFillFinderIsDisabled(true)
  };

  //=====FUNCTIONALITY ADDITION
  
  const fetchZeroExOrderData = async id => {

    const tokensQuery = `
    query {
      erc721Orders(
        where: {erc721Token: "${lostandfoundNFTContractAddress}", erc721TokenId: "${id}" }
        orderBy: timestamp
        orderDirection: desc
      ) {
        direction
        maker
        taker
        expiry
        nonce
        erc20Token
        erc20TokenAmount
        fees {
          id
        }
        erc721Token
        erc721TokenId
        erc721TokenProperties {
          id
        }
        timestamp
        blockNumber
      }
    }
  `      

    const client = createClient({
      url: APIURL
    })

    const subgraphQuery =  await client.query(tokensQuery).toPromise();
    console.log("subgraph query", subgraphQuery);  

    let orderToCheck = subgraphQuery.data.erc721Orders.length; // if this equals 0 for a specific nft id, means there is no active listing
    console.log(id, "order to check", orderToCheck);

    const currentOrderMetadata = []; // sets metadata to empty before going into checks to see if it is live
    console.log("currentORderMetadata before chec: ", currentOrderMetadata)

    if (orderToCheck > 0 ) {
      const orderStatus = await readContracts[zeroExErc721StatusContract].getERC721OrderStatus([
        subgraphQuery.data.erc721Orders[0].direction, // trade direction (0 = sell, 1 = buy)
        subgraphQuery.data.erc721Orders[0].maker, // maker address
        subgraphQuery.data.erc721Orders[0].taker, // taker address 
        subgraphQuery.data.erc721Orders[0].expiry, // expiry from creation of original order?
        subgraphQuery.data.erc721Orders[0].nonce, // nonce
        subgraphQuery.data.erc721Orders[0].erc20Token, // erc20token
        subgraphQuery.data.erc721Orders[0].erc20TokenAmount,//BigNumber.from(subgraphQuery.data.erc721Orders[0].erc20TokenAmount).toString(), // erc20 token amount (hardhcoded to 0.01 eth)
        [], // fees (none included atm)
        subgraphQuery.data.erc721Orders[0].erc721Token, // erc721 nft contract
        subgraphQuery.data.erc721Orders[0].erc721TokenId, // erc721 nft contract token id
        [] // erc721 token properties (none included atm)
      ])
      console.log("orderStatus", orderStatus);
      if (orderStatus == 1 ) {
        let currentOrderMetadata = [
          subgraphQuery.data.erc721Orders[0].direction, // trade direction (0 = sell, 1 = buy)
          subgraphQuery.data.erc721Orders[0].maker, // maker address
          subgraphQuery.data.erc721Orders[0].taker, // taker address 
          subgraphQuery.data.erc721Orders[0].expiry, // expiry from creation of original order?
          subgraphQuery.data.erc721Orders[0].nonce, // nonce
          subgraphQuery.data.erc721Orders[0].erc20Token, // erc20token
          subgraphQuery.data.erc721Orders[0].erc20TokenAmount,//BigNumber.from(subgraphQuery.data.erc721Orders[0].erc20TokenAmount).toString(), // erc20 token amount (hardhcoded to 0.01 eth)
          [], // fees (none included atm)
          subgraphQuery.data.erc721Orders[0].erc721Token, // erc721 nft contract
          subgraphQuery.data.erc721Orders[0].erc721TokenId, // erc721 nft contract token id
          [] // erc721 token properties (none included atm)      
        ]
        console.log("currentorderMetadata after check: ", currentOrderMetadata);
        console.log("length of currentmetadata array", currentOrderMetadata.length)
        return currentOrderMetadata   
      }
    } return currentOrderMetadata
  }
  
  
  const fetchMetadataAndUpdate = async id => {

    try {
      // console.log("did subgraphmetadata persist")
      const tokenURI = await readContracts[lostandfoundNFTContract].tokenURI(id);
      const nftMetadataURL = "https://ipfs.io/ipfs/" + tokenURI.substring(7); 
      const nftMetadataFetch = await fetch(nftMetadataURL); 

      const ownerAddress = await readContracts[lostandfoundNFTContract].ownerOf(id);
      const ownerAddressCleaned = ownerAddress.toString().toLowerCase();

      //===== CUSTOM UPDATE
      const seller = {seller: '0x0000000000000000000000000000000000000000', sellerFundsRecipient: '0x0000000000000000000000000000000000000000', askCurrency: '0x0000000000000000000000000000000000000000', findersFeeBps: 0, askPrice: BigNumber} ;

      const currentOrderData = await fetchZeroExOrderData(id);

 /*      const orderStatus = await readContracts[zeroExErc721StatusContract].getERC721OrderStatus([
        subgraphQuery.data.erc721Orders[0].direction, // trade direction (0 = sell, 1 = buy)
        subgraphQuery.data.erc721Orders[0].maker, // maker address
        subgraphQuery.data.erc721Orders[0].taker, // taker address 
        subgraphQuery.data.erc721Orders[0].expiry, // expiry from creation of original order?
        // subgraphQuery.data.erc721Orders[0].nonce, // nonce
        subgraphQuery.data.erc721Orders[0].erc20Token, // erc20token
        //BigNumber.from(subgraphQuery.data.erc721Orders[0].erc20TokenAmount).toString(), // erc20 token amount (hardhcoded to 0.01 eth)
        [], // fees (none included atm)
        subgraphQuery.data.erc721Orders[0].erc721Token, // erc721 nft contract
        subgraphQuery.data.erc721Orders[0].erc721tokenId, // erc721 nft contract token id
        [] // erc721 token properties (none included atm)
      ])
      console.log("orderStatus", orderStatus) */

/*     if (orderToCheck > & ) {
      const orderStatus = await readContracts[zeroExErc721StatusContract].getERC721OrderStatus([
        subgraphQuery.data.erc721Orders[0].direction, // trade direction (0 = sell, 1 = buy)
        subgraphQuery.data.erc721Orders[0].maker, // maker address
        subgraphQuery.data.erc721Orders[0].taker, // taker address 
        subgraphQuery.data.erc721Orders[0].expiry, // expiry from creation of original order?
        subgraphQuery.data.erc721Orders[0].nonce, // nonce
        subgraphQuery.data.erc721Orders[0].erc20Token, // erc20token
        //BigNumber.from(subgraphQuery.data.erc721Orders[0].erc20TokenAmount).toString(), // erc20 token amount (hardhcoded to 0.01 eth)
        [], // fees (none included atm)
        subgraphQuery.data.erc721Orders[0].erc721Token, // erc721 nft contract
        subgraphQuery.data.erc721Orders[0].erc721tokenId, // erc721 nft contract token id
        [] // erc721 token properties (none included atm)
      ])
      console.log("orderStatus", orderStatus);
      if (orderStatus == 1 ) {
        let currentOrderMetadata = [
          subgraphQuery.data.erc721Orders[0].direction, // trade direction (0 = sell, 1 = buy)
          subgraphQuery.data.erc721Orders[0].maker, // maker address
          subgraphQuery.data.erc721Orders[0].taker, // taker address 
          subgraphQuery.data.erc721Orders[0].expiry, // expiry from creation of original order?
          subgraphQuery.data.erc721Orders[0].nonce, // nonce
          subgraphQuery.data.erc721Orders[0].erc20Token, // erc20token
          //BigNumber.from(subgraphQuery.data.erc721Orders[0].erc20TokenAmount).toString(), // erc20 token amount (hardhcoded to 0.01 eth)
          [], // fees (none included atm)
          subgraphQuery.data.erc721Orders[0].erc721Token, // erc721 nft contract
          subgraphQuery.data.erc721Orders[0].erc721tokenId, // erc721 nft contract token id
          [] // erc721 token properties (none included atm)          
        ]
        console.log("currentorderMetadat", currentOrderMetadata);
        console.log("length of currentmetadata array", currentOrderMetadata.length)
         return currentOrderMetadata   
      }
    } */


/*     if (orderToCheck == 1) {
      const currentOrderMetadata = [] // length of zero signifies no active order because no order history for given token      
      console.log("currentorderMetadata", currentOrderMetadata);
      console.log("length of currentmetadata array", currentOrderMetadata.length)
      return currentOrderMetadata
    } else {
      const orderStatus = await readContracts[zeroExErc721StatusContract].getERC721OrderStatus([
        subgraphQuery.data.erc721Orders[0].direction, // trade direction (0 = sell, 1 = buy)
        subgraphQuery.data.erc721Orders[0].maker, // maker address
        subgraphQuery.data.erc721Orders[0].taker, // taker address 
        subgraphQuery.data.erc721Orders[0].expiry, // expiry from creation of original order?
        subgraphQuery.data.erc721Orders[0].nonce, // nonce
        subgraphQuery.data.erc721Orders[0].erc20Token, // erc20token
        //BigNumber.from(subgraphQuery.data.erc721Orders[0].erc20TokenAmount).toString(), // erc20 token amount (hardhcoded to 0.01 eth)
        [], // fees (none included atm)
        subgraphQuery.data.erc721Orders[0].erc721Token, // erc721 nft contract
        subgraphQuery.data.erc721Orders[0].erc721tokenId, // erc721 nft contract token id
        [] // erc721 token properties (none included atm)
      ])
      if (orderStatus ==! 1) {
        const currentOrderMetadata = [] // length of zero signifies no active order because no order history for given token       
        console.log("currentorderMetadat", currentOrderMetadata);
        console.log("length of currentmetadata array", currentOrderMetadata.length)
        return currentOrderMetadata
      } else {
        const currentOrderMetadata = [
          subgraphQuery.data.erc721Orders[0].direction, // trade direction (0 = sell, 1 = buy)
          subgraphQuery.data.erc721Orders[0].maker, // maker address
          subgraphQuery.data.erc721Orders[0].taker, // taker address 
          subgraphQuery.data.erc721Orders[0].expiry, // expiry from creation of original order?
          subgraphQuery.data.erc721Orders[0].nonce, // nonce
          subgraphQuery.data.erc721Orders[0].erc20Token, // erc20token
          //BigNumber.from(subgraphQuery.data.erc721Orders[0].erc20TokenAmount).toString(), // erc20 token amount (hardhcoded to 0.01 eth)
          [], // fees (none included atm)
          subgraphQuery.data.erc721Orders[0].erc721Token, // erc721 nft contract
          subgraphQuery.data.erc721Orders[0].erc721tokenId, // erc721 nft contract token id
          [] // erc721 token properties (none included atm)          
        ]    
      } 
    }  */

      try {        
        const nftMetadataObject = await nftMetadataFetch.json();
        const collectibleUpdate = {};

     /*    console.log(nftMetadataObject); */

        //===== CUSTOM UPDATE, added askSeller: seller and nftOwner: ownerAddress as key:value pairs
        collectibleUpdate[id] = { id: id, uri: tokenURI, orderData: currentOrderData, askSeller: seller, nftOwner: ownerAddressCleaned, ...nftMetadataObject};
        console.log("collectible update", collectibleUpdate);
  /*       console.log("order status ", orderStatus) */
        //====== CUSTOM UPDATE

        setAllOldEnglish(i => ({ ...i, ...collectibleUpdate }));
      } catch (e) {
        console.log(e);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const updateAllOldEnglish = async () => {
    if (readContracts[lostandfoundNFTContract] && totalSupply) {
      setLoadingOldEnglish(true);
      let numberSupply = totalSupply.toNumber();

      let tokenList = Array(numberSupply).fill(0);

      tokenList.forEach((_, i) => {
        let tokenId = i; // make this i + 1 if your first token ID is 1 instead of 0
        if (tokenId <= numberSupply - page * perPage && tokenId >= numberSupply - page * perPage - perPage) {
          fetchMetadataAndUpdate(tokenId);
        } else if (!allOldEnglish[tokenId]) {
          const simpleUpdate = {};
          simpleUpdate[tokenId] = { id: tokenId };
          setAllOldEnglish(i => ({ ...i, ...simpleUpdate }));
        }
      });

      setLoadingOldEnglish(false);
    }
  };

  const updateYourOldEnglish = async () => {
    for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
      try {
        const tokenId = await readContracts[oldEnglishContract].tokenOfOwnerByIndex(address, tokenIndex);
        fetchMetadataAndUpdate(tokenId);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const updateOneOldEnglish = async id => {
    if (readContracts[lostandfoundNFTContract] && totalSupply) {
      fetchMetadataAndUpdate(id);
    }
  };

  useEffect(() => {
    if (totalSupply && totalSupply.toNumber() > 0) updateAllOldEnglish();
  }, [readContracts[lostandfoundNFTContract], (totalSupply || "0").toString(), page]);

  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  let filteredOEs = Object.values(allOldEnglish).sort((a, b) => b.askSeller.askPrice - a.askSeller.askPrice);
  const [mine, setMine] = useState(false);
  if (mine == true && address && filteredOEs) {
    filteredOEs = filteredOEs.filter(function (el) {
      return el.nftOwner == address.toLowerCase();
    });
  }

  //========== 0x Protocol Create Order Flow ==========
  const [createOrderForm] = Form.useForm();
  const createOrder = id => {
    const [listing, setListing] = useState(false);

    const CHAIN_ID = userSigner.provider._network && userSigner.provider._network.chainId; // 3 = ropsten, 10 = optimism

    const nftSwapSdk = new NftSwapV4(localProvider, userSigner, CHAIN_ID);

    const specificNftId = {
      tokenAddress: lostandfoundNFTContractAddress, 
      tokenId: id,
      type: 'ERC721'
    }
    
    const walletAddressUserA = address;
    const nftToSwapUserA = specificNftId;  

    return (
      <div>
        <Form
          layout={"horizontal"}
          form={createOrderForm}
          name="create order"
          initialValues={{
            listingPrice: "",
          }}
          onFinish={async values => {
            setListing(true);
            try {
              const approvalStatusForUserA = await nftSwapSdk.loadApprovalStatus(
                nftToSwapUserA,
                walletAddressUserA
              );
              console.log("approval check: ", approvalStatusForUserA);
          
              // If we do need to approve User A's NFT for swapping, let's do that now
              if (!approvalStatusForUserA.contractApproved) {
                const txCur = await tx(nftSwapSdk.approveTokenOrNftByAsset(
                nftToSwapUserA,
                walletAddressUserA
                ));
              }
              
              const order = nftSwapSdk.buildOrder(
                nftToSwapUserA,
                {
                  tokenAddress: ETH_ADDRESS_AS_ERC20,
                  amount: ethers.utils.parseUnits(values["listingPrice"], 'ether').toString(),
                  type: 'ERC20'
                },
                walletAddressUserA
              );
              const txCur2 = await tx(nftSwapSdk.exchangeProxy.preSignERC721Order(order)); 
              await txCur2.wait();
              setListing(false);
            } catch (e) {
              console.log("create order failed", e)
              setListing(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            style={{marginTop: 0, marignBottom: 0, paddingTop: 0, paddingBottom: 0}}              
            name="listingPrice"
            label="LIST PRICE "
            rules={[
              {
                required: true,
                message: "HOW MUCH ARE YOU LISTING THIS NFT FOR?",
              },
            ]}
          >
            <Input
            addonAfter={"ETH"}
            />
          </Form.Item>
          <Form.Item>
          <Button
            style={{ backgroundColor: "#425688", color: "#f7f8f9", border: "4px solid #203466", fontSize: "1.25rem", height: "auto", borderRadius: 20  }} 
            type="primary"
            htmlType="submit"
            loading={listing}>
              LIST
            </Button>            
          </Form.Item>   
        </Form>
      </div>
    )
  }

   //========== 0x Protocol Cancel Order Flow ==========  
  const [cancelOrderForm] = Form.useForm();
  const cancelOrder = id => {
    const [cancel, setCancel] = useState(false);

    const CHAIN_ID = userSigner.provider._network && userSigner.provider._network.chainId; // 3 = ropsten, 10 = optimism

    const nftSwapSdk = new NftSwapV4(localProvider, userSigner, CHAIN_ID);

    const tokensQuery = `
      query {
        erc721Orders(
          where: {erc721Token: "${lostandfoundNFTContractAddress}", erc721TokenId: "${id}" }
          orderBy: timestamp
          orderDirection: desc
        ) {
          direction
          maker
          taker
          expiry
          nonce
          erc20Token
          erc20TokenAmount
          fees {
            id
          }
          erc721Token
          erc721TokenId
          erc721TokenProperties {
            id
          }
          timestamp
          blockNumber
        }
      }
    `

  const client = createClient({
    url: APIURL
  })  

  /* const caporder = [0, "0x806164c929ad3a6f4bd70c2370b3ef36c64deaa8", "0x0000000000000000000000000000000000000000", "2524604400", "100131415900000000000000000000000000000276072267468760131049939705133557812592", "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "999000000000000000000", [], "0xa4248ac1a4fc557134802f39cddf830fde6dda06", "1", []] */
  
    return (
      <div>
        <Form
          className=""
          form={cancelOrderForm}
          name="cancel order"
          onFinish={async values => {
            setCancel(true);
            const subgraphQuery =  await client.query(tokensQuery).toPromise();
            const orderNonceToCancel = subgraphQuery.data.erc721Orders[0].nonce;
            console.log("entire query: ", subgraphQuery);
            console.log("Order Nonce Being Cancelled: ", orderNonceToCancel);
            try {
              const txCur = await tx(writeContracts[zeroExErc721StatusContract].cancelERC721Order(orderNonceToCancel));
              /* const txCur = await tx(nftSwapSdk.exchangeproxy.cancelERC721Order(orderNonceToCancel)); original call to make following sdk, doesn't work tho    */      
              await txCur.wait();
              setCancel(false);
            } catch (e) {
              console.log("CANCEL ORDER FAILED", e);
              setCancel(false);
            }
          }}
          onFinishedFailed={onFinishFailed}
        >
          <Form.Item>
            <Button
            style={{ backgroundColor: "#e26843", color: "#791600", border: "4px solid #791600", fontSize: "1.25rem", height: "auto", borderRadius: 20  }} 
            type="primary"
            htmlType="submit"
            loading={cancel}
            >
            CANCEL
            </Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
  
    //========== 0x Protocol Fill Order Flow ==========

    const [fillOrderForm] = Form.useForm();
    const fillOrder = id => {
/*       const [fill, setFill] = useState(false); */

      const CHAIN_ID = userSigner.provider._network && userSigner.provider._network.chainId;
      
      const nftSwapSdk = new NftSwapV4(localProvider, userSigner, CHAIN_ID);

      const lostandfoundSpecificNFT = {
        tokenAddress: lostandfoundNFTContractAddress, 
        tokenId: id,
        type: 'ERC721'
      }      
      
      const walletAddressUserB = address;
      const nftToSwapUserB = lostandfoundSpecificNFT;  

      const tokensQuery = `
        query {
          erc721Orders(
            where: {erc721Token: "${lostandfoundNFTContractAddress}", erc721TokenId: "${id}" }
            orderBy: timestamp
            orderDirection: desc
          ) {
            direction
            maker
            taker
            expiry
            nonce
            erc20Token
            erc20TokenAmount
            fees {
              id
            }
            erc721Token
            erc721TokenId
            erc721TokenProperties {
              id
            }
            timestamp
            blockNumber
          }
        }
      `  

    const client = createClient({
      url: APIURL
    })  
    

/*     const purchasePrice = {
      tokenAddress: ETH_ADDRESS_AS_ERC20, 
      amount: "1000000000000000",
      type: 'ERC20'
    }      
   */
 /* const caporder = [0, "0x806164c929ad3a6f4bd70c2370b3ef36c64deaa8", "0x0000000000000000000000000000000000000000", "2524604400", "100131415900000000000000000000000000000278871891236123933663926623449196810869", "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "1000000000000000", [], "0xa4248ac1a4fc557134802f39cddf830fde6dda06", "1", []] */

    return(
      <div>
        <Form
          className=""
          form={fillOrderForm}
          name="fill order"
          onFinish={async values => {
/*             setFill(true); */
            const subgraphQuery =  await client.query(tokensQuery).toPromise();
            const orderPrice = subgraphQuery.data.erc721Orders[0].erc20TokenAmount;
            console.log("entire query: ", subgraphQuery);
            console.log("orderprice being filled: ", orderPrice);  
            const PurchasePrice = {
              tokenAddress: ETH_ADDRESS_AS_ERC20, 
              amount: orderPrice,
              type: 'ERC20'
            }
            try {
              const approvalStatusForUserB = await nftSwapSdk.loadApprovalStatus(
                nftToSwapUserB,
                walletAddressUserB
              );
              console.log("approval check: ", approvalStatusForUserB); 
              
              // If we do need to approve User A's NFT for swapping, let's do that now
              if (!approvalStatusForUserB.contractApproved) {
                const txCur = await tx(nftSwapSdk.approveTokenOrNftByAsset(
                nftToSwapUserB,
                walletAddressUserB
                ));
              }
              
              const reconstructedOnchainOrder = 
    //testorder              
              [
                [0, "0x806164c929ad3a6f4bd70c2370b3ef36c64deaa8", "0x0000000000000000000000000000000000000000", "2524604400", "100131415900000000000000000000000000000278871891236123933663926623449196810869", "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "1000000000000000", [], "0xa4248ac1a4fc557134802f39cddf830fde6dda06", "1", []]                
              ]

/*               const reconstructedOnchainOrder = [
                subgraphQuery.data.erc721Orders[0].direction, // trade direction (0 = sell, 1 = buy)
                subgraphQuery.data.erc721Orders[0].maker, // maker address
                subgraphQuery.data.erc721Orders[0].taker, // taker address 
                subgraphQuery.data.erc721Orders[0].expiry, // expiry from creation of original order?
                subgraphQuery.data.erc721Orders[0].nonce, // nonce
                subgraphQuery.data.erc721Orders[0].erc20Token, // erc20token
                BigNumber.from(subgraphQuery.data.erc721Orders[0].erc20TokenAmount).toString(), // erc20 token amount (hardhcoded to 0.01 eth)
                [], // fees (none included atm)
                subgraphQuery.data.erc721Orders[0].erc721Token, // erc721 nft contract
                subgraphQuery.data.erc721Orders[0].erc721tokenId, // erc721 nft contract token id
                [] // erc721 token properties (none included atm)
              ]         */      
              
              const nullSignatureStruct = {
                // These value indicates that the order maker has previously marked the order as fillable on-chain. The remaining fields in the Signature struct will be ignored.
                // link to where this explanation comes from: https://docs.0x.org/protocol/docs/signatures         
                "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "v": 0,
                "signatureType": 4
              }              

              const txCur2 = await nftSwapSdk.exchangeProxy.buyERC721(
                reconstructedOnchainOrder,
                nullSignatureStruct,
                "0x",
                { value: BigNumber.from(subgraphQuery.data.erc721Orders[0].erc20TokenAmount).toString() }
              )
              await txCur2.wait();
/*               setFill(false); */
            } catch (e) {
              console.log("fill order failed", e)
/*               setFill(false); */
            }         
          }}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item>
            <Button
            style={{ backgroundColor: "#e26843", color: "#791600", border: "4px solid #791600", fontSize: "1.25rem", height: "auto", borderRadius: 20  }} 
            type="primary"
            htmlType="submit"
/*             loading={fill} */
            >
            BUY
            </Button>
          </Form.Item>
        </Form>
      </div>
    )
  }

  const marketplaceManager = () => {
    const [transferHelper, setTransferHelper] = useState(false);
    const [moduleManager, setModuleManager] = useState(false);

    return (
      <div className="approvalPopOverManager">
        <div className="pleaseApprovePopover">
          Lost & Found is built on the ZORA marketplace protocol. Please sign the following approvals to allow the protocol to interact with your assets : {/* ↓ ↓ */}
        </div>
        {erc721TransferHelperApproved == true ? (
          <div
            className="erc721ApprovedPopover"
            style={{  }}>
            NFT TRANSFER HELPER IS APPROVED ✅
          </div>
          ) : (
          <Button
          className="erc721ApprovalButtonPopover"   
          style= {{ backgroundColor: "#d87456", color: "#791600", border: "4px solid #791600", fontSize: "1rem", height: "auto", borderRadius: 20  }}
            type="primary"
            loading={transferHelper}
            onClick={async () => {
              setTransferHelper(true);
              try {
                const txCur = await tx(writeContracts[lostandfoundNFTContract].setApprovalForAll(
                  mainnetZoraAddresses.ERC721TransferHelper,
                  true
                ));
                await txCur.wait();
                updateOneOldEnglish();
                setTransferHelper(false);
              } catch (e) {
                console.log("ERC721Transfer HelperApproval Failed", e);
                setTransferHelper(false);
              }
            }}
          >            
            APPROVE NFT TRANSFER HELPER
          </Button>
          )}
          {zoraModuleManagerApproved == true ? (
          <div className="zmmApprovedPopover">
            MARKETPLACE PROTOCOL IS APPROVED ✅ 
          </div>              
          ) : (
          <Button
            className="zmmApprovalButtonPopover"
            style={{ backgroundColor: "#4998ff", color: "#283cc4", border: "4px solid #283cc4", fontSize: "1rem", height: "auto", borderRadius: 20, verticalAlign: "center" }}
            type="primary"
            loading={moduleManager}
            onClick={async () => {
              setModuleManager(true);
              try {
                const txCur = await tx(writeContracts[zmmContract].setApprovalForModule(
                  mainnetZoraAddresses.AsksV1_1, 
                  true
                ));
                await txCur.wait();
                updateOneOldEnglish();
                setModuleManager(false);
              } catch (e) {
                console.log("ZORA Module Manager Approval Failed", e);
                setModuleManager(false);
              }
            }}
          >      
            APPROVE MARKETPLACE PROTOCOL
          </Button>
          )}
      </div>
    )
  }  

  return (
    <div className="OldEnglish">
      <div className="beforeTokenRender"> 
        <div >
          <img className="logoWidth" src={LF_Logo_Blueprint}></img>
        </div>
        <div className="ownershipFilterWrapper">
          <div className="ownershipFilterOptions">
            FULL COLLECTION
          </div>
          <Switch
            className="ownershipFilterSwitch"
            disabled={loadingOldEnglish}
            style={{ height: "60%", width: "5%", border: "4px #203466 solid", backgroundColor: "#425688" }}
            value={mine}
            onChange={() => {
              setMine(!mine);
              updateYourOldEnglish();
            }}
          >
          </Switch>
          <div className="ownershipFilterOptions">
            MY COLLECTION 
          </div>
        </div>
      </div>
      {false ? (
        <Spin />
      ) : (
        <div className="tokenRenderWrapper">
          <List            
            className="tokenRender"
            grid={{
              gutter: 30,
              xs: 1,
              sm: 1,
              md: 2,
              lg: 2,
              xl: 3,
              xxl: 3,
            }}
            align="center"
            locale={{ emptyText: `Fetching Markteplace Items...` }}
                        
            /*
            commenting out pagination since its helpful but not used in this project (having multiple pages of NFTs)
            
            pagination={{
              total: mine ? filteredOEs.length : totalSupply,
              defaultPageSize: perPage,
              defaultCurrent: page,
              onChange: currentPage => {
                setPage(currentPage - 1);
                console.log(currentPage);
              },
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${mine ? filteredOEs.length : maxSupply} items`,
            }}

            
            */
            
            loading={loadingOldEnglish}
            dataSource={filteredOEs ? filteredOEs : []}
            renderItem={item => {
              const id = item.id;
              const imageWithGateway = "https://ipfs.io/ipfs/" + item.image.substring(7);
              const characterDescription = () => {
                return (
                  <div style={{ padding: 0}}>
                    <div style={{fontSize: "2rem", textAlign: "center"}}>
                      <i>{"" + item.name}</i>
                    </div>                    
                    <div style={{fontSize: "1.25rem", marginLeft: "10%", marginRight: "10%", textAlign: "center"}}>
                      <u>Background:</u> {" " + item.description}
                    </div>
                    <div style={{fontSize: "1.25rem", marginLeft: "10%", marginRight: "10%", textAlign: "center"}}>
                      <u>Defining Characteristic:</u>{" " + item.attributes[0].value}
                    </div>  
                  </div>
                )
              }       
              return (
                <List.Item className="listItems" key={id}>
                  <Card
                    className="cards"                
                    style={{ border: "4px solid black", borderRadius: 2 }}
                    title={
                      <Popover                      
                        overlayInnerStyle={{backgroundColor: "black", width: "100%", fontFamily: "oliver-regular"}}
                        arrowPointAtCenter="false"
                        placement="top"
                        content={() => {
                          return characterDescription();
                        }}
                      >
                        <div
                          className="cardHeaders"
                        >
                          {item.name ? `LF #${id}` + " - " + item.name : `LF #${id}`}
                        </div>
                      </Popover>
                    }
                  >
                    <a                      
                      href={`${blockExplorer}token/${
                        readContracts[lostandfoundNFTContract] && readContracts[lostandfoundNFTContract].address
                      }?a=${id}`}
                      target="_blank"
                    >
                      <img className="nftImage" src={imageWithGateway && imageWithGateway} alt={"LF #" + id} width="100%" />
                    </a>
                    <div className="cardFooters">
                      {item.askSeller.seller == "0x0000000000000000000000000000000000000000" ? ( // listing inactive
                        <div className="activityWrapper">
                          <div className="listingStatusManager">
                            <div>
                              <Address
                                className="listingOwner"
                                address={item.nftOwner}
                                ensProvider={mainnetProvider}
                                blockExplorer={blockExplorer}
                                fontSize={16}
                              />
                            </div>
                            <div className="listingStatus">
                            LISTING : INACTIVE
                            </div>
                            <div className="listingPrice">
                            PRICE : N/A
                            </div>
                            <div className="listingFindersFee">
                            ARTIST ROYALTY : 15%
                            </div>
                          </div>
                          { erc721TransferHelperApproved == false || zoraModuleManagerApproved == false ? ( // listing inactive  &  marketplace protocols not approved
                          <div className="approvals_and_functions_wrapper">
{/* 
  
  taking out approval button

                            <Popover
                              className="popoverMaster"
                              placement="top"
                              content={() => {                                                        
                                return marketplaceManager();
                              }}
                            >
                              <Button
                                className="marketplaceApprovalButton"
                                disabled={false}
                                style={{  backgroundColor: "#f7f8f9", color: "#203466", borderRadius: 2, border: "1px solid black", width: "97%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                type="primary"
                              >
                                APPROVE MARKETPLACE PROTOCOLS
                              </Button>
                            </Popover>

                             */}
                            <div className="marketplaceManager">
                              <Popover
                                placement="top"
                                  content={() => {                                                        
                                    return createOrder(id);
                                  }}
                                >
                                <Button
                                  style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}
                                  type="primary">
                                  LIST
                                </Button>
                              </Popover>
                              <Popover
                                placement="top"
                                  content={() => {                                                        
                                    return cancelOrder(id);
                                  }}
                                >
                                <Button
                                  style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}
                                  type="primary">
                                  CANCEL
                                </Button>
                              </Popover> 
                              <Popover
                                placement="top"
                                  content={() => {                                                        
                                    return fillOrder(id);
                                  }}
                                >
                                <Button
                                  style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}
                                  type="primary">
                                  BUY
                                </Button>
                              </Popover>                           
                            </div>                             
                          </div>
                          ) : (
                            <>
                              { item.nftOwner == address.toLowerCase() ? ( // listing inactive  &  marketplace protocols approved  &  app user is owner
                                <div className="approvals_and_functions_wrapper">
{/* 
    taking out approvals button
                                  <Button
                                    className="marketplaceApprovalButton"
                                    disabled={true}
                                    style={{ borderRadius: 2, border: "1px solid black", width: "97%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                    type="primary"
                                  >
                                    MARKETPLACE PROTOCOLS ARE APPROVED
                                  </Button> 

 */}
                                  <div className="marketplaceManager">
                                  <Popover
/*                                     placement="top"
                                      content={() => {                                                        
                                        return createAsk(id);
                                      }} */
                                    >
                                      <Button style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                                    </Popover>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>                              
                                  </div>  
                                </div> 
                                ) : ( // listing inactive  &  marketplace protocols approved  &  user not owner
                                <div className="approvals_and_functions_wrapper">
{/* 
    taking out approvals button
                                  <Button
                                    className="marketplaceApprovalButton"
                                    disabled={true}
                                    style={{ borderRadius: 2, border: "1px solid black", width: "97%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                    type="primary"
                                  >
                                    MARKETPLACE PROTOCOLS ARE APPROVED
                                  </Button>        

                                   */}
                                  <div className="marketplaceManager">
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                                  </div> 
                                </div>
                              )} 
                            </>
                          )} {/* END OF INACTIVE SALE LOGIC */}
                        </div>
                      ) : ( // listing active
                        <div className="activityWrapper">
                          <div className="listingStatusManager">
                            <div>
                              <Address
                                className="listingOwner"
                                address={item.nftOwner}
                                ensProvider={mainnetProvider}
                                blockExplorer={blockExplorer}
                                fontSize={16}
                              />
                            </div>
                            <div className="listingStatus">
                            LISTING : ACTIVE 
                            </div>
                            <div>                        
                            PRICE : {item.askSeller.askPrice.toString() / (10 ** 18)} ETH
                            </div>
                            <div>
                            FINDER'S FEE : {item.askSeller.findersFeeBps / 100} % 
                            </div>
                          </div>
                          { erc721TransferHelperApproved == false || zoraModuleManagerApproved == false ? ( // listing active  &  marketplace protocols not approved
                          <div className="approvals_and_functions_wrapper">
{/* 
    taking out approvals button
                            <Popover
                              className="popoverMaster"
                              placement="top"
                              content={() => {                                                        
                                return marketplaceManager();
                              }}
                            >
                              <Button
                                className="marketplaceApprovalButton"
                                disabled={false}
                                style={{ backgroundColor: "white", color: "#3e190f", borderRadius: 2, border: "1px solid black", width: "97%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                type="primary"
                              >
                                APPROVE MARKETPLACE PROTOCOLS
                              </Button>
                            </Popover>

                             */}
                            <div className="marketplaceManager">
                              <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                              <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                              <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                            </div>                             
                          </div>
                          ) : (     
                            <>
                              { item.nftOwner == address.toLowerCase() ? ( // listing active  &  marketplace protocols approved  &  app user is owner
                                <div className="approvals_and_functions_wrapper">
{/* 
    taking out approvals button
                                  <Button
                                    className="marketplaceApprovalButton"
                                    disabled={true}
                                    style={{  borderRadius: 2, border: "1px solid black", width: "97%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                    type="primary"
                                  >
                                    MARKETPLACE PROTOCOLS ARE APPROVED
                                  </Button>  

 */}
                                  <div className="marketplaceManager">                             
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>                                
{/*                                     <Popover
                                      content={() => {                                                        
                                        return cancelAsk(id);
                                      }}
                                    >
                                      <Button style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                                    </Popover> */}
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                                  </div>  
                                </div> 
                                ) : ( // listing active  &  marketplace protocols approved  &  app user is not owner
                                <div className="approvals_and_functions_wrapper">
{/* 
    taking out approvals button
                                  <Button
                                    className="marketplaceApprovalButton"
                                    disabled={true}
                                    style={{  borderRadius: 2, border: "1px solid black", width: "97%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                    type="primary"
                                  >
                                    MARKETPLACE PROTOCOLS ARE APPROVED
                                  </Button>        

                                   */}
                                  <div className="marketplaceManager">
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>                                    
{/*                                     <Popover
                                      className="fillAskPopver"
                                      content={() => {                                                        
                                        return fillAsk(id);
                                      }}                                      
                                    >  
                                      <Button style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                                    </Popover> */}
                                  </div> 
                                </div>
                              )} 
                            </>                          
                          )}                                                                                           
                        </div>
                      )}
                    </div>
                  </Card>
                </List.Item>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

export default OldEnglish;
