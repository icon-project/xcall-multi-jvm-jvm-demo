const IconService = require("icon-sdk-js");
const utils = require("./utils");
// const { Web3 } = require("web3");
const { ethers } = require("ethers");
const { BigNumber } = ethers;
const fs = require("fs");

const {
  // config values
  contract,
  PK_SEPOLIA,
  USE_NID,
  nid,
  ICON_RPC_URL,
  EVM_RPC_URL,
  jarPath,
  solPath,
  XCALL_PRIMARY,
  XCALL_SECONDARY,
  NETWORK_LABEL_PRIMARY,
  NETWORK_LABEL_SECONDARY,
  deploymentsPath,
  xcallAbiPath,
  customRequest,
  // methods
  getIconContractByteCode,
  isDeployed,
  saveDeployments,
  getDeployments,
  getEvmContract,
  getDappContract,
  getXcallContract,
  getIconDappDeploymentsParams,
  getBtpAddress,
  filterEventICON,
  filterCallMessageSentEvent,
  sleep,
  strToHex,
  strToHexPadded,
  filterCallExecutedEvent
} = utils;

const { IconBuilder, IconConverter, SignedTransaction } = IconService.default;

// validate configs
// validateConfig();

const { CallTransactionBuilder, CallBuilder } = IconBuilder;

/*
 * Validate the config values
 * @throws {Error} - if there is an error validating the config values
 */
function validateConfig() {
  try {
    // if (PK_BERLIN == null) {
    //   throw new Error("PK_BERLIN is not set");
    //  if (
    //   PK_SEPOLIA == null ||
    //   (typeof PK_SEPOLIA !== "string" && PK_SEPOLIA.slice(0, 2) !== "0x")
    // ) {
    //   throw new Error("PK_SEPOLIA is not set");
    // }
    // if (!fileExists(jarPath)) {
    //   throw new Error("compile java contract not found");
    // }
    // if (!fileExists(solPath)) {
    //   throw new Error("compile solidity contract not found");
    // }
  } catch (e) {
    console.log(e.message);
    throw new Error("Error validating config");
  }
}

/*
 * deployIconContract - deploys the contract on ICON
 * @param {object} params - the params for the Icon contract
 * @returns {object} - the result of the transaction
 * @throws {Error} - if there is an error deploying the contract
 */
async function deployIconContract(
  params,
  iconService,
  iconWallet,
  nid,
  contractContent = null
) {
  try {
    let content;
    if (contractContent == null) {
      content = getIconContractByteCode();
    } else {
      content = contractContent;
    }

    const payload = new IconBuilder.DeployTransactionBuilder()
      .contentType("application/java")
      .content(`0x${content}`)
      .params(params)
      .from(iconWallet.getAddress())
      .to(contract.icon.chain)
      .nid(nid)
      .version(3)
      .nonce(100)
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(2500000000))
      .build();

    const signedTx = new SignedTransaction(payload, iconWallet);
    return await iconService.sendTransaction(signedTx).execute();
  } catch (e) {
    console.log("error deploying contract", e);
    throw new Error("Error deploying contract");
  }
}

/*
 * getScoreApi - returns the abi of the contract
 * @param {string} contract - the address of the contract
 * @returns {object} - the abi of the contract
 * @throws {Error} - if there is an error getting the abi
 */
async function getScoreApi(contract, service) {
  try {
    return await service.getScoreApi(contract).execute();
  } catch (e) {
    console.log("error getting abi", e);
    throw new Error("Error getting abi");
  }
}

/*
 * parseCallMessageSentEvent - parses the CallMessageSent event logs
 * @param {object} event - the event logs
 * @returns {object} - the parsed event logs
 * @throws {Error} - if there is an error parsing the event logs
 */
async function parseCallMessageSentEvent(event, useV1 = true) {
  const indexed = event[0].indexed || [];
  const data = event[0].data || [];
  const result = {
    _from: indexed[1],
    _to: indexed[2],
    _sn: indexed[3],
    _nsn: null
  };

  if (useV1 == true) {
    result["_nsn"] = BigNumber.from(data[0]);
  }

  return result;
}

async function parseCallMessageEvent(event) {
  const indexed = event[0].indexed || [];
  const data = event[0].data || [];
  const result = {
    _from: indexed[1],
    _to: indexed[2],
    _sn: indexed[3],
    _nsn: data[0],
    _data: data[1]
  };

  return result;
}

/*
 * getTxResult - gets the transaction result
 * @param {string} txHash - the transaction hash
 * @returns {object} - the transaction result
 * @throws {Error} - if there is an error getting the transaction result
 */
async function getTxResult(txHash, service) {
  const maxLoops = 10;
  let loop = 0;
  while (loop < maxLoops) {
    try {
      return await service.getTransactionResult(txHash).execute();
    } catch (e) {
      console.log(`txResult (pass ${loop}): ${e}`);
      loop++;
      await sleep(1000);
    }
  }
}

/*
 * callDappContractMethod - calls the dapp contract method
 * @param {string} method - the method to call
 * @param {string} contract - the address of the contract
 * @param {boolean} useRollback - whether to use rollback
 * @returns {object} - the transaction receipt
 * @throws {Error} - if there is an error calling the dapp contract method
 */
async function callDappContractMethod(
  method,
  contract,
  wallet,
  nid,
  service,
  params = null,
  useRollback = true,
  getFee = false
) {
  try {
    let fee = "0x0";
    if (getFee == true) {
      fee = await getFeeFromIcon(
        useRollback,
        params._to.split("/")[0],
        service,
        nid == utils.nid.lisbon
          ? utils.contract.lisbon["xcall-multi"]
          : utils.contract.altair["xcall-multi"]
      );
      console.log("# fee", fee);
    }

    const txObj = new CallTransactionBuilder()
      .from(wallet.getAddress())
      .to(contract)
      .stepLimit(IconConverter.toBigNumber(20000000))
      .nid(IconConverter.toBigNumber(nid))
      .nonce(IconConverter.toBigNumber(1))
      .version(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .method(method);
    // .value(fee);
    // .build();

    if (params != null) {
      txObj.params({ ...params });
    }

    if (getFee == true) {
      txObj.value(fee);
    }
    const txObj2 = txObj.build();
    const signedTx = new SignedTransaction(txObj2, wallet);
    console.log("tx params");
    console.log(signedTx.getProperties());
    return await service.sendTransaction(signedTx).execute();
  } catch (e) {
    console.log(e);
    throw new Error("Error calling contract method");
  }
}

/*
 * getFeeFromIcon - calls the getFee method of the xcall contract
 * @param {boolean} useRollback - whether to use rollback
 * @returns {object} - the transaction receipt
 * @throws {Error} - if there is an error getting the fee
 */
async function getFeeFromIcon(useRollback = true, _net, service, contract) {
  try {
    const params = {
      _net: _net,
      _rollback: useRollback ? "0x1" : "0x0"
    };
    // console.log("# params", params);

    const txObj = new CallBuilder()
      .to(contract)
      .method("getFee")
      .params(params)
      .build();

    console.log(txObj);
    return await service.call(txObj).execute();
  } catch (e) {
    console.log("error getting fee", e);
    throw new Error("Error getting fee");
  }
}

function getJson(path) {
  try {
    const content = fs.readFileSync(path);
    const parsed = JSON.parse(content);
    return parsed;
  } catch (err) {
    console.log("error getting json file");
    console.log(err);
    throw new Error("Error getting json file");
  }
}

function getWalletKeystore(path) {
  try {
    return getJson(path);
  } catch (err) {
    console.log("error getting keystore file");
    console.log(err);
    throw new Error("Error getting keystore file");
  }
}

function getContractBytesFromJson(path) {
  try {
    return getJson(path);
  } catch (err) {
    console.log("error getting contract file");
    console.log(err);
    throw new Error("Error getting contract file");
  }
}

function makeJSONRPCRequestObj(method) {
  return {
    jsonrpc: "2.0",
    method: method,
    id: 1234
  };
}

async function getIcxBalance(address, nodeUrl) {
  try {
    const postData = JSON.stringify({
      ...makeJSONRPCRequestObj("icx_getBalance"),
      params: {
        address: address
      }
    });

    const response = await customRequest("/api/v3", postData, nodeUrl);
    return response.result;
  } catch (err) {
    console.log("error getting icx balance");
    console.log(err);
    throw new Error("Error getting icx balance");
  }
}

async function makeCustomReadonlyCall(to, method, nodeUrl, params = null) {
  try {
    const postData = {
      ...makeJSONRPCRequestObj("icx_call"),
      params: {
        to: to,
        dataType: "call",
        data: {
          method: method
        }
      }
    };

    if (params != null) {
      postData.params.data.params = { ...params };
    }

    const response = await customRequest(
      "/api/v3",
      JSON.stringify(postData),
      nodeUrl
    );
    return response;
  } catch (err) {
    console.log("error making custom readonly call");
    console.log(err);
    throw new Error("error making custom readonly call");
  }
}

async function getNetworkId(to, nodeUrl) {
  try {
    return await makeCustomReadonlyCall(to, "getNetworkId", nodeUrl);
  } catch (err) {
    console.log("error getting network id");
    console.log(err);
    throw new Error("error getting network id");
  }
}

function makeShortUrl(url) {
  return url.replace("https://", "").split("/")[0];
}

function parseBalance(rawBalance) {
  return parseInt(rawBalance, 16) / 10 ** 18;
}

const lib = {
  // config values
  contract,
  PK_SEPOLIA,
  USE_NID,
  nid,
  ICON_RPC_URL,
  EVM_RPC_URL,
  jarPath,
  solPath,
  XCALL_PRIMARY,
  XCALL_SECONDARY,
  NETWORK_LABEL_PRIMARY,
  NETWORK_LABEL_SECONDARY,
  deploymentsPath,
  xcallAbiPath,
  // utils
  getIconContractByteCode,
  isDeployed,
  saveDeployments,
  getDeployments,
  getEvmContract,
  getDappContract,
  getXcallContract,
  getIconDappDeploymentsParams,
  getBtpAddress,
  filterEventICON,
  filterCallMessageSentEvent,
  sleep,
  strToHex,
  strToHexPadded,
  // methods
  deployIconContract,
  getTxResult,
  getScoreApi,
  parseCallMessageSentEvent,
  parseCallMessageEvent,
  BigNumber,
  getWalletKeystore,
  getIcxBalance,
  makeShortUrl,
  parseBalance,
  getContractBytesFromJson,
  getNetworkId,
  callDappContractMethod,
  makeCustomReadonlyCall,
  filterCallExecutedEvent
};

module.exports = lib;
