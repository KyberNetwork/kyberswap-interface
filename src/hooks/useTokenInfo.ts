import { Token } from '@kyberswap/ks-sdk-core'
import { useGetMarketTokenInfoQuery } from 'services/coingecko'

import { useActiveWeb3React } from 'hooks'

import useCoingeckoAPI from './useCoingeckoAPI'

export interface TokenInfo {
  price: number
  marketCap: number
  marketCapRank: number
  circulatingSupply: number
  totalSupply: number
  allTimeHigh: number
  allTimeLow: number
  tradingVolume: number
  description: { en: string }
  name: string
}

export default function useTokenInfo(token: Token | undefined): { data: TokenInfo; loading: boolean; error: any } {
  const { isSolana, chainId: currentChain } = useActiveWeb3React()
  const chainId = token?.chainId || currentChain
  const coingeckoAPI = useCoingeckoAPI()

  const tokenAddress = isSolana ? token?.address || '' : (token?.address || '').toLowerCase()
  const { data, error } = useGetMarketTokenInfoQuery(
    { chainId, address: tokenAddress, coingeckoAPI },
    { skip: !tokenAddress, pollingInterval: 60_000 },
  )

  const loading = !data

  const result = {
    price: data?.market_data?.current_price?.usd || 0,
    marketCap: data?.market_data?.market_cap?.usd || 0,
    marketCapRank: data?.market_data?.market_cap_rank || 0,
    circulatingSupply: data?.market_data?.circulating_supply || 0,
    totalSupply: data?.market_data?.total_supply || 0,
    allTimeHigh: data?.market_data?.ath?.usd || 0,
    allTimeLow: data?.market_data?.atl?.usd || 0,
    tradingVolume: data?.market_data?.total_volume?.usd || 0,
    description: data?.description || { en: '' },
    name: data?.name || '',
  }

  return { data: result, loading, error }
}
