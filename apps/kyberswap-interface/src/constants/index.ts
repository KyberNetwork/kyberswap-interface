import { ChainId, Percent } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { v4 as uuid } from 'uuid'

import { TransactionFlowState } from 'types/TransactionFlowState'

import { MAINNET_NETWORKS, NETWORKS_INFO, SUPPORTED_NETWORKS } from './networks'

export const KYBERSWAP_DOMAIN = 'kyberswap.com'
/** Canonical production base URL (no trailing slash). Use this instead of hardcoding the domain. */
export const KYBERSWAP_URL = `https://${KYBERSWAP_DOMAIN}`

export const EMPTY_OBJECT: any = {}
export const EMPTY_ARRAY: any[] = []

export const BAD_RECIPIENT_ADDRESSES: Set<string> = new Set(
  MAINNET_NETWORKS.map(chainId => [
    ...Object.values(NETWORKS_INFO[chainId].classic.static || {}),
    ...Object.values(NETWORKS_INFO[chainId].classic.oldStatic || {}),
    ...Object.values(NETWORKS_INFO[chainId].classic.dynamic || {}),
    ...Object.values(NETWORKS_INFO[chainId].classic.fairlaunchV2 || {}),
    ...Object.values(NETWORKS_INFO[chainId].elastic.farms || {}),
    ...Object.values(NETWORKS_INFO[chainId].elastic.farmV2S || {}),
    ...([
      NETWORKS_INFO[chainId].classic.claimReward,
      NETWORKS_INFO[chainId].elastic.coreFactory,
      NETWORKS_INFO[chainId].elastic.nonfungiblePositionManager,
      NETWORKS_INFO[chainId].elastic.tickReader,
      NETWORKS_INFO[chainId].elastic.quoter,
      NETWORKS_INFO[chainId].elastic.routers,
      NETWORKS_INFO[chainId].elastic.farmv2Quoter,
      NETWORKS_INFO[chainId].kyberDAO?.staking,
      NETWORKS_INFO[chainId].kyberDAO?.dao,
      NETWORKS_INFO[chainId].kyberDAO?.rewardsDistributor,
      NETWORKS_INFO[chainId].kyberDAO?.KNCAddress,
      NETWORKS_INFO[chainId].kyberDAO?.KNCLAddress,
    ].filter(s => typeof s === 'string') as string[]),
  ]).flat(),
)

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const DMM_ANALYTICS = 'https://analytics.kyberswap.com/classic'

export const DMM_ANALYTICS_URL: { [chainId in ChainId]: string } = SUPPORTED_NETWORKS.reduce((acc, cur) => {
  return {
    ...acc,
    [cur]: `${DMM_ANALYTICS}/${NETWORKS_INFO[cur].route}`,
  }
}, {}) as { [chainId in ChainId]: string }

const PROMM_ANALYTICS = 'https://analytics.kyberswap.com/elastic'
export const AGGREGATOR_ANALYTICS_URL = 'https://lookerstudio.google.com/reporting/a2a0c9ff-6388-4d3a-bbf0-0fcfce9d5def'

export const PROMM_ANALYTICS_URL: { [chainId in ChainId]: string } = SUPPORTED_NETWORKS.reduce((acc, cur) => {
  return {
    ...acc,
    [cur]: `${PROMM_ANALYTICS}/${NETWORKS_INFO[cur].route}`,
  }
}, {}) as { [chainId in ChainId]: string }

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20
// denominated in seconds
export const TIME_TO_REFRESH_SWAP_RATE = 10

export const BIG_INT_ONE = JSBI.BigInt(1)
export const BIG_INT_ZERO = JSBI.BigInt(0)

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%

// for non degen mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_DEGEN: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

export const ETHER_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const KYBER_NETWORK_TELEGRAM_URL = 'https://t.me/kybernetwork'
export const KYBER_NETWORK_DISCORD_URL = 'https://discord.gg/kyberswap'
export const KYBER_NETWORK_TWITTER_URL = 'https://x.com/KyberNetwork'

export const DEFAULT_GAS_LIMIT_MARGIN = 20000

export const RESERVE_USD_DECIMALS = 100

export const requestId = uuid()

export const ELASTIC_BASE_FEE_UNIT = 100_000
export const KYBERSWAP_SOURCE = '{"source":"kyberswap"}'

export enum PAIR_CATEGORY {
  STABLE = 'stablePair',
  CORRELATED = 'correlatedPair',
  EXOTIC = 'exoticPair',
  HIGH_VOLATILITY = 'highVolatilityPair',
}

// https://www.nasdaq.com/glossary/b/bip
export const MAX_NORMAL_SLIPPAGE_IN_BIPS = 2000
export const MAX_DEGEN_SLIPPAGE_IN_BIPS = 5000

export const DEFAULT_SLIPPAGES = [5, 10, 50, 100]
export const DEFAULT_SLIPPAGES_HIGH_VOTALITY = [50, 150, 300, 500]
export const DEFAULT_TIPS = [0, 10, 30, 50]
export const MAX_FEE_IN_BIPS = 2000

export const DEFAULT_SLIPPAGE = 50
export const DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP = 1

export const APP_PATHS = {
  ABOUT: '/about',
  SWAP: '/swap',
  PARTNER_SWAP: '/partner-swap',
  USER_SWAP: '/user-swap',
  USER_SWAP_CREATE_TIPS: '/user-swap/create-tips',
  FIND_POOL: '/find',
  POOLS: '/pools',
  ADD_LIQUIDITY: '/pools/add-liquidity',
  // Path-based pool-detail: /pools/<chain-slug>/<protocol>/<address>. The ADD_LIQUIDITY
  // query-param form 301-redirects here. Build via getPoolDetailUrl (Earns/utils/url).
  POOL_DETAIL: '/pools/:chain/:protocol/:address',
  CLASSIC_CREATE_POOL: '/create',
  CLASSIC_ADD_LIQ: '/add',
  CLASSIC_REMOVE_POOL: '/remove',
  ELASTIC_CREATE_POOL: '/elastic/add',
  ELASTIC_INCREASE_LIQ: '/elastic/increase',
  ELASTIC_REMOVE_POOL: '/elastic/remove',
  FARMS: '/farms',
  MY_POOLS: '/myPools',
  DISCOVER: '/discover',
  CROSS_CHAIN: '/cross-chain',
  KYBERDAO: '/kyberdao',
  KYBERDAO_STAKE: '/kyberdao/stake-knc',
  KYBERDAO_VOTE: '/kyberdao/vote',
  KYBERDAO_KNC_UTILITY: '/kyberdao/knc-utility',
  LIMIT: '/limit',
  PROFILE_MANAGE: '/manage',
  ELASTIC_LEGACY: '/elastic-legacy',
  VERIFY_AUTH: '/auth',

  IAM_LOGIN: '/login',
  IAM_LOGOUT: '/logout',
  IAM_CONSENT: '/consent',

  DEPRECATED_NOTI_CENTER: '/notification-center/overview',
  ELASTIC_SNAPSHOT: '/elastic-snapshot',
  MARKET_OVERVIEW: '/market-overview',

  SAFEPAL_CAMPAIGN: '/campaigns/safepal',
  RAFFLE_CAMPAIGN: '/campaigns/weekly-rewards',
  NEAR_INTENTS_CAMPAIGN: '/campaigns/near-intents',
  MAY_TRADING_CAMPAIGN: '/campaigns/may-trading',
  AGGREGATOR_CAMPAIGN: '/campaigns/aggregator',
  LIMIT_ORDER_CAMPAIGN: '/campaigns/limit-order',
  REFFERAL_CAMPAIGN: '/campaigns/referrals',
  MY_DASHBOARD: '/campaigns/dashboard',

  EARN: '/earn',
  EARN_POOLS: '/earn/pools',
  EARN_POSITIONS: '/earn/positions',
  EARN_POSITION_DETAIL: '/earn/position/:positionId/:chainId/:exchange',
  EARN_SMART_EXIT: '/earn/smart-exit',
  EARNS: '/earns',
  EARNS_POOLS: '/earns/pools',
  EARNS_POSITIONS: '/earns/positions',
  RECAP_2025: '/2025-journey',
} as const

export const TERM_FILES_PATH = {
  KYBERSWAP_TERMS: '/files/Kyber - Terms of Use - 17 April 2025.pdf',
  PRIVACY_POLICY: '/files/Kyber - Privacy Policy - 20 November 2023.pdf',
  // Timestamp of changed date, update this to latest timestamp whenever change any above files. This also used to check on client side for updated to force user to disconnect and re-accept terms.
  VERSION: 1744873065000,
}

export const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

export const INPUT_DEBOUNCE_TIME = 300

export const ENABLE_CLICK_TO_REFRESH_GET_ROUTE = false

export const TIMES_IN_SECS = {
  ONE_DAY: 86400,
  ONE_HOUR: 3600,
  ONE_MIN: 60,
}

export const RTK_QUERY_TAGS = {
  // announcement
  GET_PRIVATE_ANN_BY_ID: 'GET_PRIVATE_ANN_BY_ID',
  GET_ALL_PRIVATE_ANN: 'GET_ALL_PRIVATE_ANN',
  GET_TOTAL_UNREAD_PRIVATE_ANN: 'GET_TOTAL_UNREAD_PRIVATE_ANN',
  GET_PUBLIC_ANN: 'GET_PUBLIC_ANN',
  GET_ALL_TOPICS_GROUP: 'GET_ALL_TOPICS_GROUP',

  // price alert
  GET_ALERTS: 'GET_ALERTS',
  GET_ALERTS_HISTORY: 'GET_ALERTS_HISTORY',
  GET_ALERTS_STAT: 'GET_ALERTS_STAT',

  // cross chain
  GET_CROSS_CHAIN_HISTORY: 'GET_CROSS_CHAIN_HISTORY',
  GET_BRIDGE_HISTORY: 'GET_BRIDGE_HISTORY',

  // limit order
  GET_LIMIT_ORDER_LIST: 'GET_LIMIT_ORDER_LIST',
  GET_LIMIT_ORDER_BOOK: 'GET_LIMIT_ORDER_BOOK',
  GET_LIMIT_ORDER_INSUFFICIENT: 'GET_LIMIT_ORDER_INSUFFICIENT',
  GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT: 'GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT',

  // smart exit
  GET_SMART_EXIT_ORDERS: 'GET_SMART_EXIT_ORDERS',

  GET_FARM_V2: 'GET_FARM_V2',
}

export const TRANSACTION_STATE_DEFAULT: TransactionFlowState = {
  showConfirm: false,
  attemptingTxn: false,
  errorMessage: '',
  txHash: undefined,
  pendingText: '',
}

export const CHAINS_SUPPORT_FEE_CONFIGS: ChainId[] = []
export const CHAINS_SUPPORT_CROSS_CHAIN = SUPPORTED_NETWORKS

export const SWAP_FEE_RECEIVER_ADDRESS = '0x4f82e73EDb06d29Ff62C91EC8f5Ff06571bdeb29'

export const TOKEN_SCORE_TTL = 86400

export const AGGREGATOR_API_PATHS = {
  BUILD_ROUTE: '/api/v1/route/build',
  GET_ROUTE: '/api/v1/routes',
}

export const ICON_IDS = [
  'truesight-v2',
  'notification-2',
  'bullish',
  'bearish',
  'trending-soon',
  'flame',
  'download',
  'upload',
  'coin-bag',
  'check',
  'pig',
  'speaker',
  'share',
  'liquid-outline',
  'refund',
  'swap',
  'copy',
  'open-link',
  'star',
  'fullscreen',
  'leaderboard',
  'liquid',
  'alarm',
  'on-chain',
  'technical-analysis',
  'liquidity-analysis',
  'news',
  'arrow',
  'chart',
  'lightbulb',
  'info',
  'question',
  'timer',
  'search',
  'devices',
  'eth-mono',
  'ava-mono',
  'bnb-mono',
  'matic-mono',
  'fantom-mono',
  'optimism-mono',
  'arbitrum-mono',
  'telegram',
  'twitter',
  'facebook',
  'discord',
  'assignment',
  'drag-indicator',
  'pencil',
  'trash',
] as const
export type ICON_ID = (typeof ICON_IDS)[number]

export const SAFE_APP_FEE_RECEIVER_ADDRESS = '0x55602F3057be52BFB6F98fFE799CFDec58Af5130'
export const SAFE_APP_CLIENT_ID = 'app.safe.global'

export const CROSS_CHAIN_FEE_RECEIVER = '0x0891617fe27647731d6f1e764092b2f9f06130A0'
export const CROSS_CHAIN_FEE_RECEIVER_SOLANA = 'D6tN4c5vpMqh4eFdHBUCEo7QLiw6DQy8f4NwqABZuJEf'
export const CROSS_CHAIN_FEE_RECEIVER_SUI = 'intentionally-empty-for-now'
// use a fake address in case user wallet is not connected. will reject if sign tx with this address
export const BTC_DEFAULT_RECEIVER = 'bc1qmzgkj3hznt8heh4vp33v2cr2mvsyhc3lmfzz9p'
export const SOLANA_NATIVE = '11111111111111111111111111111111'

export const BUNGEE_AFFILIATE_ID =
  '609913096e183f62cecd07e9c13f82e04ffbbdceb5fef75aad43e6cbff367039708902197e0b2b78b1d76cb0837ad0b318baedceb5fef75aad43e6cb'
