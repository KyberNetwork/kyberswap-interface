import { ChainId } from "@/schema";
import sushiLogo from "@/assets/dexes/sushi.png";

export default {
  icon: sushiLogo,
  name: "SushiSwap V3",
  nftManagerContract: {
    [ChainId.Arbitrum]: "0x96E04591579f298681361C6122Dc4Ef405c19385",
    [ChainId.Avalanche]: "0x18350b048AB366ed601fFDbC669110Ecb36016f3",
    [ChainId.Base]: "0x80C7DD17B01855a6D2347444a0FCC36136a314de",
    [ChainId.Blast]: "0x51edb3e5bcE8618B77b60215F84aD3DB14709051",
    [ChainId.Bsc]: "0xF70c086618dcf2b1A461311275e00D6B722ef914",
    [ChainId.Ethereum]: "0x2214A42d8e2A1d20635c2cb0664422c528B6A432",
    [ChainId.Fantom]: "0x10c19390E1Ac2Fd6D0c3643a2320b0abA38E5bAA",
    [ChainId.Linea]: "0x80C7DD17B01855a6D2347444a0FCC36136a314de",
    [ChainId.Optimism]: "0x1af415a1EbA07a4986a52B6f2e7dE7003D82231e",
    [ChainId.PolygonPos]: "0xb7402ee99F0A008e461098AC3A27F4957Df89a40",
    [ChainId.Scroll]: "0x0389879e0156033202C44BF784ac18fC02edeE4f",
  },
};
