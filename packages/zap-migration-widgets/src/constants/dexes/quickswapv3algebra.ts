import { ChainId } from "../../schema";
import quickswapLogo from "../../assets/dexes/quickswap.png";

export default {
  icon: quickswapLogo,
  name: "QuickSwap",
  nftManagerContract: {
    [ChainId.PolygonPos]: "0x8eF88E4c7CfbbaC1C163f7eddd4B578792201de6",
  },
};
