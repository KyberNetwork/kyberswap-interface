import { ChainId } from "@/schema/chain";
import linehubLogo from "@/assets/dexes/linehub.svg?url";

export default {
  icon: linehubLogo,
  name: "LineHub V3",
  nftManagerContract: {
    [ChainId.Linea]: "0xD27166FA3E2c1a2C1813d0fe6226b8EB21783184",
  },
};
