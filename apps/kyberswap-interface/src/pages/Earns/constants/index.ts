import { ChainId } from '@kyberswap/ks-sdk-core'
import { ContractInterface } from 'ethers'

import arbitrum from 'pages/Earns/constants/chains/arbitrum'
import avax from 'pages/Earns/constants/chains/avax'
import base from 'pages/Earns/constants/chains/base'
import bera from 'pages/Earns/constants/chains/bera'
import bsc from 'pages/Earns/constants/chains/bsc'
import ethereum from 'pages/Earns/constants/chains/ethereum'
import matic from 'pages/Earns/constants/chains/matic'
import optimism from 'pages/Earns/constants/chains/optimism'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import camelotv3 from 'pages/Earns/constants/dexes/camelotv3'
import kodiakv3 from 'pages/Earns/constants/dexes/kodiakv3'
import pancakeinfinitycl from 'pages/Earns/constants/dexes/pancakeInfinityCl'
import pancakeswapv3 from 'pages/Earns/constants/dexes/pancakeswapv3'
import quickswapv3 from 'pages/Earns/constants/dexes/quickswapv3'
import sushiswapv3 from 'pages/Earns/constants/dexes/sushiswapv3'
import thena from 'pages/Earns/constants/dexes/thena'
import uniswapv2 from 'pages/Earns/constants/dexes/uniswapv2'
import uniswapv3 from 'pages/Earns/constants/dexes/uniswapv3'
import uniswapv4 from 'pages/Earns/constants/dexes/uniswapv4'

// Dex info
export interface EarnDexInfo {
  name: string
  nftManagerContract: { [key in ChainId]?: string } | string
  nftManagerContractAbi: ContractInterface | null
  unwrapWNativeTokenFuncName: string | null
  siteUrl: string
  collectFeeSupported: boolean
  isForkFrom: CoreProtocol
  showVersion: boolean
  farmingSupported: boolean
}

export enum Exchange {
  DEX_UNISWAPV2 = 'uniswapv2',
  DEX_UNISWAPV3 = 'uniswapv3',
  DEX_PANCAKESWAPV3 = 'pancake-v3',
  DEX_SUSHISWAPV3 = 'sushiswap-v3',
  DEX_QUICKSWAPV3ALGEBRA = 'quickswap-v3',
  DEX_CAMELOTV3 = 'camelot-v3',
  DEX_THENAFUSION = 'thena-fusion',
  DEX_KODIAK_V3 = 'kodiakcl',
  DEX_UNISWAP_V4 = 'uniswap-v4',
  DEX_UNISWAP_V4_FAIRFLOW = 'uniswap-v4-fairflow',
  DEX_PANCAKE_INFINITY_CL = 'pancake-infinity-cl',
  DEX_PANCAKE_INFINITY_CL_FAIRFLOW = 'pancake-infinity-cl-fairflow',
}

export const EARN_DEXES: Record<Exchange, EarnDexInfo> = {
  [Exchange.DEX_UNISWAPV2]: uniswapv2,
  [Exchange.DEX_UNISWAPV3]: uniswapv3,
  [Exchange.DEX_PANCAKESWAPV3]: pancakeswapv3,
  [Exchange.DEX_SUSHISWAPV3]: sushiswapv3,
  [Exchange.DEX_QUICKSWAPV3ALGEBRA]: quickswapv3,
  [Exchange.DEX_CAMELOTV3]: camelotv3,
  [Exchange.DEX_THENAFUSION]: thena,
  [Exchange.DEX_KODIAK_V3]: kodiakv3,
  [Exchange.DEX_UNISWAP_V4]: uniswapv4,
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: {
    ...uniswapv4,
    name: 'Uniswap V4 FairFlow',
    farmingSupported: true,
  },
  [Exchange.DEX_PANCAKE_INFINITY_CL]: pancakeinfinitycl,
  [Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: {
    ...pancakeinfinitycl,
    name: 'Pancake ∞ CL FairFlow',
    farmingSupported: true,
  },
}

// Chain info
export interface EarnChainInfo {
  nativeAddress: string
  farmingSupported: boolean
  univ4StateViewContract: string | null
}

export enum EarnChain {
  MAINNET = ChainId.MAINNET,
  BASE = ChainId.BASE,
  BSC = ChainId.BSCMAINNET,
  ARBITRUM = ChainId.ARBITRUM,
  AVAX = ChainId.AVAXMAINNET,
  OPTIMISM = ChainId.OPTIMISM,
  MATIC = ChainId.MATIC,
  BERA = ChainId.BERA,
}

export const EARN_CHAINS: Record<EarnChain, EarnChainInfo> = {
  [EarnChain.MAINNET]: ethereum,
  [EarnChain.BASE]: base,
  [EarnChain.BSC]: bsc,
  [EarnChain.ARBITRUM]: arbitrum,
  [EarnChain.AVAX]: avax,
  [EarnChain.OPTIMISM]: optimism,
  [EarnChain.MATIC]: matic,
  [EarnChain.BERA]: bera,
}

export const LIMIT_TEXT_STYLES = {
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
}
