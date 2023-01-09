export interface ITokenOverview {
  tags: string[]
  name: string
  symbol: string
  desc: string
  webs: { key: string; value: string }[]
  communities: { key: string; value: string }[]
  address: string
  price: string
  '24hChange': number
  '24hLow': number
  '24hHigh': number
  '1yLow': number
  '1yHigh': number
  ATL: number
  ATH: number
  '24hVolume': number
  circulatingSupply: number
  marketCap: number
  holders: number
  kyberScore: {
    score: number
    label: string
  }
}

export interface INumberOfTrades {
  trades: {
    buy: number
    sell: number
    timestamp: number
  }[]
}
export interface ITradeVolume {
  volume: number
  timestamp: number
}
export interface INetflowToWhaleWallets {
  inflow: number
  outflow: number
  netflow: number
  timestamp: number
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
export interface IPagination {
  page: number
  pageSize: number
  totalItems: number
}
