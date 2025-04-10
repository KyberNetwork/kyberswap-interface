import ethereum from "@/constants/networks/ethereum";
import bsc from "@/constants/networks/bsc";
import avalanche from "@/constants/networks/avalanche";
import base from "@/constants/networks/base";
import blast from "@/constants/networks/blast";
import fantom from "@/constants/networks/fantom";
import linea from "@/constants/networks/linea";
import mantle from "@/constants/networks/mantle";
import optimism from "@/constants/networks/optimism";
import scroll from "@/constants/networks/scroll";
import zkSync from "@/constants/networks/zkSync";
import berachain from "@/constants/networks/berachain";
import sonic from "@/constants/networks/sonic";
import polygon from "@/constants/networks/polygon";
import arbitrum from "@/constants/networks/arbitrum";

import uniswapv4 from "@/constants/dexes/uniswapv4";
import uniswapv3 from "@/constants/dexes/uniswapv3";
import pancakeswapv3 from "@/constants/dexes/pancakeswapv3";
import metavaultv3 from "@/constants/dexes/metavaultv3";
import linehubv3 from "@/constants/dexes/linehubv3";
import swapmodev3 from "@/constants/dexes/swapmodev3";
import koicl from "@/constants/dexes/koicl";
import thrusterv3 from "@/constants/dexes/thrusterv3";
import sushiswapv3 from "@/constants/dexes/sushiswapv3";
import pancakeswapv2 from "@/constants/dexes/pancakeswapv2";
import uniswapv2 from "@/constants/dexes/uniswapv2";
import pangolinstandard from "@/constants/dexes/pangolinstandard";
import sushiswapv2 from "@/constants/dexes/sushiswapv2";
import quickswapv2 from "@/constants/dexes/quickswapv2";
import thrusterv2 from "@/constants/dexes/thrusterv2";
import swapmodev2 from "@/constants/dexes/swapmodev2";
import kodiakv2 from "@/constants/dexes/kodiakv2";
import thenafusion from "@/constants/dexes/thenafusion";
import camelotv3 from "@/constants/dexes/camelotv3";
import quickswapv3algebra from "@/constants/dexes/quickswapv3algebra";
// import bladeswap from "@/constants/dexes/bladeswap";
import kodiakv3 from "@/constants/dexes/kodiakv3";
import squadswapv3 from "@/constants/dexes/squadswapv3";
import squadswapv2 from "@/constants/dexes/squadswapv2";

import { DexInfo, PoolType } from "@/schema/protocol";
import { ChainId } from "@/schema/chain";
import { EarnChain, EarnDex } from "@/schema/earn";
import { NetworkInfo } from "@/types/index";
import { enumToArrayOfValues } from "@kyber/utils";

export const NATIVE_TOKEN_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const MAX_ZAP_IN_TOKENS = 5;

export const NO_DATA = "--";

export const NETWORKS_INFO: Record<ChainId, NetworkInfo> = {
  [ChainId.Ethereum]: ethereum,
  [ChainId.Bsc]: bsc,
  [ChainId.PolygonPos]: polygon,
  [ChainId.Arbitrum]: arbitrum,
  [ChainId.Avalanche]: avalanche,
  [ChainId.Base]: base,
  [ChainId.Blast]: blast,
  [ChainId.Fantom]: fantom,
  [ChainId.Linea]: linea,
  [ChainId.Mantle]: mantle,
  [ChainId.Optimism]: optimism,
  [ChainId.Scroll]: scroll,
  [ChainId.ZkSync]: zkSync,
  [ChainId.Berachain]: berachain,
  [ChainId.Sonic]: sonic,
};

export const DEXES_INFO: Record<PoolType, DexInfo> = {
  [PoolType.DEX_UNISWAP_V4]: uniswapv4,
  [PoolType.DEX_UNISWAPV3]: uniswapv3,
  [PoolType.DEX_PANCAKESWAPV3]: pancakeswapv3,
  [PoolType.DEX_METAVAULTV3]: metavaultv3,
  [PoolType.DEX_LINEHUBV3]: linehubv3,
  [PoolType.DEX_SWAPMODEV3]: swapmodev3,
  [PoolType.DEX_KOICL]: koicl,
  [PoolType.DEX_THRUSTERV3]: thrusterv3,
  [PoolType.DEX_SUSHISWAPV3]: sushiswapv3,
  [PoolType.DEX_PANCAKESWAPV2]: pancakeswapv2,
  [PoolType.DEX_UNISWAPV2]: uniswapv2,
  [PoolType.DEX_PANGOLINSTANDARD]: pangolinstandard,
  [PoolType.DEX_SUSHISWAPV2]: sushiswapv2,
  [PoolType.DEX_QUICKSWAPV2]: quickswapv2,
  [PoolType.DEX_THRUSTERV2]: thrusterv2,
  [PoolType.DEX_SWAPMODEV2]: swapmodev2,
  [PoolType.DEX_KODIAK_V2]: kodiakv2,
  [PoolType.DEX_THENAFUSION]: thenafusion,
  [PoolType.DEX_CAMELOTV3]: camelotv3,
  [PoolType.DEX_QUICKSWAPV3ALGEBRA]: quickswapv3algebra,
  // [PoolType.DEX_BLADESWAP]: bladeswap,
  [PoolType.DEX_KODIAK_V3]: kodiakv3,
  [PoolType.DEX_SQUADSWAP_V3]: squadswapv3,
  [PoolType.DEX_SQUADSWAP_V2]: squadswapv2,
};

export const CHAIN_ID_TO_CHAIN: { [chainId in ChainId]: string } = {
  [ChainId.Ethereum]: "ethereum",
  [ChainId.PolygonPos]: "polygon",
  [ChainId.Bsc]: "bsc",
  [ChainId.Arbitrum]: "arbitrum",
  [ChainId.Avalanche]: "avalanche",
  [ChainId.Base]: "base",
  [ChainId.Blast]: "blast",
  [ChainId.Fantom]: "fantom",
  [ChainId.Mantle]: "mantle",
  [ChainId.Optimism]: "optimism",
  [ChainId.Scroll]: "scroll",
  [ChainId.Linea]: "linea",
  [ChainId.ZkSync]: "zksync",
  [ChainId.Berachain]: "berachain",
  [ChainId.Sonic]: "sonic",
};

export const poolTypeToDexId: { [poolType in PoolType]: number } = {
  DEX_UNISWAP_V4: 68,

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
  DEX_KODIAK_V3: 58,
  DEX_KODIAK_V2: 57,

  DEX_SQUADSWAP_V2: 65,
  DEX_SQUADSWAP_V3: 66,
};

export const dexMapping: Record<PoolType, string[]> = {
  [PoolType.DEX_UNISWAP_V4]: ["uniswap-v4"],

  [PoolType.DEX_UNISWAPV3]: ["uniswapv3"],
  [PoolType.DEX_PANCAKESWAPV3]: ["pancake-v3"],
  [PoolType.DEX_METAVAULTV3]: ["metavault-v3"],
  [PoolType.DEX_LINEHUBV3]: ["linehub-v3"],
  [PoolType.DEX_SWAPMODEV3]: ["baseswap-v3", "arbidex-v3", "superswap-v3"],
  [PoolType.DEX_KOICL]: ["koi-cl"],
  [PoolType.DEX_THRUSTERV3]: ["thruster-v3"],
  [PoolType.DEX_SUSHISWAPV3]: ["sushiswap-v3"],

  [PoolType.DEX_PANCAKESWAPV2]: ["pancake"],
  [PoolType.DEX_UNISWAPV2]: ["uniswap"],
  [PoolType.DEX_PANGOLINSTANDARD]: ["pangolin"],
  [PoolType.DEX_SUSHISWAPV2]: ["sushiswap"],
  [PoolType.DEX_QUICKSWAPV2]: ["quickswap"],
  [PoolType.DEX_THRUSTERV2]: ["thruster-v2"],
  [PoolType.DEX_SWAPMODEV2]: ["baseswap, arbidex, superswap"],
  [PoolType.DEX_KODIAK_V3]: ["kodiak-v3"],
  [PoolType.DEX_KODIAK_V2]: ["kodiak"],
  [PoolType.DEX_SQUADSWAP_V3]: ["squadswap-v3"],
  [PoolType.DEX_SQUADSWAP_V2]: ["squadswap"],

  [PoolType.DEX_THENAFUSION]: ["thena-fusion"],
  [PoolType.DEX_CAMELOTV3]: ["camelot-v3"],
  [PoolType.DEX_QUICKSWAPV3ALGEBRA]: ["quickswap-v3"],
  //[PoolType.DEX_BLADESWAP]: ["blade"],
} as const;

export const dexValues = Object.values(dexMapping).flat();

export const PATHS = {
  BFF_API: "https://bff.kyberswap.com/api",
  KYBERSWAP_DOCS: "https://docs.kyberswap.com",
  KYBERSWAP_SETTING_API: "https://ks-setting.kyberswap.com/api/v1/tokens",
  ZAP_API: "https://zap-api.kyberswap.com", // https://pre-zap-api.kyberengineering.io  https://zap-api.kyberswap.com
  COINGECKO_API_URL: "https://api.coingecko.com/api/v3",
  GO_PLUS_API: "https://api.gopluslabs.io/api/v1/token_security",
  ZAP_EARN_API: "https://pre-zap-earn-service.kyberengineering.io/api",
  TOKEN_API: "https://token-api.kyberengineering.io/api",
};

export const EARN_SUPPORTED_CHAINS = enumToArrayOfValues(EarnChain, "number");

export const EARN_SUPPORTED_PROTOCOLS = enumToArrayOfValues(EarnDex);
