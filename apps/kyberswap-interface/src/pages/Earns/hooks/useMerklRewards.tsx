import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMerklRewardsQuery } from 'services/rewardMerkl'

import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import useFilter from 'pages/Earns/UserPositions/useFilter'
import { ParsedPosition, TokenRewardInfo } from 'pages/Earns/types'
import uriToHttp from 'utils/uriToHttp'

type UseMerklRewardsProps = {
  positions?: ParsedPosition[]
}

const useMerklRewards = (options?: UseMerklRewardsProps) => {
  const { account } = useActiveWeb3React()
  const { filters } = useFilter()
  const { supportedChains } = useChainsConfig()
  const [tokenLogos, setTokenLogos] = useState<Record<string, string>>({})
  const positionsFilter = useMemo(() => options?.positions, [options?.positions])

  const resolvePositionsForBreakdown = useCallback(
    (reason: string) => {
      if (!positionsFilter?.length) return []
      const reasonLower = reason.toLowerCase()
      const [_, reasonPoolAddress, reasonTokenId] = reasonLower.split('_')

      return positionsFilter.filter(position => {
        const poolAddress = position.pool.address?.toLowerCase()
        const positionTokenId = position.tokenId?.toLowerCase()

        const matchByPositionId = reasonTokenId && reasonTokenId === positionTokenId

        const matchByPool = poolAddress && reasonPoolAddress === poolAddress

        if (matchByPositionId) return true

        // Only fall back to pool match when the reason lacks position id info
        return !reasonTokenId && matchByPool && positionsFilter.length === 1
      })
    },
    [positionsFilter],
  )

  const { data, isFetching } = useMerklRewardsQuery(
    {
      address: account || '',
      chainId: filters.chainIds || supportedChains.map(chain => chain.chainId).join(','),
    },
    { skip: !account },
  )

  const {
    baseRewards,
    rewardsByPosition,
  }: {
    baseRewards: TokenRewardInfo[]
    rewardsByPosition: Record<string, { rewards: TokenRewardInfo[]; totalUsdValue: number }>
  } = useMemo(() => {
    if (!data) return { baseRewards: [], rewardsByPosition: {} }

    const perPositionRewards: Record<string, Record<string, TokenRewardInfo>> = {}

    const calculatedRewards = data.flatMap(chainRewards =>
      (chainRewards.rewards || []).map(reward => {
        const breakdowns = reward.breakdowns.filter(item => {
          const [protocol] = item.reason.split('_')
          if (!protocol.startsWith('Uniswap')) return false

          if (!positionsFilter?.length) return true

          const resolvedPositions = resolvePositionsForBreakdown(item.reason)
          return resolvedPositions.length > 0
        })
        return {
          ...reward,
          amount: breakdowns.reduce((sum, item) => sum + +item.amount, 0).toString(),
          claimed: breakdowns.reduce((sum, item) => sum + +item.claimed, 0).toString(),
          pending: breakdowns.reduce((sum, item) => sum + +item.pending, 0).toString(),
          breakdowns,
        }
      }),
    )

    const baseRewards = calculatedRewards
      .filter(reward => Number(reward.amount) > 0)
      .map(reward => {
        const decimalsPow = 10 ** reward.token.decimals
        const totalAmount = Number(reward.amount) / decimalsPow
        const claimedAmount = Number(reward.claimed) / decimalsPow
        const pendingAmount = Number(reward.pending) / decimalsPow
        const claimableAmount = Math.max(totalAmount - claimedAmount, 0)

        if (positionsFilter) {
          reward.breakdowns.forEach(item => {
            const matchedPositions = resolvePositionsForBreakdown(item.reason)

            if (!matchedPositions.length) return

            const breakdownTotalAmount = Number(item.amount) / decimalsPow
            const breakdownClaimedAmount = Number(item.claimed) / decimalsPow
            const breakdownPendingAmount = Number(item.pending) / decimalsPow
            const breakdownClaimableAmount = Math.max(breakdownTotalAmount - breakdownClaimedAmount, 0)

            matchedPositions.forEach(position => {
              const key = position.id
              const tokenKey = `${reward.token.chainId}-${reward.token.address.toLowerCase()}`
              const existing = perPositionRewards[key]?.[tokenKey]
              const next: TokenRewardInfo = {
                symbol: reward.token.symbol,
                logo: existing?.logo || '',
                address: reward.token.address,
                chainId: reward.token.chainId,
                totalAmount: (existing?.totalAmount || 0) + breakdownTotalAmount,
                claimableAmount: (existing?.claimableAmount || 0) + breakdownClaimableAmount,
                unclaimedAmount: (existing?.claimableAmount || 0) + breakdownClaimableAmount,
                pendingAmount: (existing?.pendingAmount || 0) + breakdownPendingAmount,
                vestingAmount: 0,
                waitingAmount: 0,
                claimableUsdValue: ((existing?.claimableAmount || 0) + breakdownClaimableAmount) * reward.token.price,
              }

              perPositionRewards[key] = perPositionRewards[key] || {}
              perPositionRewards[key][tokenKey] = next
            })
          })
        }

        return {
          symbol: reward.token.symbol,
          logo: '',
          address: reward.token.address,
          chainId: reward.token.chainId,
          totalAmount,
          claimableAmount,
          unclaimedAmount: claimableAmount,
          pendingAmount,
          vestingAmount: 0,
          waitingAmount: 0,
          claimableUsdValue: claimableAmount * reward.token.price,
        }
      })
    const mappedRewardsByPosition: Record<string, { rewards: TokenRewardInfo[]; totalUsdValue: number }> = {}
    Object.entries(perPositionRewards).forEach(([positionId, tokens]) => {
      const rewardsList = Object.values(tokens)
      mappedRewardsByPosition[positionId] = {
        rewards: rewardsList,
        totalUsdValue: rewardsList.reduce((sum, reward) => sum + reward.claimableUsdValue, 0),
      }
    })

    return { baseRewards, rewardsByPosition: mappedRewardsByPosition }
  }, [data, positionsFilter, resolvePositionsForBreakdown])

  const baseRewardsForReturn = useMemo(() => {
    if (positionsFilter?.length) {
      return Object.values(rewardsByPosition).flatMap(item => item.rewards)
    }
    return baseRewards
  }, [positionsFilter?.length, rewardsByPosition, baseRewards])

  const totalUsdValue = baseRewardsForReturn.reduce((sum, reward) => sum + reward.claimableUsdValue, 0)

  useEffect(() => {
    if (!baseRewardsForReturn.length) return

    const fetchLogos = async () => {
      const grouped: Record<number, Set<string>> = {}
      baseRewardsForReturn.forEach(reward => {
        grouped[reward.chainId] = grouped[reward.chainId] || new Set<string>()
        grouped[reward.chainId].add(reward.address.toLowerCase())
      })

      const entries = Object.entries(grouped)
      if (!entries.length) return

      const results = await Promise.all(
        entries.map(([chainId, addresses]) =>
          fetchListTokenByAddresses(Array.from(addresses), Number(chainId) as ChainId).catch(() => []),
        ),
      )

      const nextLogos: Record<string, string> = {}
      results.forEach(tokens => {
        tokens.forEach(token => {
          const key = `${token.chainId}-${token.address.toLowerCase()}`
          const resolvedLogo = token.logoURI ? uriToHttp(token.logoURI).reverse()[0] || token.logoURI : ''
          nextLogos[key] = resolvedLogo
        })
      })
      setTokenLogos(nextLogos)
    }

    fetchLogos()
  }, [baseRewardsForReturn])

  const parsedRewards = useMemo<TokenRewardInfo[]>(() => {
    if (!baseRewardsForReturn.length) return []

    return baseRewardsForReturn.map(reward => {
      const logoKey = `${reward.chainId}-${reward.address.toLowerCase()}`
      return {
        ...reward,
        logo: tokenLogos[logoKey] || reward.logo,
      }
    })
  }, [baseRewardsForReturn, tokenLogos])

  const parsedRewardsByPosition = useMemo<Record<string, { rewards: TokenRewardInfo[]; totalUsdValue: number }>>(() => {
    if (!Object.keys(rewardsByPosition).length) return {}
    const result: Record<string, { rewards: TokenRewardInfo[]; totalUsdValue: number }> = {}
    Object.entries(rewardsByPosition).forEach(([positionId, value]) => {
      result[positionId] = {
        totalUsdValue: value.totalUsdValue,
        rewards: value.rewards.map(reward => {
          const logoKey = `${reward.chainId}-${reward.address.toLowerCase()}`
          return {
            ...reward,
            logo: tokenLogos[logoKey] || reward.logo,
          }
        }),
      }
    })
    return result
  }, [rewardsByPosition, tokenLogos])

  return useMemo(
    () => ({
      rewardsByPosition: parsedRewardsByPosition,
      rewards: parsedRewards,
      totalUsdValue,
      loading: isFetching,
    }),
    [parsedRewardsByPosition, parsedRewards, totalUsdValue, isFetching],
  )
}

export default useMerklRewards
