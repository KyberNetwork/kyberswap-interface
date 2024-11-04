import { Token } from "../entities/Pool";

export const NATIVE_TOKEN_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const MAX_ZAP_IN_TOKENS = 5;

export const NO_DATA = "--";

const NOT_SUPPORT = null;

export enum ChainId {
  Ethereum = 1,
  BSC = 56,
  PolygonPos = 137,
  Arbitrum = 42161,
  Avalanche = 43114,
  Base = 8453,
  Blast = 81457,
  Fantom = 250,
  Linea = 59144,
  Mantle = 5000,
  Optimism = 10,
  Scroll = 534352,
  PolygonZkEVM = 1101,
}

export const NetworkInfo: {
  [chainId: number]: {
    name: string;
    logo: string;
    scanLink: string;
    multiCall: string;
    defaultRpc: string;
    wrappedToken: Token & {
      symbol: string;
    };
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
      chainId: ChainId.Ethereum,
      name: "WETH",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      symbol: "WETH",
      decimals: 18,
    },
  },
  [ChainId.BSC]: {
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
      chainId: ChainId.BSC,
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
      chainId: ChainId.PolygonPos,
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
      chainId: ChainId.Arbitrum,
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
      chainId: ChainId.Avalanche,
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
      chainId: ChainId.Base,
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
      chainId: ChainId.Blast,
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
      chainId: ChainId.Fantom,
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
      chainId: ChainId.Linea,
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
      chainId: ChainId.Mantle,
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
      chainId: ChainId.Optimism,
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
      chainId: ChainId.Scroll,
      name: "WETH",
      address: "0x5300000000000000000000000000000000000004",
      symbol: "WETH",
      decimals: 18,
    },
  },
  [ChainId.PolygonZkEVM]: {
    name: "Polgyon ZkEVM",
    logo: "https://storage.googleapis.com/ks-setting-1d682dca/815d1f9c-86b2-4515-8bb1-4212106321c01699420293856.png",
    nativeLogo:
      "https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png",
    scanLink: "https://zkevm.polygonscan.com",
    multiCall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    defaultRpc: "https://zkevm-rpc.com",
    coingeckoNetworkId: "polygon-zkevm",
    coingeckoNativeTokenId: "ethereum",
    wrappedToken: {
      chainId: ChainId.PolygonZkEVM,
      name: "WETH",
      address: "0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9",
      symbol: "WETH",
      decimals: 18,
    },
  },
};

export const chainIdToChain: { [chainId: number]: string } = {
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
  1101: "polygon-zkevm",
};

export enum PoolType {
  DEX_UNISWAPV3 = "DEX_UNISWAPV3",
  DEX_PANCAKESWAPV3 = "DEX_PANCAKESWAPV3",
  DEX_METAVAULTV3 = "DEX_METAVAULTV3",
  DEX_LINEHUBV3 = "DEX_LINEHUBV3",
  DEX_SWAPMODEV3 = "DEX_SWAPMODEV3",
}

export const NFT_MANAGER_CONTRACT: {
  [key in PoolType]: { [chainId: number]: string };
} = {
  [PoolType.DEX_UNISWAPV3]: {
    [ChainId.Ethereum]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    [ChainId.BSC]: "0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613",
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
    [ChainId.PolygonZkEVM]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
  },
  [PoolType.DEX_PANCAKESWAPV3]: {
    [ChainId.Ethereum]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.BSC]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.PolygonPos]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.Arbitrum]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.Avalanche]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.Base]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.Blast]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.Fantom]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.Linea]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.Mantle]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.Optimism]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.Scroll]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [ChainId.PolygonZkEVM]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
  },
  [PoolType.DEX_METAVAULTV3]: {
    [ChainId.Linea]: "0x5979C5315625276ff99a56f95eE5cC44293e7b36",
    [ChainId.Scroll]: "0x5979C5315625276ff99a56f95eE5cC44293e7b36",
  },
  [PoolType.DEX_LINEHUBV3]: {
    [ChainId.Linea]: "0xD27166FA3E2c1a2C1813d0fe6226b8EB21783184",
  },
  [PoolType.DEX_SWAPMODEV3]: {
    [ChainId.Arbitrum]: "0x81F2c375AEDbdF02f11c1Ae125e2f51Efa777cEa",
    [ChainId.Base]: "0xDe151D5c92BfAA288Db4B67c21CD55d5826bCc93",
    [ChainId.Optimism]: "0x74a52eb08d699CD8BE1d42dA4B241d526B8a8285",
  },
};

export const MULTICALL2_ADDRESS: { [chainId: number]: string } = {
  1: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
  137: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
  56: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
  43114: "0xF2FD8219609E28C61A998cc534681f95D2740f61",
  250: "0x878dFE971d44e9122048308301F540910Bbd934c",
  25: "0x63Abb9973506189dC3741f61d25d4ed508151E6d",
  42161: "0x80C7DD17B01855a6D2347444a0FCC36136a314de",
  199: "0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54",
  10: "0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974",
  59144: "0xcA11bde05977b3631167028862bE2a173976CA11",
  1101: "0xcA11bde05977b3631167028862bE2a173976CA11",
  324: "0xF9cda624FBC7e059355ce98a31693d299FACd963",
  8453: "0xcA11bde05977b3631167028862bE2a173976CA11",
  81457: "0xcA11bde05977b3631167028862bE2a173976CA11",
  5000: "0xcA11bde05977b3631167028862bE2a173976CA11",
};

export const PATHS = {
  KYBERSWAP_DOCS: "https://docs.kyberswap.com",
  INTERFACE_GATEWAY_UNISWAP: "https://interface.gateway.uniswap.org/v1/graphql",
  KYBERSWAP_PRICE_API: "https://price.kyberswap.com",
  KYBERSWAP_SETTING_API: "https://ks-setting.kyberswap.com/api/v1/tokens",
  ZAP_API: "https://zap-api.kyberswap.com",
  COINGECKO_API_URL: "https://api.coingecko.com/api/v3",
  GO_PLUS_API: "https://api.gopluslabs.io/api/v1/token_security",
};

export const DEFAULT_PRICE_RANGE = {
  LOW_POOL_FEE: 0.01,
  MEDIUM_POOL_FEE: 0.1,
  HIGH_POOL_FEE: 0.5,
};

export const FULL_PRICE_RANGE = "Full Range";

export const PRICE_RANGE = {
  LOW_POOL_FEE: [FULL_PRICE_RANGE, 0.01, 0.005, 0.001],
  MEDIUM_POOL_FEE: [FULL_PRICE_RANGE, 0.2, 0.1, 0.05],
  HIGH_POOL_FEE: [FULL_PRICE_RANGE, 0.5, 0.2, 0.1],
};
