export interface TokenOverview {
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
