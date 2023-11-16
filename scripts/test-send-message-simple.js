// Imports
const IconService = require("icon-sdk-js");
const { encodeMessage } = require("../utils/utils");
const {
  rpc,
  contract,
  nid,
  network,
  PK_HAVAH,
  PK_ICON,
  dappSimple
} = require("../utils/config");
const {
  //
  getTxResult,
  filterCallMessageSentEvent,
  parseCallMessageSentEvent,
  parseCallMessageEvent,
  callDappContractMethod,
  filterCallExecutedEvent
} = require("../utils/lib");

const { Monitor } = require("../utils/monitor");

const { HttpProvider, IconWallet } = IconService.default;

const HTTP_PROVIDER = new HttpProvider(rpc.lisbon);
const HTTP_PROVIDER2 = new HttpProvider(rpc.altair);

const ICON_SERVICE = new IconService.default(HTTP_PROVIDER);
const HAVAH_SERVICE = new IconService.default(HTTP_PROVIDER2);
const ICON_WALLET = IconWallet.loadPrivateKey(PK_ICON);
const HAVAH_WALLET = IconWallet.loadPrivateKey(PK_HAVAH);

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
    // initialize block monitor on destination chain (havah)
    const monitor = new Monitor(
      HAVAH_SERVICE,
      contract.altair["xcall-multi"],
      dappSimple.altair
    );
    const monitorOrigin = new Monitor(
      ICON_SERVICE,
      contract.lisbon["xcall-multi"],
      dappSimple.lisbon
    );

    // start monitor on both chains
    monitor.start();
    monitorOrigin.start();

    // message to send
    let msgString = "hello world";
    const rollbackString = "use Rollback";
    const triggerErrorForRollback = true;

    // to trigger a rollback, the message must be "rollback"
    // and in that case the `MessageReceived` event
    // will not be emmitted
    if (triggerErrorForRollback) {
      msgString = "rollback";
    }

    const msg = encodeMessage(msgString);
    const rollback = encodeMessage(rollbackString);
    const altairDestinationAddress = `${network.altair.label}/${dappSimple.altair}`;

    const paramsToAltair = {
      _to: altairDestinationAddress,
      _data: msg,
      _rollback: rollback
    };

    // send message
    const tx = await callDappContractMethod(
      "sendMessage",
      dappSimple.lisbon,
      ICON_WALLET,
      nid.lisbon,
      ICON_SERVICE,
      paramsToAltair,
      true, // set to false if paramsToAltair._rollback is null
      true
    );
    console.log(`\n> Sending message from Lisbon to Altair. Tx hash: ${tx}`);
    console.log(tx);

    // wait tx result
    const txResult = await getTxResult(tx, ICON_SERVICE);
    console.log(`\n> Sending message from Lisbon to Altair. Tx result:`);
    console.log(JSON.stringify(txResult));

    // filter CallMessageSentEvent
    const callMsgSentEvent = await filterCallMessageSentEvent(
      txResult.eventLogs,
      contract.lisbon["xcall-multi"],
      false
    );
    console.log(`\n> Filtering CallMessageSentEvent:`);
    console.log(callMsgSentEvent);

    // parse CallMessageSentEvent
    const parsedCallMsgSentEvent = await parseCallMessageSentEvent(
      callMsgSentEvent,
      false
    );
    console.log(`\n> Parsing CallMessageSentEvent:`);
    console.log(parsedCallMsgSentEvent);

    // get _sn from source
    const snFromSource = parsedCallMsgSentEvent._sn;
    console.log(`\n> Source SN: ${snFromSource}`);

    // wait for the monitor to fetch events
    await monitor.waitForEvents("CallMessage", snFromSource);

    // Access events after the monitor has fetched them
    const callMsgEvents = monitor.events.CallMessage;
    console.log(`\n> Filtering CallMessage event on destination:`);
    console.log(callMsgEvents);

    // parse CallMessage event on destination
    const parsedCallMsgEvent = await parseCallMessageEvent(callMsgEvents);
    console.log(`\n> Parsing CallMessage event on destination:`);
    console.log(parsedCallMsgEvent);

    const txExecuteCall = await callDappContractMethod(
      "executeCall",
      contract.altair["xcall-multi"],
      HAVAH_WALLET,
      nid.altair,
      HAVAH_SERVICE,
      {
        _reqId: parsedCallMsgEvent._nsn,
        _data: parsedCallMsgEvent._data
      },
      false
    );
    console.log(`\n> Sending transaction to executeCall:`);
    console.log(txExecuteCall);

    // wait tx result
    const txResultExecuteCall = await getTxResult(txExecuteCall, HAVAH_SERVICE);
    console.log(`\n> Sending transaction to executeCall. Tx result:`);
    console.log(txResultExecuteCall);
    console.log(JSON.stringify(txResultExecuteCall));

    // filter CallExecuted event
    const callExecutedEvent = await filterCallExecutedEvent(
      txResultExecuteCall.eventLogs,
      contract.altair["xcall-multi"]
    );
    console.log(`\n> Filtering CallExecuted event:`);
    console.log(callExecutedEvent);

    // fetching MessageReceived event on destination if no rollback
    if (!triggerErrorForRollback) {
      await monitor.waitForEvents("MessageReceived", msg);
      // Access events after the monitor has fetched them
      const msgReceivedEvents = monitor.events.MessageReceived;
      console.log(`\n> Filtering MessageReceived event on destination:`);
      console.log(msgReceivedEvents);
    } else {
      console.log(
        `\n> Bypassing fetching MessageReceived event on destination beacuse of rollback`
      );
    }

    // wait for the monitor to fetch ResponseMessage event
    await monitorOrigin.waitForEvents("ResponseMessage", snFromSource);
    const responseMsgEvents = monitorOrigin.events.ResponseMessage;
    console.log(`\n> Filtering ResponseMessage event on source:`);
    console.log(responseMsgEvents);

    if (triggerErrorForRollback) {
      // wait for the monitor to fetch RollbackMessage event
      await monitorOrigin.waitForEvents("RollbackMessage", snFromSource);
      const rollbackMsgEvents = monitorOrigin.events.RollbackMessage;
      console.log(`\n> Filtering RollbackMessage event on source:`);
      console.log(rollbackMsgEvents);

      // execute rollback transaction
      const txExecuteRollback = await callDappContractMethod(
        "executeRollback",
        contract.lisbon["xcall-multi"],
        ICON_WALLET,
        nid.lisbon,
        ICON_SERVICE,
        {
          _sn: snFromSource
        },
        false
      );
      console.log(`\n> Sending transaction to executeRollback:`);
      console.log(txExecuteRollback);

      // wait tx result
      const txResultExecuteRollback = await getTxResult(
        txExecuteRollback,
        ICON_SERVICE
      );
      console.log(`\n> Sending transaction to executeRollback. Tx result:`);
      console.log(txResultExecuteRollback);
      console.log(JSON.stringify(txResultExecuteRollback));

      // filter RollbackExecuted event
      await monitorOrigin.waitForEvents("RollbackExecuted", snFromSource);
      const rollbackExecutedEvents = monitorOrigin.events.RollbackExecuted;
      console.log(`\n> Filtering RollbackExecuted event on source:`);
      console.log(rollbackExecutedEvents);
    } else {
      console.log("\n> Bypassing rollback transaction");
    }

    // close monitors
    monitor.close();
    monitorOrigin.close();
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
