interface Environment {
  explorerUrl: string;
  providerUrl: string;
  faucetUrl: string;
}

const devnet: Environment = {
  explorerUrl: "https://devnet.starkscan.co",
  providerUrl: "http://127.0.0.1:5050/rpc",
  faucetUrl: "",
};

const katana: Environment = {
  explorerUrl: "",
  providerUrl: "http://0.0.0.0:5050",
  faucetUrl: "",
};

const madara: Environment = {
  explorerUrl: "",
  providerUrl: "http://127.0.0.1:9944",
  faucetUrl: "",
};

// eslint-disable-next-line import/no-mutable-exports
let environment: Environment;

switch (process.env.NEXT_PUBLIC_NETWORK_ENV) {
  case "devnet":
    environment = devnet;
    break;
  case "madara":
    environment = madara;
    break;
  default:
    environment = katana;
    break;
}

export default environment;
