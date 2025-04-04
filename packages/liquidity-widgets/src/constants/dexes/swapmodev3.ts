import { ChainId } from "@/schema";
import swapmodeLogo from "@/assets/dexes/swapmode.png";

export default {
  icon: swapmodeLogo,
  name: new Proxy(
    {
      [ChainId.Base]: "Baseswap",
      [ChainId.Arbitrum]: "Arbidex",
      [ChainId.Optimism]: "Superswap",
    } as Record<number, string>,
    {
      get: function (target, name) {
        if (
          [ChainId.Base, ChainId.Arbitrum, ChainId.Optimism].includes(
            Number(name)
          )
        ) {
          return target[Number(name)];
        }
        return "Swapmode";
      },
    }
  ),
  nftManagerContract: {
    [ChainId.Arbitrum]: "0x81F2c375AEDbdF02f11c1Ae125e2f51Efa777cEa",
    [ChainId.Base]: "0xDe151D5c92BfAA288Db4B67c21CD55d5826bCc93",
    [ChainId.Optimism]: "0x74a52eb08d699CD8BE1d42dA4B241d526B8a8285",
  },
};
