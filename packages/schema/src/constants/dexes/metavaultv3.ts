import { ChainId } from "@/schema/chain";
import metavaultLogo from "@/assets/dexes/metavault.svg?url";

export default {
  icon: metavaultLogo,
  name: "Metavault V3",
  nftManagerContract: {
    [ChainId.Linea]: "0x5979C5315625276ff99a56f95eE5cC44293e7b36",
    [ChainId.Scroll]: "0x5979C5315625276ff99a56f95eE5cC44293e7b36",
  },
};
