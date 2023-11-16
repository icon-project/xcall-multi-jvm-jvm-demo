// Imports
const { rpc, dappSimple, contract } = require("../utils/config");
const {
  //
  makeShortUrl,
  getNetworkId
} = require("../utils/lib");

if (dappSimple.lisbon == null) {
  throw new Error("Cant find Dapp contract deployed to lisbon");
}
if (dappSimple.altair == null) {
  throw new Error("Cant find Dapp contract deployed to altair");
}

/*
 */
async function test() {
  try {
    // get network ID on lisbon
    const lisbonUrl = makeShortUrl(rpc.lisbon);
    const iconId = await getNetworkId(
      contract.lisbon["xcall-multi"],
      lisbonUrl
    );
    console.log("lisbon id");
    console.log(iconId);

    // get network ID on altair
    const altairUrl = makeShortUrl(rpc.altair);
    const havahId = await getNetworkId(
      contract.altair["xcall-multi"],
      altairUrl
    );
    console.log("havah id");
    console.log(havahId);
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
