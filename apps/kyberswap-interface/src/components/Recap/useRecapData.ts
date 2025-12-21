import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useState } from 'react'
import {
  useGetAggregatedVolumeQuery,
  useGetChainVolumeQuery,
  useGetTokenVolumeQuery,
} from 'services/commonService'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'

interface TopToken {
  symbol: string
  logo: string
  chainLogo: string
}

type TokenVolumeItem = {
  tokenSymbol: string
  totalVolume: number
  chainId?: number
  logoUrl: string
}

export default function useRecapData() {
  const { account } = useActiveWeb3React()
  const { rewardInfo } = useKemRewards()

  const { data: aggregatedData, isLoading: isLoadingAggregated } =
    useGetAggregatedVolumeQuery(account || '', {
      skip: !account,
    })

  const { data: chainVolumeData, isLoading: isLoadingChainVolume } =
    useGetChainVolumeQuery(account || '', {
      skip: !account,
    })

  const { data: tokenVolumeData, isLoading: isLoadingTokenVolume } =
    useGetTokenVolumeQuery(account || '', {
      skip: !account,
    })

  const [topTokens, setTopTokens] = useState<TopToken[]>([])

  const { tradingVolume, txCount, top } = useMemo(() => {
    if (aggregatedData?.data?.summary) {
      return {
        tradingVolume: aggregatedData.data.summary.totalVolume || 0,
        txCount: aggregatedData.data.summary.totalTransactions || 0,
        top: aggregatedData.data.summary.percentage ?? 100,
      }
    }
    return { tradingVolume: 0, txCount: 0, top: 100 }
  }, [aggregatedData])

  const topChains = useMemo(() => {
    if (chainVolumeData?.data?.data?.length) {
      const sortedChains = [...chainVolumeData.data.data]
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, 3)

      return sortedChains
        .map(chain => {
          const chainId = chain.chainId as ChainId
          const networkInfo = NETWORKS_INFO[chainId]
          if (!networkInfo) return null
          return {
            chainId,
            name: networkInfo.name,
            icon: networkInfo.icon,
          }
        })
        .filter((chain): chain is NonNullable<typeof chain> => chain !== null)
    }
    return []
  }, [chainVolumeData])

  useEffect(() => {
    if (!tokenVolumeData?.data?.data?.length || !account) {
      setTopTokens([])
      return
    }

    try {
      const tokensWithInfo = (tokenVolumeData.data.data as TokenVolumeItem[])
        .map((token: TokenVolumeItem) => {
          const chainId = (token.chainId ?? 0) as ChainId
          const networkInfo = NETWORKS_INFO[chainId]
          if (!networkInfo) return null

          return {
            symbol: token.tokenSymbol,
            logo: token.logoUrl,
            chainLogo: networkInfo.icon,
            totalVolume: token.totalVolume,
          }
        })
        .filter(
          (token): token is TopToken & { totalVolume: number } => token !== null,
        )

      const sortedTokens = tokensWithInfo
        .sort(
          (a: TopToken & { totalVolume: number }, b: TopToken & { totalVolume: number }) =>
            b.totalVolume - a.totalVolume,
        )
        .slice(0, 5)

      setTopTokens(sortedTokens)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error processing top tokens:', error)
      setTopTokens([])
    }
  }, [tokenVolumeData, account])

  const totalRewards = useMemo(() => rewardInfo?.claimableUsdValue ?? 0, [rewardInfo])

  const data = useMemo(
    () => ({
      totalVolume: 80530000000, // Got from report - fixed
      totalUsers: 2500000, // Got from report - fixed
      tradingVolume,
      txCount,
      top,
      topChains,
      topTokens,
      totalRewards,
    }),
    [tradingVolume, txCount, top, topChains, topTokens, totalRewards],
  )

  return {
    data,
    loading: isLoadingAggregated || isLoadingChainVolume || isLoadingTokenVolume,
  }
}
