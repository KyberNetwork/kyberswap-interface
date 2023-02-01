import useSWR from 'swr'

import { TRUESIGHT_V2_API } from 'constants/env'

import {
  IFundingRate,
  IHolderList,
  INetflowToWhaleWallets,
  INumberOfHolders,
  INumberOfTrades,
  ITokenOverview,
  ITradeVolume,
} from '../types'
import {
  FUNDING_RATE,
  HOLDER_LIST,
  NETFLOW_TO_WHALE_WALLETS,
  NUMBER_OF_HOLDERS,
  NUMBER_OF_TRADES,
  TOKEN_DETAIL,
  TRADE_VOLUME,
} from './sampleData'

export default function useTokenDetailsData(tokenAddress: string) {
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

export function useNumberOfTrades(tokenAddress: string) {
  const { data, isLoading } = useSWR<INumberOfTrades>(
    tokenAddress && `${TRUESIGHT_V2_API}/trades/ethereum/${tokenAddress}`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return res.data
        }),
  )
  return { data: NUMBER_OF_TRADES || data, isLoading }
}

export function useTradingVolume(tokenAddress: string) {
  const { data, isLoading } = useSWR<ITradeVolume[]>(
    tokenAddress && `${TRUESIGHT_V2_API}/volume/ethereum/${tokenAddress}`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return res.data
        }),
  )
  return { data: TRADE_VOLUME || data, isLoading }
}

export function useNetflowToWhaleWallets(tokenAddress: string) {
  const { data, isLoading } = useSWR<INetflowToWhaleWallets[]>(
    tokenAddress && `${TRUESIGHT_V2_API}/netflow/ethereum/${tokenAddress}`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return NETFLOW_TO_WHALE_WALLETS
        }),
  )
  return { data, isLoading }
}
export function useNetflowToCEX(tokenAddress: string) {
  const { data, isLoading } = useSWR<INetflowToWhaleWallets[]>(
    tokenAddress && `${TRUESIGHT_V2_API}/netflow/cexes`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return NETFLOW_TO_WHALE_WALLETS
        }),
  )
  return { data, isLoading }
}
export function useNumberOfHolders(tokenAddress: string) {
  const { data, isLoading } = useSWR<INumberOfHolders[]>(
    tokenAddress && `${TRUESIGHT_V2_API}/holdersNum/ethereum/${tokenAddress}`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return NUMBER_OF_HOLDERS
        }),
  )
  return { data, isLoading }
}
export function useHolderList(tokenAddress: string) {
  const { data, isLoading } = useSWR<IHolderList[]>(
    tokenAddress && `${TRUESIGHT_V2_API}/holders/ethereum/${tokenAddress}`,
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res => {
          return HOLDER_LIST
        }),
  )
  return { data, isLoading }
}

export function useFundingRate() {
  const { data, isLoading } = useSWR<IFundingRate[]>(`${TRUESIGHT_V2_API}/holders/ethereum/C/BTC`, (url: string) =>
    fetch(url)
      .then(res => res.json())
      .then(res => {
        return FUNDING_RATE
      }),
  )
  return { data, isLoading }
}
