import useSWR from 'swr'

import { TRUESIGHT_V2_API } from 'constants/env'

import { testParams } from '../pages/SingleToken'
import {
  IFundingRate,
  IHolderList,
  INetflowToWhaleWallets,
  INumberOfHolders,
  INumberOfTrades,
  INumberOfTransfers,
  ITokenOverview,
  ITradeVolume,
} from '../types'
import { FUNDING_RATE, HOLDER_LIST, NETFLOW_TO_WHALE_WALLETS, TOKEN_DETAIL } from './sampleData'

export function useTokenDetail(tokenAddress?: string) {
  const { data, isLoading } = useSWR<ITokenOverview>(
    tokenAddress && `${TRUESIGHT_V2_API}/overview/ethereum/${tokenAddress}`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return TOKEN_DETAIL
        }),
  )
  return { data: TOKEN_DETAIL || data, isLoading }
}

export function useNumberOfTrades(tokenAddress?: string) {
  const { data, isLoading } = useSWR<INumberOfTrades[]>(
    tokenAddress && `${TRUESIGHT_V2_API}/trades/ethereum/${tokenAddress}?from=${testParams.from}&to=${testParams.to}`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return res.data
        }),
  )
  return { data, isLoading }
}

export function useTradingVolume(tokenAddress?: string) {
  const { data, isLoading } = useSWR<
    {
      buy: number
      sell: number
      buyVolume: number
      sellVolume: number
      timestamp: number
    }[]
  >(
    tokenAddress && `${TRUESIGHT_V2_API}/volume/ethereum/${tokenAddress}?from=1667362049&to=1675138049`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          const parsedData: {
            buy: number
            sell: number
            buyVolume: number
            sellVolume: number
            timestamp: number
          }[] = []
          res.data.buy.forEach((item: ITradeVolume, index: number) => {
            parsedData.push({
              buy: item.numberOfTrade || 0,
              buyVolume: item.tradeVolume || 0,
              timestamp: item.timestamp || 0,
              sell: res.data.sell[index].numberOfTrade || 0,
              sellVolume: res.data.sell[index].tradeVolume || 0,
            })
          })
          return parsedData
        }),
    { refreshInterval: 0 },
  )
  return { data, isLoading }
}

export function useNetflowToWhaleWallets(tokenAddress?: string) {
  const { data, isLoading } = useSWR<INetflowToWhaleWallets[]>(
    tokenAddress &&
      `${TRUESIGHT_V2_API}/netflow/ethereum/0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202?from=1669867147&to=1672372747`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return res.data.contents
        }),
  )
  return { data, isLoading }
}
export function useNetflowToCEX(tokenAddress?: string) {
  const { data, isLoading } = useSWR<INetflowToWhaleWallets[]>(
    tokenAddress && `${TRUESIGHT_V2_API}/netflow/cexes`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return NETFLOW_TO_WHALE_WALLETS
        }),
  )
  return { data: NETFLOW_TO_WHALE_WALLETS || data, isLoading }
}
export function useNumberOfTransfers(tokenAddress?: string) {
  const { data, isLoading } = useSWR<INumberOfTransfers[]>(
    tokenAddress &&
      `${TRUESIGHT_V2_API}/holdersNum/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1633344036&to=1675215565`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return res.data
        }),
  )
  return { data, isLoading }
}
export function useNumberOfHolders(tokenAddress?: string) {
  const { data, isLoading } = useSWR<INumberOfHolders[]>(
    tokenAddress &&
      `${TRUESIGHT_V2_API}/holdersNum/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1633344036&to=1675215565`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return res.data
        }),
  )
  return { data, isLoading }
}
export function useHolderList(tokenAddress?: string) {
  const { data, isLoading } = useSWR<IHolderList[]>(
    tokenAddress && `${TRUESIGHT_V2_API}/holders/ethereum/${tokenAddress}?from=${testParams.from}&to=${testParams.to}`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return HOLDER_LIST
        }),
  )
  return { data: HOLDER_LIST || data, isLoading }
}

export function useFundingRate() {
  const { data, isLoading } = useSWR<IFundingRate[]>(`${TRUESIGHT_V2_API}/holders/ethereum/C/BTC`, (url: string) =>
    fetch(url)
      .then(res => res.json())
      .then(res => {
        return FUNDING_RATE
      }),
  )
  return { data: FUNDING_RATE || data, isLoading }
}

export function useTokenList() {
  return {
    tokenList: {
      data: [
        {
          id: 1,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 2,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 3,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 4,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 5,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 6,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 7,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 8,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 9,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 10,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 11,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 12,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 13,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 14,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 15,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 16,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 17,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 18,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 19,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 20,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
        {
          id: 21,
          symbol: 'KNC',
          tokenName: 'Kyber Network Crystal',
          chain: 1,
          price: '0.00000004234',
          change: '20%',
          '24hVolume': '500M',
          kyberscore: '88',
        },
      ],
      totalItems: 21,
    },
  }
}
