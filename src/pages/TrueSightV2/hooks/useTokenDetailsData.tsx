import useSWR from 'swr'

import { TRUESIGHT_V2_API } from 'constants/env'

import { TokenOverview } from '../types/index'

export default function useTokenDetailsData(tokenAddress: string) {
  const { data, isLoading } = useSWR<TokenOverview>(
    tokenAddress && `${TRUESIGHT_V2_API}/overview/chain/${tokenAddress}`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return {
            tags: ['Mineable', 'PoW', 'SHA-256', 'Store Of Value'],
            name: 'Bitcoin',
            symbol: 'BTC',
            desc: '',
            webs: [
              {
                key: 'bitcoin.org',
                value: 'https://bitcoin.org/en/',
              },
            ],
            communities: [
              {
                key: 'bitcointalk.org',
                value: 'https://bitcointalk.org/',
              },
            ],
            address: '',
            price: '16781.24',
            '24hChange': -0.09,
            '24hLow': 16755.91,
            '24hHigh': 16895.71,
            '1yLow': 15599.05,
            '1yHigh': 51956.33,
            ATL: 15599.05,
            ATH: 51956.33,
            '24hVolume': 14562220489,
            circulatingSupply: 19240143,
            marketCap: 324048677736,
            holders: 43588084,
            kyberScore: {
              score: 75.5,
              label: 'Strong Bullish',
            },
          }
        }),
  )
  return { data, isLoading }
}
