// Imports
const IconService = require("icon-sdk-js");
const { getContractByteCode } = require("../utils/utils");
const {
  rpc,
  contract,
  nid,
  // network,
  PK_ICON,
  PK_HAVAH,
  dappSimplePath,
  dappSimple
} = require("../utils/config");
const {
  //
  deployIconContract,
  getTxResult
} = require("../utils/lib");

const { HttpProvider, IconWallet } = IconService.default;

const HTTP_PROVIDER = new HttpProvider(rpc.lisbon);
const HTTP_PROVIDER2 = new HttpProvider(rpc.altair);

const ICON_SERVICE = new IconService.default(HTTP_PROVIDER);
const HAVAH_SERVICE = new IconService.default(HTTP_PROVIDER2);
const ICON_WALLET = IconWallet.loadPrivateKey(PK_ICON);
const HAVAH_WALLET = IconWallet.loadPrivateKey(PK_HAVAH);

const contractByteCode = getContractByteCode(dappSimplePath);
// const contractByteCode = getContractBytesFromJson(dappJsonPath).hash;

let RUN_ICON_DEPLOYMENT = false;
let RUN_HAVAH_DEPLOYMENT = false;

if (!dappSimple.lisbon) {
  RUN_ICON_DEPLOYMENT = true;
} else {
  console.log(`Dapp already deployed to lisbon: ${dappSimple.lisbon}`);
}
if (!dappSimple.altair) {
  RUN_HAVAH_DEPLOYMENT = true;
} else {
  console.log(`Dapp already deployed to altair: ${dappSimple.altair}`);
}

/*
 */
async function deploy() {
  const paramsIcon = {
    _callService: contract.lisbon["xcall-multi"]
  };
  const paramsHavah = {
    _callService: contract.altair["xcall-multi"]
  };

  try {
    if (RUN_ICON_DEPLOYMENT === true) {
      // deploy contract to ICON Lisbon
      const iconDeployTxHash = await deployIconContract(
        paramsIcon,
        ICON_SERVICE,
        ICON_WALLET,
        nid.lisbon,
        contractByteCode
      );
      // get transaction result
      const iconTxResult = await getTxResult(iconDeployTxHash, ICON_SERVICE);
      console.log("iconTxResult");
      console.log(iconTxResult);
    }

    if (RUN_HAVAH_DEPLOYMENT === true) {
      // deploy contract to ICON Lisbon
      const havahDeployTxHash = await deployIconContract(
        paramsHavah,
        HAVAH_SERVICE,
        HAVAH_WALLET,
        nid.altair,
        contractByteCode
      );
      // get transaction result
      const havahTxResult = await getTxResult(havahDeployTxHash, HAVAH_SERVICE);
      console.log("havahTxResult");
      console.log(havahTxResult);
    }
  } catch (e) {
    console.log("error running deployments", e);
  }
}

/*
 * Main
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // deploy contracts
    await deploy();
  } catch (e) {
    console.log("error running main", e);
  }
}

main();
