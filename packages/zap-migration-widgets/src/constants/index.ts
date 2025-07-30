import camelotv3 from '@/constants/dexes/camelotv3';
import kodiakv3 from '@/constants/dexes/kodiakv3';
import koicl from '@/constants/dexes/koicl';
import linehubv3 from '@/constants/dexes/linehubv3';
import metavaultv3 from '@/constants/dexes/metavaultv3';
import pancakeswapv3 from '@/constants/dexes/pancakeswapv3';
import quickswapv3algebra from '@/constants/dexes/quickswapv3algebra';
import squadswapv2 from '@/constants/dexes/squadswapv2';
import squadswapv3 from '@/constants/dexes/squadswapv3';
import sushiswapv3 from '@/constants/dexes/sushiswapv3';
import swapmodev3 from '@/constants/dexes/swapmodev3';
import thenafusion from '@/constants/dexes/thenafusion';
import thrusterv3 from '@/constants/dexes/thrusterv3';
import uniswapv2 from '@/constants/dexes/uniswapv2';
import uniswapv3 from '@/constants/dexes/uniswapv3';
import uniswapv4 from '@/constants/dexes/uniswapv4';
import arbitrum from '@/constants/networks/arbitrum';
import avalanche from '@/constants/networks/avalanche';
import base from '@/constants/networks/base';
import berachain from '@/constants/networks/berachain';
import blast from '@/constants/networks/blast';
import bsc from '@/constants/networks/bsc';
import ethereum from '@/constants/networks/ethereum';
import linea from '@/constants/networks/linea';
import optimism from '@/constants/networks/optimism';
import polygon from '@/constants/networks/polygon';
import scroll from '@/constants/networks/scroll';
import sonic from '@/constants/networks/sonic';
import zkSync from '@/constants/networks/zkSync';
import { Chain, ChainId, Dex, DexInfo } from '@/schema';

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const NETWORKS_INFO: Record<ChainId, Chain> = {
  [ChainId.Ethereum]: ethereum,
  [ChainId.Bsc]: bsc,
  [ChainId.PolygonPos]: polygon,
  [ChainId.Arbitrum]: arbitrum,
  [ChainId.Avalanche]: avalanche,
  [ChainId.Base]: base,
  [ChainId.Blast]: blast,
  [ChainId.Linea]: linea,
  [ChainId.Optimism]: optimism,
  [ChainId.Scroll]: scroll,
  [ChainId.ZkSync]: zkSync,
  [ChainId.Berachain]: berachain,
  [ChainId.Sonic]: sonic,
};

export const DEXES_INFO: Record<Dex, DexInfo> = {
  [Dex.DEX_UNISWAP_V4]: uniswapv4,
  [Dex.DEX_UNISWAP_V4_FAIRFLOW]: {
    ...uniswapv4,
    name: 'Uniswap V4 FairFlow',
  },
  [Dex.DEX_UNISWAPV3]: uniswapv3,
  [Dex.DEX_UNISWAPV2]: uniswapv2,
  [Dex.DEX_PANCAKESWAPV3]: pancakeswapv3,
  [Dex.DEX_SUSHISWAPV3]: sushiswapv3,
  [Dex.DEX_METAVAULTV3]: metavaultv3,
  [Dex.DEX_LINEHUBV3]: linehubv3,
  [Dex.DEX_SWAPMODEV3]: swapmodev3,
  [Dex.DEX_KOICL]: koicl,
  [Dex.DEX_THRUSTERV3]: thrusterv3,
  [Dex.DEX_THENAFUSION]: thenafusion,
  [Dex.DEX_CAMELOTV3]: camelotv3,
  [Dex.DEX_QUICKSWAPV3ALGEBRA]: quickswapv3algebra,
  [Dex.DEX_KODIAK_V3]: kodiakv3,
  [Dex.DEX_SQUADSWAP_V3]: squadswapv3,
  [Dex.DEX_SQUADSWAP_V2]: squadswapv2,
};

export const PATHS = {
  BFF_API: 'https://bff.kyberswap.com/api',
  KYBERSWAP_SETTING_API: 'https://ks-setting.kyberswap.com/api',
  ZAP_API: 'https://zap-api.kyberswap.com',
  // ZAP_API: "https://pre-zap-api.kyberengineering.io",
  TOKEN_API: 'https://token-api.kyberengineering.io/api',
  DOCUMENT: {
    ZAP_FEE_MODEL: 'https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model',
  },
};

export const FARMING_CONTRACTS: Partial<Record<Dex, Partial<Record<ChainId, string>>>> = {
  [Dex.DEX_PANCAKESWAPV3]: {
    [ChainId.Ethereum]: '0x556B9306565093C855AEA9AE92A594704c2Cd59e',
    [ChainId.Bsc]: '0x556B9306565093C855AEA9AE92A594704c2Cd59e',
    [ChainId.Arbitrum]: '0x5e09ACf80C0296740eC5d6F643005a4ef8DaA694',
    [ChainId.ZkSync]: '0x4c615E78c5fCA1Ad31e4d66eb0D8688d84307463',
    [ChainId.Base]: '0xC6A2Db661D5a5690172d8eB0a7DEA2d3008665A3',
    [ChainId.Linea]: '0x22E2f236065B780FA33EC8C4E58b99ebc8B55c57',
  },
};
