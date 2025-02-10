import { ChainId, Chain, Dex, DexInfo } from "../schema";
import uniLogo from "../assets/dexes/uniswap.png";
import pancakeLogo from "../assets/dexes/pancake.png";
import sushiLogo from "../assets/dexes/sushi.png";

export const NATIVE_TOKEN_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const NetworkInfo: Record<ChainId, Chain> = {
  [ChainId.Ethereum]: {
    chainId: ChainId.Ethereum,
    name: "Ethereum",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/fd07cf5c-3ddf-4215-aa51-e6ee2c60afbc1697031732146.png",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://etherscan.io",
    multiCall: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
    defaultRpc: "https://ethereum.kyberengineering.io",
    wrappedToken: {
      name: "WETH",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      symbol: "WETH",
      decimals: 18,
    },
    zapPath: "ethereum",
  },
  [ChainId.Bsc]: {
    chainId: ChainId.Bsc,
    name: "BSC",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/d15d102e-6c7c-42f7-9dc4-79f3b1f9cc9b.png",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/14c1b7c4-b66e-4169-b82e-ea6237f15b461699420601184.png",
    scanLink: "https://bscscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://bsc.kyberengineering.io",
    wrappedToken: {
      name: "WBNB",
      address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      symbol: "WBNB",
      decimals: 18,
    },
    zapPath: "bsc",
  },
  [ChainId.PolygonPos]: {
    chainId: ChainId.PolygonPos,
    name: "Polygon POS",
    logo: "https://polygonscan.com/assets/poly/images/svg/logos/token-light.svg?v=24.2.3.1",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/10d6d017-945d-470d-87eb-6a6f89ce8b7e.png",
    scanLink: "https://polygonscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://polygon.kyberengineering.io",
    wrappedToken: {
      name: "WPOL",
      address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      symbol: "WPOL",
      decimals: 18,
    },
    zapPath: "polygon",
  },
  [ChainId.Arbitrum]: {
    chainId: ChainId.Arbitrum,
    name: "Arbitrum",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    logo: "https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/main/src/assets/networks/arbitrum.svg",
    scanLink: "https://arbiscan.io",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://arbitrum.kyberengineering.io",
    wrappedToken: {
      name: "WETH",
      address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      symbol: "WETH",
      decimals: 18,
    },
    zapPath: "arbitrum",
  },
  [ChainId.Avalanche]: {
    chainId: ChainId.Avalanche,
    name: "Avalanche",
    logo: "https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/main/src/assets/networks/avalanche.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/e72081b5-cb5f-4fb6-b771-ac189bdfd7c81699420213175.png",
    scanLink: "https://snowscan.xyz",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://avalanche.kyberengineering.io",
    wrappedToken: {
      name: "WAVAX",
      address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      symbol: "WAVAX",
      decimals: 18,
    },
    zapPath: "avalanche",
  },
  [ChainId.Base]: {
    chainId: ChainId.Base,
    name: "Base",
    logo: "https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/in-product/Base_Network_Logo.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://basescan.org",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://mainnet.base.org",
    wrappedToken: {
      name: "ETH",
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18,
    },
    zapPath: "base",
  },
  [ChainId.Blast]: {
    chainId: ChainId.Blast,
    name: "Blast",
    logo: "https://static.debank.com/image/project/logo_url/blast/c0e1eb5f4051bd62ca904cf2e3282f47.png",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://blastscan.io",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://rpc.blast.io",
    wrappedToken: {
      name: "ETH",
      address: "0x4300000000000000000000000000000000000004",
      symbol: "WETH",
      decimals: 18,
    },
    zapPath: "blast",
  },
  // [ChainId.Fantom]: {
  //   chainId: ChainId.Fantom,
  //   name: "Fantom",
  //   logo: "https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/main/src/assets/networks/fantom.svg",
  //   nativeLogo:
  //     "https://storage.googleapis.com/ks-setting-1d682dca/2cd8adf9-b4b0-41f7-b83d-4a13b4e9ca6f1699420090962.png",
  //   scanLink: "https://ftmscan.com",
  //   multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
  //   defaultRpc: "https://rpc.fantom.network	",
  //   wrappedToken: {
  //     name: "WFTM",
  //     address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
  //     symbol: "WFTM",
  //     decimals: 18,
  //   },
  //   zapPath: "fantom",
  // },
  [ChainId.Linea]: {
    chainId: ChainId.Linea,
    name: "Linea",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/12a257d3-65e3-4b16-8a84-03a4ca34a6bc1693378197244.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://lineascan.build",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://rpc.linea.build",
    wrappedToken: {
      name: "WETH",
      address: "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f",
      symbol: "WETH",
      decimals: 18,
    },
    zapPath: "linea",
  },
  //5000: {
  //  name: "Mantle",
  //  logo: "https://storage.googleapis.com/ks-setting-1d682dca/2bccd96f-b100-4ca1-858e-d8353ab0d0861710387147471.png",
  //  nativeLogo:
  //    "https://storage.googleapis.com/ks-setting-1d682dca/2bccd96f-b100-4ca1-858e-d8353ab0d0861710387147471.png",
  //  scanLink: "https://mantlescan.info",
  //  multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
  //  defaultRpc: "https://rpc.mantle.xyz",
  //  wrappedToken: {
  //    chainId: 5000,
  //    name: "WMNT",
  //    address: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8",
  //    symbol: "WMNT",
  //    decimals: 18,
  //  },
  //},
  [ChainId.Optimism]: {
    chainId: ChainId.Optimism,
    name: "Optimism",
    logo: "https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/main/src/assets/networks/optimism.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://optimistic.etherscan.io",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://optimism.kyberengineering.io",
    wrappedToken: {
      name: "WETH",
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18,
    },
    zapPath: "optimism",
  },
  [ChainId.Scroll]: {
    chainId: ChainId.Scroll,
    name: "Scroll",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/fe12013c-4d72-4ac3-9415-a278b7d474c71697595633825.png",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://scrollscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://rpc.scroll.io",
    wrappedToken: {
      name: "WETH",
      address: "0x5300000000000000000000000000000000000004",
      symbol: "WETH",
      decimals: 18,
    },
    zapPath: "scroll",
  },
  [ChainId.PolygonZkEVM]: {
    chainId: ChainId.PolygonZkEVM,
    name: "Polygyon ZkEVM",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/815d1f9c-86b2-4515-8bb1-4212106321c01699420293856.png",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://zkevm.polygonscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://zkevm-rpc.com",
    wrappedToken: {
      name: "WETH",
      address: "0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9",
      symbol: "WETH",
      decimals: 18,
    },
    zapPath: "polygon-zkevm",
  },
};

export const DexInfos: Record<Dex, DexInfo> = {
  [Dex.Uniswapv3]: {
    icon: uniLogo,
    name: "Uniswap V3",
    nftManagerContract: {
      [ChainId.Ethereum]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      [ChainId.Bsc]: "0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613",
      [ChainId.PolygonPos]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      [ChainId.Arbitrum]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      [ChainId.Avalanche]: "0x655C406EBFa14EE2006250925e54ec43AD184f8B",
      [ChainId.Base]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
      [ChainId.Blast]: "0xB218e4f7cF0533d4696fDfC419A0023D33345F28",
      // [ChainId.Fantom]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
      [ChainId.Linea]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
      // [ChainId.Mantle]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
      [ChainId.Optimism]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      [ChainId.Scroll]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
      [ChainId.PolygonZkEVM]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    },
  },
  [Dex.Pancakev3]: {
    icon: pancakeLogo,
    name: "Pancake V3",
    nftManagerContract: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
  },
  [Dex.Sushiv3]: {
    icon: sushiLogo,
    name: "SushiSwap V3",
    nftManagerContract: {
      [ChainId.Arbitrum]: "0x96E04591579f298681361C6122Dc4Ef405c19385",
      [ChainId.Avalanche]: "0x18350b048AB366ed601fFDbC669110Ecb36016f3",
      [ChainId.Base]: "0x80C7DD17B01855a6D2347444a0FCC36136a314de",
      [ChainId.Blast]: "0x51edb3e5bcE8618B77b60215F84aD3DB14709051",
      [ChainId.Bsc]: "0xF70c086618dcf2b1A461311275e00D6B722ef914",
      [ChainId.Ethereum]: "0x2214A42d8e2A1d20635c2cb0664422c528B6A432",
      // [ChainId.Fantom]: "0x10c19390E1Ac2Fd6D0c3643a2320b0abA38E5bAA",
      [ChainId.Linea]: "0x80C7DD17B01855a6D2347444a0FCC36136a314de",
      [ChainId.Optimism]: "0x1af415a1EbA07a4986a52B6f2e7dE7003D82231e",
      [ChainId.PolygonPos]: "0xb7402ee99F0A008e461098AC3A27F4957Df89a40",
      [ChainId.PolygonZkEVM]: "0xF4d73326C13a4Fc5FD7A064217e12780e9Bd62c3",
      [ChainId.Scroll]: "0x0389879e0156033202C44BF784ac18fC02edeE4f",
    },
  },
};

export const ZAP_URL = "https://zap-api.kyberswap.com";
//export const ZAP_URL = "https://pre-zap-api.kyberengineering.io";
