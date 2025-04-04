import { ChainId } from "@/schema";
import koiclLogo from "@/assets/dexes/koicl.png";

export default {
  icon: koiclLogo,
  name: "KOI CL",
  nftManagerContract: {
    [ChainId.ZkSync]: "0xa459EbF3E6A6d5875345f725bA3F107340b67732",
  },
};
