# xCall-Multi (xCall v2) jvm-jvm demo

This repository is a demo to showcase xcall-multi on a JVM-JVM cross-chain scenario, for this example the Lisbon testnet on ICON is used as the origin chain and the Altair testnet on Havah is used for the destination chain.

The demo allows you to deploy a dapp sample contract that interacts with xcall-multi on both Lisbon and Altair, and lets you run a full trace of a cross chain message being sent from Lisbon to Altair tracing step by step all the interactions of the lifecycle of the cross-chain message.

The steps for the lifecycle of a cross-chain message with xcall-multi are the following:

* Execute a transaction calling the `sendMessage` method of the sample dapp.
* Fetch the `CallMessage` event generated on the origin chain by the xcall-multi contract.
* Fetch the `CallMessageSent` event generated on the destination chain by the xcall-multi contract.
* Execute a transaction calling the `executeCall` method of the xcall-multi contract on the destination chain.
* Fetch the `CallExecuted` event generated on the destination chain by the xcall-multi contract.
* Fetch the `ResponseMessage` event generated on the origin chain by the xcall-multi contract.
* Fetch the `RollbackMessage` event generated on the origin chain by the xcall-multi contract.
* Execute a transaction calling the `executeRollback` method of the xcall-multi contract on the origin chain.
* Fetch the `RollbackExecuted` event generated on the origin chain by the xcall-multi contract.

## Setup

Create a `.env` file in the root folder and place the private keys of a wallet on Altair and Sepolia with enough balance to deploy and run the DApp test scenarios.
```bash
PK_ICON="ICON WALLET PRIVATE KEY"
PK_HAVAH="HAVAH WALLET PRIVATE KEY"
```

Run command to install node packages.
```
npm install
```

## Run main script

To deploy the contracts run the following command.
```
npm run deploy
```

To run the demo sending a cross-chain transaction run the following command:
```
npm run send-msg
```
