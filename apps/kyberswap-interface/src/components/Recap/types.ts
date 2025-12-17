export type Scene =
  | 'firework-2025'
  | 'year-of-flow'
  | 'video-chaotic'
  | 'video-you'
  | 'video-nickname'
  | 'video-navigated'
  | 'stars-stats'
  | 'mark-on-market'
  | 'trading-stats'
  | 'top-percent'
  | 'badge'
  | 'capital-flow'
  | 'top-chains'
  | 'top-tokens'
  | 'mev-bots'
  | 'mev-flow'
  | 'fairflow-rewards'
  | 'liquidity-smarter'
  | 'smarter-finale'
  | 'summary'

export interface TopChain {
  chainId: number
  name: string
  icon: string
}

export interface TopToken {
  symbol: string
  logo: string
  chainLogo: string
}

export interface RecapJourneyProps {
  nickname: string
  totalVolume: number
  totalUsers: number
  tradingVolume: number
  txCount: number
  top: number
  topChains: TopChain[]
  topTokens: TopToken[]
  totalRewards: number
  onClose?: () => void
}

// Timeline configuration
export const TIMELINE: { scene: Scene; delay: number }[] = [
  { scene: 'year-of-flow', delay: 1500 },
  { scene: 'video-chaotic', delay: 4000 },
  { scene: 'video-you', delay: 5500 },
  { scene: 'video-nickname', delay: 6000 },
  { scene: 'video-navigated', delay: 7500 },
  { scene: 'stars-stats', delay: 10500 },
  { scene: 'mark-on-market', delay: 17000 },
  { scene: 'trading-stats', delay: 19000 },
  { scene: 'top-percent', delay: 22000 },
  { scene: 'badge', delay: 24000 },
  { scene: 'capital-flow', delay: 27000 },
  { scene: 'top-chains', delay: 30000 },
  { scene: 'top-tokens', delay: 33000 },
  { scene: 'mev-bots', delay: 36000 },
  { scene: 'mev-flow', delay: 39000 },
  { scene: 'fairflow-rewards', delay: 42000 },
  { scene: 'liquidity-smarter', delay: 47000 },
  { scene: 'smarter-finale', delay: 50000 },
  { scene: 'summary', delay: 53000 },
]

// Part durations for progress bar
export const PART_DURATIONS = {
  PART1: 17000, // 17 seconds (from start to mark-on-market)
  PART2: 10000, // 10 seconds (from mark-on-market to capital-flow)
  PART3: 9000, // 9 seconds (from capital-flow to mev-bots)
  PART4: 14000, // 14 seconds (from mev-bots to summary)
  PART5: 10000, // 10 seconds (summary)
} as const

// Scene groupings for parts
export const PART_SCENES = {
  PART1: [
    'firework-2025',
    'year-of-flow',
    'video-chaotic',
    'video-you',
    'video-nickname',
    'video-navigated',
    'stars-stats',
  ] as Scene[],
  PART2: ['mark-on-market', 'trading-stats', 'top-percent', 'badge'] as Scene[],
  PART3: ['capital-flow', 'top-chains', 'top-tokens'] as Scene[],
  PART4: ['mev-bots', 'mev-flow', 'fairflow-rewards', 'liquidity-smarter', 'smarter-finale'] as Scene[],
  PART5: ['summary'] as Scene[],
} as const
