require("dotenv").config();
const { PK_ICON, PK_HAVAH } = process.env;

const config = {
  rpc: {
    altair: "https://ctz.altair.havah.io/api/v3/icon_dex",
    lisbon: "https://lisbon.net.solidwallet.io/api/v3"
  },
  tracker: {
    havah: {
      hostname: "https://scan.altair.havah.io/"
    },
    lisbon: {
      hostname: "tracker.lisbon.icon.community"
    }
  },
  contract: {
    icon: {
      chain: "cx0000000000000000000000000000000000000000",
      governance: "cx0000000000000000000000000000000000000001"
    },
    lisbon: {
      "xcall-multi": "cx15a339fa60bd86225050b22ea8cd4a9d7cd8bb83",
      bmc: "cx2e230f2f91f7fe0f0b9c6fe1ce8dbba9f74f961a"
    },
    altair: {
      "xcall-multi": "cxf35c6158382096ea8cf7c54ee338ddfcaf2869a3",
      bmc: "cx60c1557a511326d16768b735c944023b514b55dc"
    }
  },
  nid: {
    localhost: 3,
    berlin: 7,
    custom: 3,
    altair: 273,
    lisbon: 2
  },
  network: {
    lisbon: {
      label: "0x2.icon"
    },
    altair: {
      label: "0x111.icon"
    }
  },
  dappSimple: {
    lisbon: "cx7fb3da06d7f6b19f61b0401eabc81c4d8ba5942c",
    altair: "cx8575a4f97bb89c284d4a734e4926884d90c22871"
  }
};

module.exports = {
  ...config,
  PK_ICON: PK_ICON,
  PK_HAVAH: PK_HAVAH,
  dappSimplePath: "./contracts/dapp-simple-0.1.0-optimized.jar"
};
