import { ChainId } from "../../schema";

export default {
  chainId: ChainId.Sonic,
  name: "Sonic",
  logo: "https://www.soniclabs.com/favicon.ico",
  nativeLogo: "https://www.soniclabs.com/favicon.ico",
  scanLink: "https://sonicscan.org",
  multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
  defaultRpc: "https://rpc.soniclabs.com",
  wrappedToken: {
    name: "Wrapped Sonic",
    address: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38",
    symbol: "wS",
    decimals: 18,
  },
  zapPath: "sonic",
};
