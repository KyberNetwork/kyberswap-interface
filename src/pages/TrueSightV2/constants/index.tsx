import { ChainId } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'

import { KyberAIListType } from '../types'

export const SUPPORTED_NETWORK_KYBERAI: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'ethereum',
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.AVAXMAINNET]: 'avalanche',
  [ChainId.MATIC]: 'polygon',
  [ChainId.FANTOM]: 'fantom',
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.OPTIMISM]: 'optimism',
}

export const NETWORK_IMAGE_URL: { [chain: string]: string } = {
  ethereum: NETWORKS_INFO[ChainId.MAINNET].icon,
  bsc: NETWORKS_INFO[ChainId.BSCMAINNET].icon,
  arbitrum: NETWORKS_INFO[ChainId.ARBITRUM].icon,
  optimism: NETWORKS_INFO[ChainId.OPTIMISM].icon,
  avalanche: NETWORKS_INFO[ChainId.AVAXMAINNET].icon,
  polygon: NETWORKS_INFO[ChainId.MATIC].icon,
  fantom: NETWORKS_INFO[ChainId.FANTOM].icon,
}
export const NETWORK_TO_CHAINID: { [chain: string]: ChainId } = {
  ethereum: ChainId.MAINNET,
  bsc: ChainId.BSCMAINNET,
  arbitrum: ChainId.ARBITRUM,
  optimism: ChainId.OPTIMISM,
  avalanche: ChainId.AVAXMAINNET,
  polygon: ChainId.MATIC,
  fantom: ChainId.FANTOM,
}

export enum MIXPANEL_KYBERAI_TAG {
  RANKING_ALL = 'ranking_all',
  RANKING_BULLISH = 'ranking_bullish',
  RANKING_BEARISH = 'ranking_bearish',
  RANKING_MY_WATCHLIST = 'ranking_my_watchlist',
  RANKING_TOP_CEX_INFLOW = 'ranking_top_cex_inflow',
  RANKING_TOP_CEX_OUTFLOW = 'ranking_top_cex_outflow',
  RANKING_TOP_TRADED = 'ranking_top_traded',
  RANKING_TRENDING_SOON = 'ranking_trending_soon',
  RANKING_CURRENTLY_TRENDING = 'ranking_currently_trending',
  EXPLORE_SHARE_THIS_TOKEN = 'explore_share_this_token',
}

export const KYBERAI_LISTYPE_TO_MIXPANEL = {
  [KyberAIListType.ALL]: MIXPANEL_KYBERAI_TAG.RANKING_ALL,
  [KyberAIListType.BULLISH]: MIXPANEL_KYBERAI_TAG.RANKING_BULLISH,
  [KyberAIListType.BEARISH]: MIXPANEL_KYBERAI_TAG.RANKING_BEARISH,
  [KyberAIListType.MYWATCHLIST]: MIXPANEL_KYBERAI_TAG.RANKING_MY_WATCHLIST,
  [KyberAIListType.TOP_CEX_INFLOW]: MIXPANEL_KYBERAI_TAG.RANKING_TOP_CEX_INFLOW,
  [KyberAIListType.TOP_CEX_OUTFLOW]: MIXPANEL_KYBERAI_TAG.RANKING_TOP_CEX_OUTFLOW,
  [KyberAIListType.TOP_TRADED]: MIXPANEL_KYBERAI_TAG.RANKING_TOP_TRADED,
  [KyberAIListType.TRENDING_SOON]: MIXPANEL_KYBERAI_TAG.RANKING_TRENDING_SOON,
  [KyberAIListType.TRENDING]: MIXPANEL_KYBERAI_TAG.RANKING_CURRENTLY_TRENDING,
}
