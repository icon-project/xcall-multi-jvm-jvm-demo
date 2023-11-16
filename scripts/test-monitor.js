// Imports
const IconService = require("icon-sdk-js");
const { rpc, contract, dappSimple } = require("../utils/config");

const { Monitor } = require("../utils/monitor");

const { HttpProvider } = IconService.default;

const HTTP_PROVIDER2 = new HttpProvider(rpc.altair);

const HAVAH_SERVICE = new IconService.default(HTTP_PROVIDER2);

const monitor = new Monitor(
  HAVAH_SERVICE,
  contract.altair["xcall-multi"],
  dappSimple.altair
);
monitor.start();
console.log("monitor started");
monitor.close();
console.log("monitor stopped");
