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

export default function useRecapData() {
  const { account } = useActiveWeb3React()
  const { rewardInfo } = useKemRewards()

  // Fetch aggregated volume data (tradingVolume, txCount, top)
  const { data: aggregatedData, isLoading: isLoadingAggregated } = useGetAggregatedVolumeQuery(account || '', {
    skip: !account,
  })

  // Fetch chain volume data to determine top chains
  const { data: chainVolumeData, isLoading: isLoadingChainVolume } = useGetChainVolumeQuery(account || '', {
    skip: !account,
  })

  // Fetch token volume data
  const { data: tokenVolumeData, isLoading: isLoadingTokenVolume } = useGetTokenVolumeQuery(account || '', {
    skip: !account,
  })

  const [topTokens, setTopTokens] = useState<TopToken[]>([])

  // Parse aggregated volume data
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

  // Parse chain volume data to get top chains
  const topChains = useMemo(() => {
    if (chainVolumeData?.data?.data?.length) {
      // Sort by totalVolume descending and take top 3
      const sortedChains = [...chainVolumeData.data.data].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 3)

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

  // Process top tokens directly from tokenVolumeData without fetching additional info
  useEffect(() => {
    if (!tokenVolumeData?.data?.data?.length || !account) {
      setTopTokens([])
      return
    }

    try {
      // Directly map tokens data to TopToken format
      const tokensWithInfo = tokenVolumeData.data.data.map(token => {
        const chainId = token.chainId as ChainId;
        const networkInfo = NETWORKS_INFO[chainId];
        if (!networkInfo) return null; // Skip if network info is missing

        return {
          symbol: token.tokenSymbol,
          logo: token.logoUrl,
          chainLogo: networkInfo.icon,
          totalVolume: token.totalVolume,
        };
      }).filter((token): token is TopToken & { totalVolume: number } => token !== null); // Filter out null items

      // Sort by totalVolume descending and take top 5
      const sortedTokens = tokensWithInfo.sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 5);
      setTopTokens(sortedTokens);
    } catch (error) {
      console.error('Error processing top tokens:', error);
      setTopTokens([]);
    }
  }, [tokenVolumeData, account]);

  // Get totalRewards from rewardInfo
  const totalRewards = useMemo(() => {
    return rewardInfo?.claimableUsdValue ?? 0
  }, [rewardInfo])

  const data = useMemo(
    () => ({
      totalVolume: 80530000000, // Got from report - fixed
      totalUsers: 2500000, // Got from report - fixed
      tradingVolume,
      txCount,
      top,
      topChains: topChains,
      topTokens: topTokens,
      totalRewards,
    }),
    [tradingVolume, txCount, top, topChains, topTokens, totalRewards],
  )

  return { data, loading: isLoadingAggregated || isLoadingChainVolume || isLoadingTokenVolume }
}