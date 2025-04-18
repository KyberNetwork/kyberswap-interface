import { ChainId } from "@/schema";
import kodiakLogo from "@/assets/dexes/kodiak.png";

export default {
  icon: kodiakLogo,
  name: "Kodiak V3",
  nftManagerContract: {
    [ChainId.Berachain]: "0xFE5E8C83FFE4d9627A75EaA7Fee864768dB989bD",
  },
};
