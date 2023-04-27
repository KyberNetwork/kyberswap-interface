export interface ITokenOverview {
  tags: string[]
  name: string
  symbol: string
  decimals: number
  logo: string
  description: string
  webs: string[]
  communities: { key: string; value: string }[]
  address: string
  price: number
  price24hChangePercent: number
  '24hLow': number
  '24hHigh': number
  '1yLow': number
  '1yHigh': number
  atl: number
  ath: number
  '24hVolume': number
  circulatingSupply: number
  marketCap: number
  numberOfHolders: number
  kyberScore: {
    score: number
    label: string
  }
  isWatched: boolean
}

export interface INumberOfTrades {
  buy: number
  sell: number
  timestamp: number
}
export interface ITradeVolume {
  numberOfTrade: number
  tradeVolume: number
  timestamp: number
}
export interface INetflowToWhaleWallets {
  whaleType: string
  inflow: number
  outflow: number
  netflow: number
  timestamp: number
}

export interface INetflowToCEX {
  cex: string
  inflow: number
  outflow: number
  netflow: number
  timestamp: number
}
export interface INumberOfTransfers {
  numberOfTransfer: number
  timestamp: number
  volume: number
}
export interface INumberOfHolders {
  count: number
  timestamp: number
}
export interface IHolderList {
  address: string
  percentage: number
  quantity: number
}
export interface IFundingRate {
  exchangeName: string
  timestamp: number
  rate: number
  symbol: string
}

export interface ITokenSearchResult {
  address: string
  name: string
  symbol: string
  logo: string
  chain: string
  price: number
  priceChange24h: number
  kyberScore: {
    score: number
    label: string
  }
}
export interface IPagination {
  page: number
  pageSize: number
  totalItems: number
}

export interface OHLCData {
  close: number
  high: number
  open: number
  low: number
  volume24H: number
  timestamp: number
}

export interface ITradingVolume {
  buy: number
  sell: number
  buyVolume: number
  sellVolume: number
  timestamp: number
  totalVolume: number
  totalTrade: number
}

export interface ILiquidCEX {
  buyVolUsd: number
  sellVolUsd: number
  timestamp: number
  exchanges: Array<{ exchangeName: string; buyVolUsd: number; sellVolUsd: number }>
  price: number
}

export interface ILiveTrade {
  amountToken: string
  price: number
  timestamp: number
  trader: string
  traderType: string
  txn: string
  type: string
}

export interface ISRLevel {
  timestamp: number
  value: number
}

export enum DiscoverTokenTab {
  OnChainAnalysis = 'On-Chain Analysis',
  TechnicalAnalysis = 'Technical Analysis',
  // News = 'News',
}

export enum TokenListTab {
  All = 'all',
  MyWatchlist = 'my_watchlist',
  Bullish = 'bullish',
  Bearish = 'bearish',
  TrendingSoon = 'trending_soon',
  CurrentlyTrending = 'currently_trending',
  TopInflow = 'top_cex_inflow',
  TopOutflow = 'top_cex_outflow',
  TopTraded = 'top_traded',
}

export enum ChartTab {
  First = 0,
  Second = 1,
  Third = 2,
}

export enum KyberAITimeframe {
  ONE_HOUR = '1h',
  FOUR_HOURS = '4h',
  ONE_DAY = '1d',
  ONE_WEEK = '7d',
  ONE_MONTH = '1m',
  THREE_MONTHS = '3m',
  SIX_MONTHS = '6m',
}
