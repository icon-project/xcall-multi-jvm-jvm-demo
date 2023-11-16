// Imports
const IconService = require("icon-sdk-js");
const { rpc, dappSimple, contract } = require("../utils/config");
const {
  //
  getScoreApi
} = require("../utils/lib");

const { HttpProvider } = IconService.default;

const HTTP_PROVIDER = new HttpProvider(rpc.lisbon);
const HTTP_PROVIDER2 = new HttpProvider(rpc.altair);

const ICON_SERVICE = new IconService.default(HTTP_PROVIDER);
const HAVAH_SERVICE = new IconService.default(HTTP_PROVIDER2);

/*
 */
async function test() {
  try {
    // fetching score ABI from lisbon contract
    const lisbonABI = await getScoreApi(dappSimple.lisbon, ICON_SERVICE);
    console.log("lisbonABI");
    console.log(JSON.stringify(lisbonABI.getList()));

    // fetching score ABI from altair contract
    const havahABI = await getScoreApi(dappSimple.altair, HAVAH_SERVICE);
    console.log("havahABI");
    console.log(JSON.stringify(havahABI.getList()));

    // fetching score ABI from altair contract
    const xcallABI = await getScoreApi(
      contract.lisbon["xcall-multi"],
      ICON_SERVICE
    );
    console.log("xcallABI");
    console.log(JSON.stringify(xcallABI.getList()));
  } catch (e) {
    console.log("error running tests", e);
  }
}

/*
 * Main
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // deploy contracts
    await test();
  } catch (e) {
    console.log("error running main", e);
  }
}

main();
