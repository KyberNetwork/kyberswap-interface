import { ChainId } from "@/schema/chain";
import thenaLogo from "@/assets/dexes/thena.png";

export default {
  icon: thenaLogo,
  name: "Thena",
  nftManagerContract: {
    //[ChainId.Bsc]: "0x643B68Bf3f855B8475C0A700b6D1020bfc21d02e",
    [ChainId.Bsc]: "0xa51ADb08Cbe6Ae398046A23bec013979816B77Ab",
  },
};
