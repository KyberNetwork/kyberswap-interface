import { ChainId, DexInfo, PoolType, Token } from "@/schema";
import uniLogo from "@/assets/dexes/uniswap.png";
import pancakeLogo from "@/assets/dexes/pancake.png";
import metavaultLogo from "@/assets/dexes/metavault.svg?url";
import linehubLogo from "@/assets/dexes/metavault.svg?url";
import swapmodeLogo from "@/assets/dexes/swapmode.png";
import koiclLogo from "@/assets/dexes/koicl.png";
import thrusterLogo from "@/assets/dexes/thruster.png";
import sushiLogo from "@/assets/dexes/sushi.png";
import quickswapLogo from "@/assets/dexes/quickswap.png";
import pangolinLogo from "@/assets/dexes/pangolin.png";
import thenaLogo from "@/assets/dexes/thena.png";
import camelotLogo from "@/assets/dexes/camelot.svg?url";
//import blastswapLogo from "@/assets/dexes/blastswap.png";

export { PoolType, ChainId };

export const NATIVE_TOKEN_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const MAX_ZAP_IN_TOKENS = 5;

export const NO_DATA = "--";

const NOT_SUPPORT = null;

export const NetworkInfo: {
  [chainId in ChainId]: {
    name: string;
    logo: string;
    scanLink: string;
    multiCall: string;
    defaultRpc: string;
    wrappedToken: Token;
    nativeLogo: string;
    coingeckoNetworkId: string | null;
    coingeckoNativeTokenId: string | null;
  };
} = {
  [ChainId.Ethereum]: {
    name: "Ethereum",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/fd07cf5c-3ddf-4215-aa51-e6ee2c60afbc1697031732146.png",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://etherscan.io",
    multiCall: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
    defaultRpc: "https://ethereum.kyberengineering.io",
    coingeckoNetworkId: "ethereum",
    coingeckoNativeTokenId: "ethereum",
    wrappedToken: {
      //chainId: ChainId.Ethereum,
      name: "WETH",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      symbol: "WETH",
      decimals: 18,
    },
  },

  [ChainId.Bsc]: {
    name: "BSC",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/d15d102e-6c7c-42f7-9dc4-79f3b1f9cc9b.png",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/14c1b7c4-b66e-4169-b82e-ea6237f15b461699420601184.png",
    scanLink: "https://bscscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://bsc.kyberengineering.io",
    coingeckoNetworkId: "binance-smart-chain",
    coingeckoNativeTokenId: "binancecoin",
    wrappedToken: {
      //chainId: ChainId.Bsc,
      name: "WBNB",
      address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      symbol: "WBNB",
      decimals: 18,
    },
  },

  [ChainId.PolygonPos]: {
    name: "Polygon POS",
    logo: "https://polygonscan.com/assets/poly/images/svg/logos/token-light.svg?v=24.2.3.1",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/10d6d017-945d-470d-87eb-6a6f89ce8b7e.png",
    scanLink: "https://polygonscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://polygon.kyberengineering.io",
    coingeckoNetworkId: "polygon-pos",
    coingeckoNativeTokenId: "matic-network",
    wrappedToken: {
      //chainId: ChainId.PolygonPos,
      name: "WPOL",
      address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      symbol: "WPOL",
      decimals: 18,
    },
  },

  [ChainId.Arbitrum]: {
    name: "Arbitrum",
    logo: "https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/main/src/assets/networks/arbitrum.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://arbiscan.io",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://arbitrum.kyberengineering.io",
    coingeckoNetworkId: "arbitrum-one",
    coingeckoNativeTokenId: "ethereum",
    wrappedToken: {
      //chainId: ChainId.Arbitrum,
      name: "WETH",
      address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      symbol: "WETH",
      decimals: 18,
    },
  },

  [ChainId.Avalanche]: {
    name: "Avalanche",
    logo: "https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/main/src/assets/networks/avalanche.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/e72081b5-cb5f-4fb6-b771-ac189bdfd7c81699420213175.png",
    scanLink: "https://snowscan.xyz",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://avalanche.kyberengineering.io",
    coingeckoNetworkId: "avalanche",
    coingeckoNativeTokenId: "avalanche-2",
    wrappedToken: {
      //chainId: ChainId.Avalanche,
      name: "WAVAX",
      address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      symbol: "WAVAX",
      decimals: 18,
    },
  },

  [ChainId.Base]: {
    name: "Base",
    logo: "https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/in-product/Base_Network_Logo.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://basescan.org",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://mainnet.base.org",
    coingeckoNetworkId: "base",
    coingeckoNativeTokenId: "ethereum",
    wrappedToken: {
      //chainId: ChainId.Base,
      name: "ETH",
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18,
    },
  },

  [ChainId.Blast]: {
    name: "Blast",
    logo: "https://static.debank.com/image/project/logo_url/blast/c0e1eb5f4051bd62ca904cf2e3282f47.png",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://blastscan.io",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://rpc.blast.io",
    coingeckoNetworkId: "blast",
    coingeckoNativeTokenId: "ethereum",
    wrappedToken: {
      //chainId: ChainId.Blast,
      name: "ETH",
      address: "0x4300000000000000000000000000000000000004",
      symbol: "WETH",
      decimals: 18,
    },
  },

  [ChainId.Fantom]: {
    name: "Fantom",
    logo: "https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/main/src/assets/networks/fantom.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/2cd8adf9-b4b0-41f7-b83d-4a13b4e9ca6f1699420090962.png",
    scanLink: "https://ftmscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://rpc.fantom.network	",
    coingeckoNetworkId: "fantom",
    coingeckoNativeTokenId: "fantom",
    wrappedToken: {
      //chainId: ChainId.Fantom,
      name: "WFTM",
      address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
      symbol: "WFTM",
      decimals: 18,
    },
  },

  [ChainId.Linea]: {
    name: "Linea",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/12a257d3-65e3-4b16-8a84-03a4ca34a6bc1693378197244.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://lineascan.build",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://rpc.linea.build",
    coingeckoNetworkId: NOT_SUPPORT,
    coingeckoNativeTokenId: NOT_SUPPORT,
    wrappedToken: {
      //chainId: ChainId.Linea,
      name: "WETH",
      address: "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f",
      symbol: "WETH",
      decimals: 18,
    },
  },

  [ChainId.Mantle]: {
    name: "Mantle",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/2bccd96f-b100-4ca1-858e-d8353ab0d0861710387147471.png",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/2bccd96f-b100-4ca1-858e-d8353ab0d0861710387147471.png",
    scanLink: "https://mantlescan.info",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://rpc.mantle.xyz",
    coingeckoNetworkId: "mantle",
    coingeckoNativeTokenId: "mnt",
    wrappedToken: {
      //chainId: ChainId.Mantle,
      name: "WMNT",
      address: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8",
      symbol: "WMNT",
      decimals: 18,
    },
  },

  [ChainId.Optimism]: {
    name: "Optimism",
    logo: "https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/main/src/assets/networks/optimism.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://optimistic.etherscan.io",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://optimism.kyberengineering.io",
    coingeckoNetworkId: "optimistic-ethereum",
    coingeckoNativeTokenId: "ethereum",
    wrappedToken: {
      //chainId: ChainId.Optimism,
      name: "WETH",
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18,
    },
  },

  [ChainId.Scroll]: {
    name: "Scroll",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/fe12013c-4d72-4ac3-9415-a278b7d474c71697595633825.png",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://scrollscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://rpc.scroll.io",
    coingeckoNetworkId: "scroll",
    coingeckoNativeTokenId: "ethereum",
    wrappedToken: {
      //chainId: ChainId.Scroll,
      name: "WETH",
      address: "0x5300000000000000000000000000000000000004",
      symbol: "WETH",
      decimals: 18,
    },
  },

  [ChainId.ZkSync]: {
    name: "ZkSync",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/bd11850b-6aef-48c6-a27d-f8ee833e0dbc1693378187666.svg",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://era.zksync.network",
    multiCall: "0xF9cda624FBC7e059355ce98a31693d299FACd963",
    defaultRpc: "https://mainnet.era.zksync.io",
    coingeckoNetworkId: "zksync",
    coingeckoNativeTokenId: "ethereum",
    wrappedToken: {
      //chainId: ChainId.PolygonZkEVM,
      name: "WETH",
      address: "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91",
      symbol: "WETH",
      decimals: 18,
    },
  },
};

export const DexInfos: Record<PoolType, DexInfo> = {
  [PoolType.DEX_UNISWAPV3]: {
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
      [ChainId.Fantom]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
      [ChainId.Linea]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
      [ChainId.Mantle]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
      [ChainId.Optimism]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      [ChainId.Scroll]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    },
  },
  [PoolType.DEX_PANCAKESWAPV3]: {
    icon: pancakeLogo,
    name: "PancakeSwap V3",
    nftManagerContract: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
  },
  [PoolType.DEX_METAVAULTV3]: {
    icon: metavaultLogo,
    name: "Metavault V3",
    nftManagerContract: {
      [ChainId.Linea]: "0x5979C5315625276ff99a56f95eE5cC44293e7b36",
      [ChainId.Scroll]: "0x5979C5315625276ff99a56f95eE5cC44293e7b36",
    },
  },
  [PoolType.DEX_LINEHUBV3]: {
    icon: linehubLogo,
    name: "LineHub V3",
    nftManagerContract: {
      [ChainId.Linea]: "0xD27166FA3E2c1a2C1813d0fe6226b8EB21783184",
    },
  },
  [PoolType.DEX_SWAPMODEV3]: {
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
  },
  [PoolType.DEX_KOICL]: {
    icon: koiclLogo,
    name: "KOI CL",
    nftManagerContract: {
      [ChainId.ZkSync]: "0xa459EbF3E6A6d5875345f725bA3F107340b67732",
    },
  },
  [PoolType.DEX_THRUSTERV3]: {
    icon: thrusterLogo,
    name: "Thruster V3",
    nftManagerContract: {
      [ChainId.Blast]: "0x434575EaEa081b735C985FA9bf63CD7b87e227F9",
    },
  },

  [PoolType.DEX_SUSHISWAPV3]: {
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
  },
  [PoolType.DEX_PANCAKESWAPV2]: {
    icon: pancakeLogo,
    name: "Pancake V2",
    nftManagerContract: {},
  },
  [PoolType.DEX_UNISWAPV2]: {
    icon: uniLogo,
    name: "Uniswap V2",
    nftManagerContract: {},
  },
  [PoolType.DEX_PANGOLINSTANDARD]: {
    icon: pangolinLogo,
    name: "Pangolin Standard",
    nftManagerContract: {},
  },
  [PoolType.DEX_SUSHISWAPV2]: {
    icon: sushiLogo,
    name: "SushiSwap V2",
    nftManagerContract: {},
  },
  [PoolType.DEX_QUICKSWAPV2]: {
    icon: quickswapLogo,
    name: "QuickSwap V2",
    nftManagerContract: {},
  },
  [PoolType.DEX_THRUSTERV2]: {
    icon: thrusterLogo,
    name: "Thruster V2",
    nftManagerContract: {},
  },
  [PoolType.DEX_SWAPMODEV2]: {
    icon: swapmodeLogo,
    name: "SwapMode V2",
    nftManagerContract: {},
  },

  [PoolType.DEX_THENAFUSION]: {
    icon: thenaLogo,
    name: "Thena",
    nftManagerContract: {
      //[ChainId.Bsc]: "0x643B68Bf3f855B8475C0A700b6D1020bfc21d02e",
      [ChainId.Bsc]: "0xa51ADb08Cbe6Ae398046A23bec013979816B77Ab",
    },
  },
  [PoolType.DEX_CAMELOTV3]: {
    icon: camelotLogo,
    name: "Camelot V3",
    nftManagerContract: {
      [ChainId.Arbitrum]: "0x00c7f3082833e796A5b3e4Bd59f6642FF44DCD15",
    },
  },
  [PoolType.DEX_QUICKSWAPV3ALGEBRA]: {
    icon: quickswapLogo,
    name: "QuickSwap",
    nftManagerContract: {
      [ChainId.PolygonPos]: "0x8eF88E4c7CfbbaC1C163f7eddd4B578792201de6",
    },
  },
  //[PoolType.DEX_BLADESWAP]: {
  //  icon: blastswapLogo,
  //  name: "BlastSwap",
  //  nftManagerContract: {
  //    [ChainId.Blast]: "0x7553b306773EFa59E6f9676aFE049D2D2AbdfDd6",
  //  },
  //},
};

export const chainIdToChain: { [chainId in ChainId]: string } = {
  1: "ethereum",
  137: "polygon",
  56: "bsc",
  42161: "arbitrum",
  43114: "avalanche",
  8453: "base",
  81457: "blast",
  250: "fantom",
  5000: "mantle",
  10: "optimism",
  534352: "scroll",
  59144: "linea",
  324: "zksync",
};

export const poolTypeToDexId: { [poolType in PoolType]: number } = {
  DEX_UNISWAPV3: 2,
  DEX_PANCAKESWAPV3: 3,
  DEX_METAVAULTV3: 8,
  DEX_LINEHUBV3: 35,
  DEX_SWAPMODEV3: 46,
  DEX_KOICL: 38,
  DEX_THRUSTERV3: 12,
  DEX_SUSHISWAPV3: 11,

  DEX_PANCAKESWAPV2: 16,
  DEX_UNISWAPV2: 4,
  DEX_PANGOLINSTANDARD: 18,
  DEX_SUSHISWAPV2: 5,
  DEX_QUICKSWAPV2: 19,
  DEX_THRUSTERV2: 20,
  DEX_SWAPMODEV2: 44,

  DEX_THENAFUSION: 15,
  DEX_CAMELOTV3: 13,
  DEX_QUICKSWAPV3ALGEBRA: 14,
  //DEX_BLADESWAP: 50,
};

export const PATHS = {
  BFF_API: "https://bff.kyberswap.com/api",
  KYBERSWAP_DOCS: "https://docs.kyberswap.com",
  INTERFACE_GATEWAY_UNISWAP: "https://interface.gateway.uniswap.org/v1/graphql",
  KYBERSWAP_SETTING_API: "https://ks-setting.kyberswap.com/api/v1/tokens",
  ZAP_API: "https://zap-api.kyberswap.com",
  COINGECKO_API_URL: "https://api.coingecko.com/api/v3",
  GO_PLUS_API: "https://api.gopluslabs.io/api/v1/token_security",
  ZAP_EARN_API: "https://zap-earn-service.kyberengineering.io/api",
  TOKEN_API: "https://token-api.kyberengineering.io/api",
};

export const DEFAULT_PRICE_RANGE = {
  LOW_POOL_FEE: 0.005,
  MEDIUM_POOL_FEE: 0.05,
  MIDDLE_POOL_FEE: 0.2,
  HIGH_POOL_FEE: 0.5,
};

export const FULL_PRICE_RANGE = "Full Range";

export const PRICE_RANGE = {
  LOW_POOL_FEE: [FULL_PRICE_RANGE, 0.01, 0.005, 0.001],
  MEDIUM_POOL_FEE: [FULL_PRICE_RANGE, 0.1, 0.05, 0.01],
  MIDDLE_POOL_FEE: [FULL_PRICE_RANGE, 0.3, 0.2, 0.1],
  HIGH_POOL_FEE: [FULL_PRICE_RANGE, 0.8, 0.5, 0.2],
};
