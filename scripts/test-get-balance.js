// Imports
const IconService = require("icon-sdk-js");
const { rpc, PK_ICON, PK_HAVAH } = require("../utils/config");
const {
  //
  getIcxBalance,
  makeShortUrl,
  parseBalance
} = require("../utils/lib");

const { IconWallet } = IconService.default;

const ICON_WALLET = IconWallet.loadPrivateKey(PK_ICON);
const HAVAH_WALLET = IconWallet.loadPrivateKey(PK_HAVAH);

/*
 */
async function test() {
  try {
    const havahBalance = await getIcxBalance(
      HAVAH_WALLET.getAddress(),
      makeShortUrl(rpc.altair)
    );
    const iconBalance = await getIcxBalance(
      ICON_WALLET.getAddress(),
      makeShortUrl(rpc.lisbon)
    );

    console.log("balance");
    console.log(parseBalance(iconBalance));
    console.log(parseBalance(havahBalance));
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
    // run tests
    await test();
  } catch (e) {
    console.log("error running main", e);
  }
}

main();
