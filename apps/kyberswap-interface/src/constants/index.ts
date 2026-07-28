import { SUPPORTED_NETWORKS } from './networks'

export const KYBERSWAP_DOMAIN = 'kyberswap.com'
/** Canonical production base URL (no trailing slash). Use this instead of hardcoding the domain. */
export const KYBERSWAP_URL = `https://${KYBERSWAP_DOMAIN}`

export const EMPTY_ARRAY: any[] = []

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const AGGREGATOR_ANALYTICS_URL = 'https://lookerstudio.google.com/reporting/a2a0c9ff-6388-4d3a-bbf0-0fcfce9d5def'

export const ETHER_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const KYBER_NETWORK_TELEGRAM_URL = 'https://t.me/kybernetwork'
export const KYBER_NETWORK_DISCORD_URL = 'https://discord.gg/kyberswap'
export const KYBER_NETWORK_TWITTER_URL = 'https://x.com/KyberNetwork'

export const APP_PATHS = {
  ABOUT: '/about',
  SWAP: '/swap',
  BUY: '/buy',
  SELL: '/sell',
  PARTNER_SWAP: '/partner-swap',
  USER_SWAP: '/user-swap',
  USER_SWAP_CREATE_TIPS: '/user-swap/create-tips',
  POOLS: '/pools',
  ADD_LIQUIDITY: '/pools/add-liquidity',
  // Path-based pool-detail: /pools/<chain-slug>/<protocol>/<address>. The ADD_LIQUIDITY
  // query-param form 301-redirects here. Build via getPoolDetailUrl (Earns/utils/url).
  POOL_DETAIL: '/pools/:chain/:protocol/:address',
  DISCOVER: '/discover',
  CROSS_CHAIN: '/cross-chain',
  KYBERDAO: '/kyberdao',
  KYBERDAO_STAKE: '/kyberdao/stake-knc',
  KYBERDAO_VOTE: '/kyberdao/vote',
  KYBERDAO_KNC_UTILITY: '/kyberdao/knc-utility',
  LIMIT: '/limit',
  PROFILE_MANAGE: '/manage',
  VERIFY_AUTH: '/auth',

  IAM_LOGIN: '/login',
  IAM_LOGOUT: '/logout',
  IAM_CONSENT: '/consent',

  DEPRECATED_NOTI_CENTER: '/notification-center/overview',
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
}

export const CHAINS_SUPPORT_CROSS_CHAIN = SUPPORTED_NETWORKS
