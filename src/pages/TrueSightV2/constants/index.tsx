import { ChainId } from '@kyberswap/ks-sdk-core'

import { SORT_DIRECTION } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'

import { KyberAIListType } from '../types'

export const WATCHLIST_MAX_LIMIT = 50
export const CUSTOM_WATCHLISTS_MAX_LIMIT = 5

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
  RANKING_FUNDING_RATE = 'ranking_funding_rate',
  RANKING_KYBERSCORE_DELTA = 'ranking_kyberscore_delta',
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
  [KyberAIListType.FUNDING_RATE]: MIXPANEL_KYBERAI_TAG.RANKING_FUNDING_RATE,
  [KyberAIListType.KYBERSWAP_DELTA]: MIXPANEL_KYBERAI_TAG.RANKING_KYBERSCORE_DELTA,
}

export enum SORT_FIELD {
  NAME = 'symbol',
  KYBER_SCORE = 'kyber_score',
  PRICE = 'price',
  VOLUME_24H = 'volume_24h',
  CEX_NETFLOW_24H = 'total_cex_netflow_24h',
  CEX_NETFLOW_3D = 'total_cex_netflow_3d',
  FIRST_DISCOVER_ON = 'trending_discovered_on',
  FUNDING_RATE = 'funding_rate',
  PRICE_CHANGE_24H = 'percent_change_24h',
  KYBER_SCORE_DELTA = 'kyber_score_delta',
}

export const DEFAULT_PARAMS_BY_TAB: Partial<{ [tab in KyberAIListType]: Record<string, string> }> = {
  [KyberAIListType.ALL]: { sort: `${SORT_FIELD.PRICE_CHANGE_24H}:${SORT_DIRECTION.DESC}` },
  [KyberAIListType.MYWATCHLIST]: { watchlist: `all` },
  [KyberAIListType.BULLISH]: {
    sort: `${SORT_FIELD.KYBER_SCORE}:${SORT_DIRECTION.DESC}`,
    kyberScoreTags: ['Very Bullish', 'Bullish'].join(','),
  },
  [KyberAIListType.BEARISH]: {
    sort: `${SORT_FIELD.KYBER_SCORE}:${SORT_DIRECTION.ASC}`,
    kyberScoreTags: ['Bearish', 'Very Bearish'].join(','),
  },
  [KyberAIListType.TOP_CEX_INFLOW]: {
    sort: `${SORT_FIELD.CEX_NETFLOW_3D}:${SORT_DIRECTION.DESC}`,
    cexNetflow3D: 'gt(0)',
  },
  [KyberAIListType.TOP_CEX_OUTFLOW]: {
    sort: `${SORT_FIELD.CEX_NETFLOW_3D}:${SORT_DIRECTION.ASC}`,
    cexNetflow3D: 'lt(0)',
  },
  [KyberAIListType.TOP_TRADED]: { sort: `${SORT_FIELD.VOLUME_24H}:${SORT_DIRECTION.DESC}` },
  [KyberAIListType.TRENDING]: { trendingTypes: 'trending' },
  [KyberAIListType.TRENDING_SOON]: { trendingTypes: 'trending-soon' },
  [KyberAIListType.FUNDING_RATE]: {
    sort: `${SORT_FIELD.FUNDING_RATE}:${SORT_DIRECTION.DESC}`,
    secondarySort: `${SORT_FIELD.KYBER_SCORE}:${SORT_DIRECTION.DESC}`, // (sort=<sort>,<secondarySort>) secondarySort is always at the end of sort string
    requiredFields: 'funding_rate',
  },
  [KyberAIListType.KYBERSWAP_DELTA]: {
    sort: `${SORT_FIELD.KYBER_SCORE_DELTA}:${SORT_DIRECTION.DESC}`,
    requiredFields: 'kyber_score_delta',
  },
}

export enum KYBERAI_CHART_ID {
  NUMBER_OF_TRADES = 'numberOfTrades',
  TRADING_VOLUME = 'tradingVolume',
  NETFLOW_TO_WHALE_WALLET = 'netflowToWhaleWallets',
  NETFLOW_TO_CEX = 'netflowToCentralizedExchanges',
  NUMBER_OF_TRANSFERS = 'numberOfTransfers',
  NUMBER_OF_HOLDERS = 'numberOfHolders',
  HOLDER_PIE_CHART = 'holdersPieChart',
  PRICE_CHART = 'priceChart',
  LIQUID_ON_CEX = 'liquidOnCEX',
  LIQUIDITY_PROFILE = 'liquidityProfile',
  MARKETS = 'markets',
}

export const Z_INDEX_KYBER_AI = {
  HEADER_TABLE_TOKENS: 2,
  LOADING_TOKENS_TABLE: 2,
  TOKEN_NAME_TABLE_COLUMN: 1,
  FILTER_TOKEN_OPTIONS: 4,
}

export const DEFAULT_EXPLORE_PAGE_TOKEN = {
  chain: 'ethereum',
  address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  assetId: 32895,
}

export enum KYBERSCORE_TAG_TYPE {
  VERY_BULLISH = 'Very Bullish',
  BULLISH = 'Bullish',
  NEUTRAL = 'Neutral',
  BEARISH = 'Bearish',
  VERY_BEARISH = 'Very Bearish',
}
