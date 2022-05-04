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

const APIURL = 'https://api.thegraph.com/subgraphs/name/mzhu25/presigned-v4-nft-orders';

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
  lostandfoundNFTContract,
  lostandfoundNFTContractAddress,
  erc721TransferHelperApproved,
  zoraModuleManagerApproved,
  maxSupply
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
  const fetchMetadataAndUpdate = async id => {
    try {
      const tokenURI = await readContracts[lostandfoundNFTContract].tokenURI(id);
      const nftMetadataURL = "https://ipfs.io/ipfs/" + tokenURI.substring(7); 
      const nftMetadataFetch = await fetch(nftMetadataURL); 

      //===== CUSTOM UPDATE
      const seller = {seller: '0x0000000000000000000000000000000000000000', sellerFundsRecipient: '0x0000000000000000000000000000000000000000', askCurrency: '0x0000000000000000000000000000000000000000', findersFeeBps: 0, askPrice: BigNumber} ;

      //^ this sets all asks to be inactive. line below is the actual zora querying code
      /* readContracts[zoraAsksContract].askForNFT(lostandfoundNFTContractAddress, id); */

      const ownerAddress = await readContracts[lostandfoundNFTContract].ownerOf(id);
      const ownerAddressCleaned = ownerAddress.toString().toLowerCase();
      //===== CUSTOM UPDATE

      try {
        const nftMetadataObject = await nftMetadataFetch.json();
        const collectibleUpdate = {};

     /*    console.log(nftMetadataObject); */

        //===== CUSTOM UPDATE, added askSeller: seller and nftOwner: ownerAddress as key:value pairs
        collectibleUpdate[id] = { id: id, uri: tokenURI, askSeller: seller, nftOwner: ownerAddressCleaned, ...nftMetadataObject};
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

/*   //========== ZORA CREATE ASK FLOW ==========
  const [createAskForm] = Form.useForm();
  const createAsk = id => {
    const [listing, setListing] = useState(false);

    return (
      <div >
        <Form
          layout={"horizontal"}
          form={createAskForm}
          name="create ask"
          initialValues={{ 
            tokenId: id,
            askPrice: '',
            sellerFundsRecipient: '',
            findersFeeBps: '',
          }}
          onFinish={async values => {
            setListing(true);
            try {
              const txCur = await tx(writeContracts[zoraAsksContract].createAsk(
                lostandfoundNFTContractAddress,
                id,
                ethers.utils.parseUnits(values["askPrice"], 'ether'), 
                "0x0000000000000000000000000000000000000000",
                values["sellerFundsRecipient"],
                (Number(values["findersFeeBps"]).toFixed(2)) * 100 // converts inputted % into a whole number of basis points between 0 - 10000
              ));
              await txCur.wait();
              updateOneOldEnglish(id);
              setListing(false);
            } catch (e) {
              console.log("create ask failed", e);
              setListing(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            style={{marginTop: 0, marignBottom: 0, paddingTop: 0, paddingBottom: 0}}              
            name="askPrice"
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
          <Form.Item
            style={{marginTop: 0, marignBottom: 0, paddingTop: 0, paddingBottom: 0}}
            name="sellerFundsRecipient"
            label="SELLER FUNDS RECIPIENT"
            rules={[
              {
                required: true,
                message: "WHO GETS THE FUNDS FROM THIS SALE?",
              },
            ]}
          >
            <Input
            placeholder={"FULL WALLET ADDRESS (NO .ETH NAMES)"}
            />
          </Form.Item>
          <Form.Item
            style={{marginTop: 0, marignBottom: 0, paddingTop: 0, paddingBottom: 0}}
            name="findersFeeBps"
            rules={[
              {
                required: true,
                message: "INPUT REQUIRED IF 'FINDER'S FEE IS SELECTED'",
              },
            ]}
          >
            <div>
              <Radio.Group>
                <Radio onClick={createHandleClickFalse} value={""}>ADD FINDER'S FEE</Radio>                
                <Radio onClick={createHandleClickTrue} value={"0x0000000000000000000000000000000000000000"}>NO FINDER'S FEE</Radio>
              </Radio.Group>
              <Input            
              style={{ marginTop: "5px", width: "50%" }}
              addonAfter={"%"}
              disabled={createFinderIsDisabled}
              />
            </div>
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
    );
  };   */

  //========== ZORA UPDATE ASK FLOW ==========
  const [setAskForm] = Form.useForm();
  const updateAskPrice = id => {
    const [set, setSet] = useState(false);

    return (
      <div>
        <Form
          className="updateAskFormPopoverManager"
          form={setAskForm}
          name="update ask price"
          initialValues={{ 
            tokenId: id,
            updatedPrice: '',
          }}
          onFinish={async values => {
            setSet(true);
            try {
              const txCur = await tx(writeContracts[zoraAsksContract].setAskPrice(
                lostandfoundNFTContractAddress,
                id,
                ethers.utils.parseUnits(values["updatedPrice"], 'ether'), 
                "0x0000000000000000000000000000000000000000"
              ));
              await txCur.wait();
              updateOneOldEnglish(id);
              setSet(false);
            } catch (e) {
              console.log("UPDATE LISTING PRICE FAILED", e);
              setSet(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            name="updatedPrice"
            rules={[
              {
                required: true,
                message: "WHAT IS THE UPDATED LISTING PRICE?",
              },
            ]}
          >
            <Input
            style={{width: "300px"}}
            placeholder={"UPDATED LISTING PRICE"}
            addonAfter={"ETH"}
            />
          </Form.Item>                
          <Form.Item>
            <Button
            style={{ backgroundColor: "#579dfa", color: "#283cc4", border: "4px solid #283cc4", fontSize: "1.25rem", height: "auto", borderRadius: 20  }} 
            type="primary"
            htmlType="submit"
            loading={set}
            >
              UPDATE
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };  

  //========== ZORA CANCEL ASK FLOW ==========
/*   const [cancelAskForm] = Form.useForm();
  const cancelAsk = id => {
    const [cancel, setCancel] = useState(false);

    return (
      <div>
        <Form
          className="cancelAskFormPopoverManager"
          form={cancelAskForm}
          name="cancel ask "
          initialValues={{ 
            tokenId: id,
          }}
          onFinish={async values => {
            setCancel(true);
            try {
              const txCur = await tx(writeContracts[zoraAsksContract].cancelAsk(
                lostandfoundNFTContractAddress,
                id
              ));
              await txCur.wait();
              updateOneOldEnglish(id);
              setCancel(false);
            } catch (e) {
              console.log("CANCEL ASK FAILED", e);
              setCancel(false);
            }
          }}
          onFinishFailed={onFinishFailed}
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
    );
  };   */

  //========== ZORA FILL ASK FLOW ==========
  const [fillAskForm] = Form.useForm();
  const fillAsk = id => {
    const [fill, setFill] = useState(false);

    return (
      <div>
        <Form
          className="filllAskFormPopoverManager"      
          form={fillAskForm}
          name="fill ask "
          initialValues={{ 
            tokenId: id,
            finderAddress: '',
          }}
          onFinish={async values => {
            setFill(true);
            try {
              const txCur = await tx(writeContracts[zoraAsksContract].fillAsk(
                lostandfoundNFTContractAddress,
                id,
                "0x0000000000000000000000000000000000000000", // 0 address for ETH sale               
                BigNumber.from(allOldEnglish[id].askSeller.askPrice).toString(),
                values['finderAddress'],
                { value: BigNumber.from(allOldEnglish[id].askSeller.askPrice).toString() }
              ));
              await txCur.wait();
              updateOneOldEnglish(id);
              setFill(false);
            } catch (e) {
              console.log("FILL ASK FAILED", e);
              setFill(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >                
          <Form.Item
            name="finderAddress"
            rules={[
              {
                required: true,
                message: "WHO FACILITATED THIS SALE?",
              },
            ]}
          >
            <div className="fillAskPopver">
              <Radio.Group >
                <Radio onClick={fillHandleClickFalse} value={""}>REWARD A FINDER</Radio>                
                <Radio onClick={fillHandleClickTrue} value={"0x0000000000000000000000000000000000000000"}>NO FINDER INVOLVED</Radio>
              </Radio.Group>
              <Input
                style={{ marginTop: "5px", width: "100%" }}
                placeholder={"FINDER WALLET ADDRESS (NO .ETH NAMES)"}
                disabled={fillFinderIsDisabled}
              />
            </div>
          </Form.Item>        
          <Form.Item>
            <Button
            style={{ backgroundColor: "#72a500", color: "#005a00", border: "4px solid #005a00", fontSize: "1.25rem", height: "auto", borderRadius: 20  }} 
            type="primary"
            htmlType="submit"
            loading={fill}>
              BUY
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };

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

  //========== 0x Protocol Create Order Flow ==========
  const [createOrderForm] = Form.useForm();
  const createOrder = id => {
    const [listing, setListing] = useState(false);

    const CHAIN_ID = userSigner.provider._network && userSigner.provider._network.chainId; // 3 = ropsten, 10 = optimism

    const nftSwapSdk = new NftSwapV4(localProvider, userSigner, CHAIN_ID);

    const specificNftId = {
      tokenAddress: lostandfoundNFTContractAddress, //ropsten deployment
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
                const txCur = await nftSwapSdk.approveTokenOrNftByAsset(
                nftToSwapUserA,
                walletAddressUserA
                );
              const approvalTxReceipt = await txCur.wait();
          /*          console.log(
              `Approved ${assetsToSwapUserA[0].tokenAddress} contract to swap with 0x v4 (txHash: ${approvalTxReceipt.transactionHash})`
              ); */
              }   

              console.log("starting order build...")
              const order = nftSwapSdk.buildOrder(
                nftToSwapUserA,
                {
                  tokenAddress: ETH_ADDRESS_AS_ERC20,
                  amount: ethers.utils.parseUnits(values["listingPrice"], 'ether').toString(), // THIS IS THE ONLY VALUE GETTING UPDATED IN FORM
                  type: 'ERC20'
                },
                walletAddressUserA
              );
              const txCur2 = await nftSwapSdk.exchangeProxy.preSignERC721Order(order); 
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








 // Check if we need to approve the NFT for swapping
/*     const approvalStatusForUserA = await nftSwapSdk.loadApprovalStatus(
      nftToSwapUserA,
      walletAddressUserA
    );

    // If we do need to approve User A's NFT for swapping, let's do that now
    if (!approvalStatusForUserA.contractApproved) {
      const approvalTx = await nftSwapSdk.approveTokenOrNftByAsset(
      nftToSwapUserA,
      walletAddressUserA
      );
    const approvalTxReceipt = await approvalTx.wait(); */
/*          console.log(
    `Approved ${assetsToSwapUserA[0].tokenAddress} contract to swap with 0x v4 (txHash: ${approvalTxReceipt.transactionHash})`
    ); */
/*     }   

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

  }   */

   //========== 0x Protocol Cancel Order Flow ==========  
  const [cancelOrderForm] = Form.useForm();
  const cancelOrder = id => {
    const [cancel, setCancel] = useState(false);

    const CHAIN_ID = userSigner.provider._network && userSigner.provider._network.chainId; // 3 = ropsten, 10 = optimism

    const nftSwapSdk = new NftSwapV4(localProvider, userSigner, CHAIN_ID);

    const tokensQuery = `
    query {
      erc721Orders(
        orderBy: nonce
        where: {erc721Token: "${lostandfoundNFTContractAddress}", erc721TokenId: "${id}" }
      ) {
        id
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
      }
    }
  `
  
  const client = createClient({
    url: APIURL
  })

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
            console.log("Order Nonce Being Cancelled: ", orderNonceToCancel);
            try {
              const txCur = await tx(nftSwapSdk.exchangeProxy.cancelERC721Order(orderNonceToCancel))
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
  
/*   const cancelOrder = async () => {
      
    const CHAIN_ID = 3; //3 = ropsten

    const nftSwapSdk = new NftSwapV4(localProvider, userSigner, CHAIN_ID);

    const orderNonce = "100131415900000000000000000000000000000160812848772371044860429851089384113904";

    const cancelOrder = await nftSwapSdk.exchangeProxy.cancelERC721Order(orderNonce); 

  } */

    //=======0x Protocol Fill Order Flow===========

    const fillOrder = async () => {

      const CHAIN_ID = 3; // 3 = ropsten, 10 = optimism

      console.log ("fillOrder function running");

      const lostandfound_token_0 = {
        tokenAddress: '0xd373B9C8acc3439d42359bDAd3a0e3cC4BD0Ff66', //ropsten nft contract deployment
        tokenId: '0', //this should be angel
        type: 'ERC721'
      }

      const price_to_list_for = {
        tokenAddress: ETH_ADDRESS_AS_ERC20, 
        amount: "10000000000000000", //16 zeroes aka 0.01eth
        type: 'ERC20'
      }      

      const walletAddressUserB = '0x153D2A196dc8f1F6b9Aa87241864B3e4d4FEc170'
      const ethToSwapUserB = price_to_list_for;

      const nftSwapSdk = new NftSwapV4(localProvider, userSigner, CHAIN_ID);

   // Check if we need to approve the NFT for swapping
      const approvalStatusForUserB = await nftSwapSdk.loadApprovalStatus(
        ethToSwapUserB,
        walletAddressUserB
      );      

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

      const reconstructedOnchainOrder = [
        0, // trade direction (0 = sell, 1 = buy)
        "0x806164c929Ad3A6f4bd70c2370b3Ef36c64dEaa8", // maker address
        "0x0000000000000000000000000000000000000000", // taker address 
        "2524604400", // expiry from creation of original order?
        "100131415900000000000000000000000000000160812848772371044860429851089384113904",
        // nonce
        ETH_ADDRESS_AS_ERC20, // erc20token
        "10000000000000000", // erc20 token amount (hardhcoded to 0.01 eth)
        [], // fees (none included atm)
        "0xd373b9c8acc3439d42359bdad3a0e3cc4bd0ff66", // erc721 nft contract
        "2", // erc721 nft contract token id
        [] // erc721 token properties (none included atm)
      ]

      const nullSignatureStruct = {
        // These value indicates that the order maker has previously marked the order as fillable on-chain. The remaining fields in the Signature struct will be ignored.
        // link to where this explanation comes from: https://docs.0x.org/protocol/docs/signatures         
        "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "v": 0,
        "signatureType": 4
      }

      const fillTx = await nftSwapSdk.exchangeProxy.buyERC721(
        reconstructedOnchainOrder,
        nullSignatureStruct,
        "0x", // taker address
        { value: BigNumber.from("10000000000000000").toString() }
      );

      const fillTxReceipt = await nftSwapSdk.awaitTransactionHash(fillTx);
      console.log('Filled order! 🎉', fillTxReceipt.transactionHash); 
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
                              <Button disabled={false} onClick={fillOrder} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
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
                                    <Popover
                                      className="fillAskPopver"
                                      content={() => {                                                        
                                        return fillAsk(id);
                                      }}                                      
                                    >  
                                      <Button style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                                    </Popover>
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
