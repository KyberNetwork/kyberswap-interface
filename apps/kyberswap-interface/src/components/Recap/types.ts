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
  { scene: 'video-navigated', delay: 7000 },
  { scene: 'stars-stats', delay: 9000 },
  { scene: 'mark-on-market', delay: 16000 },
  { scene: 'trading-stats', delay: 18000 },
  { scene: 'top-percent', delay: 21000 },
  { scene: 'badge', delay: 23000 },
  { scene: 'capital-flow', delay: 26000 },
  { scene: 'top-chains', delay: 29000 },
  { scene: 'top-tokens', delay: 32000 },
  { scene: 'mev-bots', delay: 35000 },
  { scene: 'mev-flow', delay: 37000 },
  { scene: 'fairflow-rewards', delay: 39000 },
  { scene: 'liquidity-smarter', delay: 42000 },
  { scene: 'smarter-finale', delay: 43000 },
  { scene: 'summary', delay: 47000 },
]

// Part durations for progress bar
export const PART_DURATIONS = {
  PART1: 16000, // 16 seconds (from start to mark-on-market)
  PART2: 10000, // 10 seconds (from mark-on-market to capital-flow)
  PART3: 9000, // 9 seconds (from capital-flow to mev-bots)
  PART4: 12000, // 12 seconds (from mev-bots to summary, includes smarter-finale)
  PART5: 10000, // 10 seconds (summary only)
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
