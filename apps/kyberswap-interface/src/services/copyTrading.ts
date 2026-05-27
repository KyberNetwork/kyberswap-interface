import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

export type CopyTradingStrategy = 'All Strategies' | 'Focused' | 'Diversified' | 'Active'
export type CopyTradingAgentTag = 'Active' | 'Diversified' | 'Focused'
export type CopyTradingProfileTab = 'open-position' | 'trade-history' | 'action-log'

export type CopyTradingStat = {
  icon: 'agent' | 'aum' | 'copiers' | 'volume'
  value: string
  label: string
  color: string
}

export type CopyTradingAgent = {
  id: string
  name: string
  initials: string
  network: string
  tag: CopyTradingAgentTag
  verified?: boolean
  hot?: boolean
  apr: string
  win: string
  volume: string
  copiers: string
  aum: string
  position: string
  selected?: boolean
}

export type CopyTradingProfileStat = {
  icon: 'pnl' | 'copiers' | 'winRate' | 'aum'
  value: string
  label: string
}

export type CopyTradingOpenPosition = {
  tradeId: string
  token: string
  entryPrice: string
  currentPrice: string
  amount: string
  value: string
  pnl: string
  pnlPercent: string
  openSince: string
  negative?: boolean
}

export type CopyTradingTradeHistory = {
  tradeId: string
  token: string
  entryPrice: string
  exitPrice: string
  amount: string
  realizedPnl: string
  fee: string
  cashBack: string
  closed: string
  negative?: boolean
}

export type CopyTradingActionLog = {
  id: string
  time: string
  block: string
  tx: string
  summary: string
  trigger: string
  data: string
  reasoning: string
  action: string
  confirmedTx: string
}

export type CopyTradingAgentProfile = {
  agent: CopyTradingAgent
  address: string
  fee: string
  liveSince: string
  isCopied: boolean
  copiedCapital: string
  stats: CopyTradingProfileStat[]
  winRate: string
  maxDrawdown: string
  wishlistTokens: string[]
  openPositions: CopyTradingOpenPosition[]
  tradeHistory: CopyTradingTradeHistory[]
  actionLogs: CopyTradingActionLog[]
}

export type CopyTradingSubscription = {
  id: string
  agent: CopyTradingAgent
  agentApr: string
  winRate: string
  volume: string
  capitalIn: string
  positions: string
  status: 'active' | 'closed'
  started: string
  stopped?: string
  capitalOut?: string
  realizedPnl?: string
  feesPaid?: string
  rebates?: string
}

export type CopyTradingSubscriptionPosition = {
  tradeId: string
  token: string
  entryPrice: string
  currentPrice: string
  value: string
  unrealisedPnl: string
  estRebate: string
  openSince: string
  status?: string
}

export type CopyTradingMyCopiesOverview = {
  stats: CopyTradingStat[]
  activeSubscriptions: CopyTradingSubscription[]
  closedSubscriptions: CopyTradingSubscription[]
  alerts: { color: string; message: string; time: string }[]
}

export type CopyTradingSubscriptionDetail = {
  subscription: CopyTradingSubscription
  profile: CopyTradingAgentProfile
  stats: CopyTradingProfileStat[]
  positions: CopyTradingSubscriptionPosition[]
  closedPositions: CopyTradingTradeHistory[]
}

export type CopyTradingOverview = {
  networks: string[]
  stats: CopyTradingStat[]
  strategies: CopyTradingStrategy[]
  leaderboard: CopyTradingAgent[]
  profiles: Record<string, CopyTradingAgentProfile>
  myCopiesOverview: CopyTradingMyCopiesOverview
  subscriptionDetails: Record<string, CopyTradingSubscriptionDetail>
}

export const copyTradingMockData: CopyTradingOverview = {
  networks: ['Ethereum', 'BNB Chain', 'Base', 'Arbitrum', 'Solana', 'Optimism'],
  stats: [
    { icon: 'agent', value: '12', label: 'Total Agents', color: 'bg-warning-20 text-warning' },
    { icon: 'aum', value: '$24.5M', label: 'Total AUM', color: 'bg-blue/20 text-blue' },
    { icon: 'copiers', value: '2,876', label: 'Total Copiers', color: 'bg-primary-20 text-primary' },
    { icon: 'volume', value: '$2.45M', label: 'Total Volume', color: 'bg-primary-12 text-primary' },
  ],
  strategies: ['All Strategies', 'Focused', 'Diversified', 'Active'],
  leaderboard: [
    {
      id: 'beta-hawk',
      name: 'Beta Hawk',
      initials: 'BH',
      network: 'Ethereum',
      tag: 'Active',
      hot: true,
      apr: '295.1%',
      win: '48.7%',
      volume: '$3.8M',
      copiers: '59',
      aum: '$0.2M',
      position: '4',
    },
    {
      id: 'gamma-falcon',
      name: 'Gamma Falcon',
      initials: 'GF',
      network: 'Base',
      tag: 'Diversified',
      verified: true,
      apr: '310.0%',
      win: '80.6%',
      volume: '$5.0M',
      copiers: '75',
      aum: '$0.15M',
      position: '3',
      selected: true,
    },
    {
      id: 'alpha-sniper',
      name: 'Alpha Sniper',
      initials: 'AS',
      network: 'Arbitrum',
      tag: 'Focused',
      verified: true,
      hot: true,
      apr: '42.5%',
      win: '52.1%',
      volume: '$4.2M',
      copiers: '67',
      aum: '$0.2M',
      position: '5',
    },
    {
      id: 'epsilon-lynx',
      name: 'Epsilon Lynx',
      initials: 'EL',
      network: 'Optimism',
      tag: 'Focused',
      verified: true,
      hot: true,
      apr: '20.5%',
      win: '50.0%',
      volume: '$4.5M',
      copiers: '70',
      aum: '$4.50M',
      position: '2',
    },
    {
      id: 'zeta-panther',
      name: 'Zeta Panther',
      initials: 'ZP',
      network: 'BNB Chain',
      tag: 'Active',
      hot: true,
      apr: '85.3%',
      win: '43.5%',
      volume: '$3.1M',
      copiers: '55',
      aum: '$0.47M',
      position: '4',
    },
    {
      id: 'eta-tiger',
      name: 'Eta Tiger',
      initials: 'ET',
      network: 'Base',
      tag: 'Diversified',
      verified: true,
      apr: '50.2%',
      win: '60.8%',
      volume: '$5.8M',
      copiers: '80',
      aum: '$0.18M',
      position: '7',
    },
    {
      id: 'theta-cougar',
      name: 'Theta Cougar',
      initials: 'TC',
      network: 'Ethereum',
      tag: 'Focused',
      apr: '90.7%',
      win: '46.0%',
      volume: '$3.6M',
      copiers: '52',
      aum: '$3.60M',
      position: '2',
    },
    {
      id: 'iota-leopard',
      name: 'Iota Leopard',
      initials: 'IL',
      network: 'Solana',
      tag: 'Active',
      hot: true,
      apr: '15.9%',
      win: '54.2%',
      volume: '$4.9M',
      copiers: '68',
      aum: '$4.90M',
      position: '6',
    },
    {
      id: 'kappa-jaguar',
      name: 'Kappa Jaguar',
      initials: 'KJ',
      network: 'Arbitrum',
      tag: 'Diversified',
      verified: true,
      apr: '75.0%',
      win: '39.0%',
      volume: '$2.7M',
      copiers: '50',
      aum: '$0.62M',
      position: '5',
      selected: true,
    },
    {
      id: 'lambda-cheetah',
      name: 'Lambda Cheetah',
      initials: 'LC',
      network: 'Optimism',
      tag: 'Focused',
      verified: true,
      apr: '30.4%',
      win: '57.5%',
      volume: '$5.3M',
      copiers: '73',
      aum: '$5.30M',
      position: '4',
    },
  ],
  profiles: {},
  myCopiesOverview: {
    stats: [],
    activeSubscriptions: [],
    closedSubscriptions: [],
    alerts: [],
  },
  subscriptionDetails: {},
}

const openPositions: CopyTradingOpenPosition[] = [
  {
    tradeId: '#SX-009',
    token: 'LUNA',
    entryPrice: '$0.0123',
    currentPrice: '$0.0127',
    amount: '850,000,000',
    value: '$10,475',
    pnl: '+$2,150',
    pnlPercent: '+25.9%',
    openSince: '2025-03-12 22:15 UTC',
  },
  {
    tradeId: '#SX-010',
    token: 'SOL',
    entryPrice: '$86.4',
    currentPrice: '$87.2',
    amount: '200',
    value: '$47,700',
    pnl: '+$5,200',
    pnlPercent: '+12.2%',
    openSince: '2025-03-12 22:30 UTC',
  },
  {
    tradeId: '#SX-011',
    token: 'MINT',
    entryPrice: '$0.0034',
    currentPrice: '$0.0035',
    amount: '2,000,000,000',
    value: '$7,000',
    pnl: '-$1,100',
    pnlPercent: '-18.6%',
    openSince: '2025-03-12 22:45 UTC',
    negative: true,
  },
  {
    tradeId: '#SX-012',
    token: 'NOVA',
    entryPrice: '$0.0150',
    currentPrice: '$0.0153',
    amount: '1,100,000,000',
    value: '$16,830',
    pnl: '+$2,600',
    pnlPercent: '+18.3%',
    openSince: '2025-03-12 23:00 UTC',
  },
  {
    tradeId: '#SX-013',
    token: 'ZEN',
    entryPrice: '$0.0456',
    currentPrice: '$0.0460',
    amount: '500,000,000',
    value: '$22,800',
    pnl: '+$3,400',
    pnlPercent: '+17.5%',
    openSince: '2025-03-12 23:15 UTC',
  },
]

const tradeHistory: CopyTradingTradeHistory[] = openPositions.map((position, index) => ({
  tradeId: position.tradeId,
  token: position.token,
  entryPrice: position.entryPrice,
  exitPrice: position.currentPrice,
  amount: position.amount,
  realizedPnl: position.pnl,
  fee: index === 2 ? '-' : ['$45.5', '$78.7', '$36.8', '$23.1'][index] || '$31.4',
  cashBack: ['$2,341', '$1,567', '$3,901', '$6,234', '$9,876'][index],
  closed:
    ['2025-03-15 03:15 UTC', '2025-03-15 03:00 UTC', '2025-03-15 02:45 UTC', '2025-03-15 02:30 UTC'][index] ||
    '2025-03-15 02:15 UTC',
  negative: position.negative,
}))

const actionLogs: CopyTradingActionLog[] = ['476-876', '476-877', '476-878'].map((tx, index) => ({
  id: tx,
  time: '2025-03-15 02:15 UTC',
  block: '#25,876,765',
  tx: `#${tx}`,
  summary: 'Sell 2 ETH -> USDC | Amount: $7,120 | Slippage: 0.3%',
  trigger: 'Scheduled 15-min cycle',
  data: 'ETH/USD 3,560 (-2.1% 1h) | ETH/BTC 0.0531 (-0.8% 4h) | Gas: 18 gwei\nKyberAI Bearish Signal Score: 73/100 | RSI(14): 41.2 | CVD: negative',
  reasoning:
    index === 0
      ? 'Short-term momentum is clearly bearish for ETH. The KyberAI signal confirms downside pressure. Risk budget allows a defensive reduction without triggering a full exit.'
      : '',
  action: 'Sell 2 ETH -> USDC | Amount: $7,120 | Slippage: 0.3%',
  confirmedTx: '0xDeF...901',
}))

const gammaFalcon =
  copyTradingMockData.leaderboard.find(agent => agent.id === 'gamma-falcon') || copyTradingMockData.leaderboard[0]

copyTradingMockData.profiles = {
  'gamma-falcon': {
    agent: gammaFalcon,
    address: '0x...31ec7',
    fee: '10% of profits',
    liveSince: '2025-03-01',
    isCopied: true,
    copiedCapital: '$30,000',
    stats: [
      { icon: 'pnl', value: '+$86,850', label: 'Total P&L' },
      { icon: 'copiers', value: '168', label: 'Copiers' },
      { icon: 'winRate', value: '80.6%', label: 'Win Rate' },
      { icon: 'aum', value: '$3,875', label: 'AUM' },
    ],
    winRate: '45%',
    maxDrawdown: '-12.5%',
    wishlistTokens: ['ETH', 'BTC', 'ALT', 'DOGE', 'SHIB', 'BNB', 'SOL', 'MATIC', 'ATOM', 'HBAR', 'NEAR'],
    openPositions,
    tradeHistory,
    actionLogs,
  },
}

for (const agent of copyTradingMockData.leaderboard) {
  if (copyTradingMockData.profiles[agent.id]) continue
  copyTradingMockData.profiles[agent.id] = {
    ...copyTradingMockData.profiles['gamma-falcon'],
    agent,
    isCopied: agent.id === 'beta-hawk',
  }
}

const activeSubscriptions: CopyTradingSubscription[] = [
  ['beta-hawk', '$3,800', '2'],
  ['gamma-falcon', '$5,000', '1'],
  ['delta-wolf', '$2,900', '4'],
  ['epsilon-lynx', '$4,500', '8'],
  ['zeta-panther', '$3,100', '2'],
  ['eta-tiger', '$5,800', '2'],
].map(([agentId, capitalIn, positions]) => {
  const agent = copyTradingMockData.leaderboard.find(item => item.id === agentId) || copyTradingMockData.leaderboard[0]
  return {
    id: `copy-${agent.id}`,
    agent,
    agentApr: agent.apr,
    winRate: agent.win,
    volume: agent.volume,
    capitalIn,
    positions,
    status: 'active',
    started: '2025-03-13 01:52',
  }
})

const closedSubscriptions: CopyTradingSubscription[] = [
  ['violet-viper', 'Violet Viper', 'VV', '132', '$6,500.00', '$7,800.00', '+$1,300.00', '$2,500', '$20.00'],
  ['gamma-falcon', 'Gamma Falcon', 'GF', '65', '$7,000.00', '$9,100.00', '+$2,100.00', '$3,000', '$25.00'],
  ['delta-wolf', 'Delta Wolf', 'DW', '34', '$4,800.00', '$5,700.00', '+$900.00', '$1,800', '$10.00'],
  ['beta-hawk', 'Beta Hawk', 'BH', '89', '$6,900.00', '$5,700.00', '-$1,200.00', '$0.00', '$12.00'],
  ['eta-tiger', 'Eta Tiger', 'ET', '21', '$5,200.00', '$6,500.00', '+$1,300.00', '$2,700', '$22.00'],
].map(([id, name, initials, closedTrades, capitalIn, capitalOut, realizedPnl, feesPaid, rebates], index) => {
  const agent = copyTradingMockData.leaderboard.find(item => item.id === id) || {
    id,
    name,
    initials,
    network: 'Base',
    tag: 'Focused' as CopyTradingAgentTag,
    apr: '0%',
    win: '0%',
    volume: '$0',
    copiers: '0',
    aum: '$0',
    position: '0',
    verified: true,
    hot: index < 2,
  }
  return {
    id: `closed-${id}-${index}`,
    agent,
    agentApr: agent.apr,
    winRate: agent.win,
    volume: agent.volume,
    capitalIn,
    positions: closedTrades,
    status: 'closed',
    started: ['2026-04-22 03:45', '2026-05-17 19:33', '2026-06-02 11:58', '2026-07-29 23:05', '2026-09-09 15:14'][
      index
    ],
    stopped: ['2026-04-23 18:22', '2026-05-18 08:11', '2026-06-03 02:36', '2026-07-30 14:43', '2026-09-10 04:52'][
      index
    ],
    capitalOut,
    realizedPnl,
    feesPaid,
    rebates,
  }
})

const subscriptionPositions: CopyTradingSubscriptionPosition[] = [
  {
    tradeId: '#BZ-407',
    token: 'PEPE',
    entryPrice: '$0.415',
    currentPrice: '$0.0912',
    value: '$8,792',
    unrealisedPnl: '+$2,150 (+25.9%)',
    estRebate: '$38.92',
    openSince: '2025-03-13 01:52',
  },
  {
    tradeId: '#CY-839',
    token: 'MATIC',
    entryPrice: '$0.0234',
    currentPrice: '$0.0823',
    value: '$6,539',
    unrealisedPnl: 'Closing...',
    estRebate: '$12.57',
    openSince: '2025-03-13 08:22',
    status: 'Closing...',
  },
  {
    tradeId: '#DX-126',
    token: 'COMP',
    entryPrice: '$0.0345',
    currentPrice: '$0.0734',
    value: '$9,125',
    unrealisedPnl: '+$2,150 (+25.9%)',
    estRebate: '$98.45',
    openSince: '2025-03-13 15:43',
  },
  {
    tradeId: '#EV-503',
    token: 'AVAX',
    entryPrice: '$0.0456',
    currentPrice: '$0.0645',
    value: '$7,851',
    unrealisedPnl: 'Tracking paused',
    estRebate: '$67.12',
    openSince: '2025-03-14 02:04',
    status: 'Tracking paused',
  },
]

copyTradingMockData.myCopiesOverview = {
  stats: [
    { icon: 'volume', value: '$17,000', label: 'Total Allocated', color: 'bg-primary-12 text-primary' },
    { icon: 'aum', value: '+$1,492', label: 'Unrealised P&L', color: 'bg-blue/20 text-blue' },
    { icon: 'copiers', value: '20', label: 'Open Positions', color: 'bg-primary-20 text-primary' },
    { icon: 'agent', value: '6', label: 'Active Copies', color: 'bg-warning-20 text-warning' },
  ],
  activeSubscriptions,
  closedSubscriptions,
  alerts: [
    { color: 'bg-blue', message: 'AlphaBot #042 opened new position: Buy ARB (#042-011)', time: 'just now' },
    {
      color: 'bg-primary',
      message: 'Yield Hunter v3: Trade #YH-032 skipped - insufficient USDC balance',
      time: '2 min ago',
    },
    {
      color: 'bg-primary',
      message: 'Steady Yield Base closed Trade #110: Sold ETH. Realised P&L: +$45.20',
      time: '12 min ago',
    },
    { color: 'bg-warning', message: 'AlphaBot #042 closed position #042-006 WBTC - P&L: -$120', time: '32 min ago' },
  ],
}

for (const subscription of [...activeSubscriptions, ...closedSubscriptions]) {
  const profile = copyTradingMockData.profiles[subscription.agent.id] || copyTradingMockData.profiles['gamma-falcon']
  copyTradingMockData.subscriptionDetails[subscription.id] = {
    subscription,
    profile,
    stats: [
      { icon: 'pnl', value: '+$86,850', label: 'Total P&L' },
      {
        icon: 'winRate',
        value: subscription.status === 'active' ? '54.2%' : 'Closed',
        label: subscription.status === 'active' ? 'APR 30D' : 'Status',
      },
      { icon: 'aum', value: '80.6%', label: 'Win Rate' },
      {
        icon: 'copiers',
        value: subscription.status === 'active' ? '$3,875' : '+$86,850',
        label: subscription.status === 'active' ? 'Fee Paid' : 'Total Realised P&L',
      },
      { icon: 'pnl', value: '$254.76', label: 'Est. Rebate Pending' },
    ],
    positions: subscriptionPositions,
    closedPositions: tradeHistory,
  }
}

const copyTradingApi = createApi({
  reducerPath: 'copyTradingApi',
  baseQuery: fakeBaseQuery(),
  endpoints: builder => ({
    getCopyTradingOverview: builder.query<CopyTradingOverview, void>({
      queryFn: async () => ({ data: copyTradingMockData }),
    }),
    getCopyTradingAgentProfile: builder.query<CopyTradingAgentProfile | undefined, string>({
      queryFn: async agentId => ({ data: copyTradingMockData.profiles[agentId] }),
    }),
    getCopyTradingMyCopiesOverview: builder.query<CopyTradingMyCopiesOverview, void>({
      queryFn: async () => ({ data: copyTradingMockData.myCopiesOverview }),
    }),
    getCopyTradingSubscriptionDetail: builder.query<CopyTradingSubscriptionDetail | undefined, string>({
      queryFn: async subscriptionId => ({ data: copyTradingMockData.subscriptionDetails[subscriptionId] }),
    }),
  }),
})

export const {
  useGetCopyTradingAgentProfileQuery,
  useGetCopyTradingSubscriptionDetailQuery,
  useGetCopyTradingMyCopiesOverviewQuery,
  useGetCopyTradingOverviewQuery,
} = copyTradingApi

export default copyTradingApi
