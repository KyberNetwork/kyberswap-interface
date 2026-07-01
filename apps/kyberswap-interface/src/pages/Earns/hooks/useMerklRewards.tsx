import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLazySearchTokensBySymbolQuery } from 'services/ksSetting'
import { useGetMerklChainsQuery, useMerklRewardsQuery } from 'services/rewardMerkl'

import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import useFilter from 'pages/Earns/UserPositions/useFilter'
import { EarnChain } from 'pages/Earns/constants'
import { ChainRewardInfo, ParsedPosition, TokenRewardInfo } from 'pages/Earns/types'
import uriToHttp from 'utils/uriToHttp'

const EARN_CHAIN_IDS = new Set<number>(Object.values(EarnChain).filter((v): v is number => typeof v === 'number'))

// Module-level caches shared across all hook instances to avoid duplicate
// symbol lookups when multiple components subscribe to useMerklRewards.
const queriedSymbols = new Set<string>()
const logoBySymbolCache: Record<string, string> = {}
const logoByAddressCache: Record<string, string> = {}

type UseMerklRewardsProps = {
  positions?: Array<ParsedPosition>
}

const useMerklRewards = (options?: UseMerklRewardsProps) => {
  const { account } = useActiveWeb3React()
  const { filters } = useFilter()
  const { supportedChains } = useChainsConfig()
  // Source of truth for which chains to query Merkl on. Cached for a day in the API layer,
  // so this is effectively free for every consumer after the first call. We override the
  // global 60s `refetchOnMountOrArgChange` to match the day-long cache and avoid pointless
  // remount refetches of a list that changes on the order of weeks.
  const { data: merklChains, isSuccess: hasMerklChains } = useGetMerklChainsQuery(undefined, {
    refetchOnMountOrArgChange: 86_400,
  })
  const [tokenLogos, setTokenLogos] = useState<Record<string, string>>({})
  const [searchTokensBySymbol] = useLazySearchTokensBySymbolQuery()

  // Chains we actually want Merkl reward data for: every Earn-supported chain that Merkl
  // also knows about. We intentionally do NOT filter by `liveCampaigns > 0` — a chain with no
  // active campaigns can still hold unclaimed rewards from past campaigns, and dropping it
  // here would silently hide that claimable balance from the user.
  const merklEnabledChainIds = useMemo(
    () =>
      (merklChains || [])
        .filter(chain => EARN_CHAIN_IDS.has(chain.id))
        .map(chain => chain.id)
        .join(','),
    [merklChains],
  )

  const positionsKey = useMemo(
    () => (options?.positions || []).map(position => `${position.positionId}-${position.pool.address}`).join('|'),
    [options?.positions],
  )

  const positionsFilter = useMemo(
    () => options?.positions,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positionsKey],
  )

  const resolvePositionsForBreakdown = useCallback(
    (reason: string) => {
      if (!positionsFilter?.length) return []
      const [_, reasonPoolAddress, reasonTokenId] = reason.toLowerCase().split('_')

      return positionsFilter.filter(position => {
        const poolAddress = position.pool.address?.toLowerCase()
        const positionTokenId = position.tokenId?.toLowerCase()

        const matchByPositionId = reasonTokenId && reasonTokenId === positionTokenId
        if (matchByPositionId) return true

        // Only fall back to pool match when the reason lacks position id info
        const matchByPool = poolAddress && reasonPoolAddress === poolAddress
        return !reasonTokenId && matchByPool && positionsFilter.length === 1
      })
    },
    [positionsFilter],
  )

  const {
    data,
    isFetching,
    refetch: refetchMerklRewards,
  } = useMerklRewardsQuery(
    {
      address: account || '',
      chainId: filters.chainIds || merklEnabledChainIds,
    },
    // Wait for the Merkl chains list to resolve so the very first call to /rewards already
    // has the right chainIds.
    { skip: !account || !hasMerklChains },
  )

  const {
    baseRewards,
    rewardsByPosition,
  }: {
    baseRewards: TokenRewardInfo[]
    rewardsByPosition: Record<string, { rewards: TokenRewardInfo[]; totalUsdValue: number; claimedUsdValue: number }>
  } = useMemo(() => {
    if (!data) return { baseRewards: [], rewardsByPosition: {} }

    const perPositionRewards: Record<string, Record<string, TokenRewardInfo>> = {}
    // USD already claimed on Merkl per position, tracked alongside `perPositionRewards` so the
    // position card's "Claimed" row can reflect Merkl bonus, not just KEM farming rewards.
    const perPositionClaimedUsd: Record<string, number> = {}

    const calculatedRewards = data.flatMap(chainRewards =>
      (chainRewards.rewards || []).map(reward => {
        const filteredBreakdowns = reward.breakdowns.filter(item => {
          if (!positionsFilter?.length) return true

          const resolvedPositions = resolvePositionsForBreakdown(item.reason)
          return resolvedPositions.length > 0
        })

        // When no positions filter is applied we want the chain-level totals exactly as
        // Merkl reports them. Earlier this code summed `+item.<field>` across all breakdowns
        // via JS `Number`, which loses precision past 2^53 — for tokens with 18 decimals and
        // many breakdowns the summed `amount` and `claimed` diverge unpredictably, producing
        // a phantom non-zero `claimableAmount` (amount minus claimed) even when the chain
        // level reports `amount === claimed`.
        //
        // When positions ARE filtered, only matching breakdowns count, so we MUST sum — but
        // do it in `BigInt` to avoid the same precision drift.
        const sumField = (field: 'amount' | 'claimed' | 'pending'): string => {
          if (!positionsFilter?.length) return reward[field]
          let total = 0n
          for (const item of filteredBreakdowns) {
            try {
              total += BigInt(item[field])
            } catch {
              // skip malformed entries
            }
          }
          return total.toString()
        }

        return {
          ...reward,
          amount: sumField('amount'),
          claimed: sumField('claimed'),
          pending: sumField('pending'),
          breakdowns: filteredBreakdowns,
        }
      }),
    )

    // Merge multiple Merkl entries for the same token (different campaigns/roots) into a single row
    const mergedByToken: Record<string, TokenRewardInfo> = {}

    calculatedRewards
      .filter(reward => Number(reward.amount) > 0)
      .forEach(reward => {
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
              const key = position.positionId
              const tokenKey = `${reward.token.chainId}-${reward.token.address.toLowerCase()}`
              const existing = perPositionRewards[key]?.[tokenKey]
              const next: TokenRewardInfo = {
                symbol: reward.token.symbol,
                logo: existing?.logo || '',
                address: reward.token.address,
                chainId: reward.token.chainId,
                totalAmount: (existing?.totalAmount || 0) + breakdownTotalAmount,
                claimableAmount: (existing?.claimableAmount || 0) + breakdownClaimableAmount,
                unclaimedAmount: (existing?.unclaimedAmount || 0) + breakdownClaimableAmount,
                pendingAmount: (existing?.pendingAmount || 0) + breakdownPendingAmount,
                vestingAmount: 0,
                waitingAmount: 0,
                claimableUsdValue: (existing?.claimableUsdValue || 0) + breakdownClaimableAmount * reward.token.price,
              }

              perPositionRewards[key] = perPositionRewards[key] || {}
              perPositionRewards[key][tokenKey] = next
              perPositionClaimedUsd[key] =
                (perPositionClaimedUsd[key] || 0) + breakdownClaimedAmount * reward.token.price
            })
          })
        }

        const tokenKey = `${reward.token.chainId}-${reward.token.address.toLowerCase()}`
        const existing = mergedByToken[tokenKey]
        mergedByToken[tokenKey] = {
          symbol: reward.token.symbol,
          logo: existing?.logo || '',
          address: reward.token.address,
          chainId: reward.token.chainId,
          totalAmount: (existing?.totalAmount || 0) + totalAmount,
          claimableAmount: (existing?.claimableAmount || 0) + claimableAmount,
          unclaimedAmount: (existing?.unclaimedAmount || 0) + claimableAmount,
          pendingAmount: (existing?.pendingAmount || 0) + pendingAmount,
          vestingAmount: 0,
          waitingAmount: 0,
          claimableUsdValue: (existing?.claimableUsdValue || 0) + claimableAmount * reward.token.price,
        }
      })

    const baseRewards = Object.values(mergedByToken)
    const mappedRewardsByPosition: Record<
      string,
      { rewards: TokenRewardInfo[]; totalUsdValue: number; claimedUsdValue: number }
    > = {}
    Object.entries(perPositionRewards).forEach(([positionId, tokens]) => {
      const rewardsList = Object.values(tokens)
      mappedRewardsByPosition[positionId] = {
        rewards: rewardsList,
        totalUsdValue: rewardsList.reduce((sum, reward) => sum + reward.claimableUsdValue, 0),
        claimedUsdValue: perPositionClaimedUsd[positionId] || 0,
      }
    })

    return { baseRewards, rewardsByPosition: mappedRewardsByPosition }
  }, [data, positionsFilter, resolvePositionsForBreakdown])

  const baseRewardsForReturn = useMemo(() => {
    if (positionsFilter?.length) {
      // Merge tokens across positions to avoid duplicate rows when the same token appears on multiple positions
      const mergedAcrossPositions: Record<string, TokenRewardInfo> = {}
      Object.values(rewardsByPosition).forEach(item => {
        item.rewards.forEach(reward => {
          const key = `${reward.chainId}-${reward.address.toLowerCase()}`
          const existing = mergedAcrossPositions[key]
          mergedAcrossPositions[key] = existing
            ? {
                ...existing,
                totalAmount: existing.totalAmount + reward.totalAmount,
                claimableAmount: existing.claimableAmount + reward.claimableAmount,
                unclaimedAmount: existing.unclaimedAmount + reward.unclaimedAmount,
                pendingAmount: existing.pendingAmount + reward.pendingAmount,
                claimableUsdValue: existing.claimableUsdValue + reward.claimableUsdValue,
              }
            : reward
        })
      })
      return Object.values(mergedAcrossPositions)
    }
    return baseRewards
  }, [positionsFilter?.length, rewardsByPosition, baseRewards])

  const totalUsdValue = baseRewardsForReturn.reduce(
    (sum, reward) => sum + (isNaN(reward.claimableUsdValue) ? 0 : reward.claimableUsdValue),
    0,
  )

  useEffect(() => {
    if (!baseRewardsForReturn.length) return

    // Apply any logos already cached from previous hook instances (by address or by symbol)
    const cachedLogos: Record<string, string> = {}
    baseRewardsForReturn.forEach(reward => {
      const addrKey = `${reward.chainId}-${reward.address.toLowerCase()}`
      if (tokenLogos[addrKey]) return
      const byAddr = logoByAddressCache[addrKey]
      if (byAddr) {
        cachedLogos[addrKey] = byAddr
        return
      }
      const bySymbol = logoBySymbolCache[reward.symbol.toLowerCase()]
      if (bySymbol) cachedLogos[addrKey] = bySymbol
    })
    if (Object.keys(cachedLogos).length) {
      setTokenLogos(prev => ({ ...prev, ...cachedLogos }))
    }

    const fetchLogos = async () => {
      // Step 1: batch fetch by address per chain (fast, reliable for common tokens)
      const rewardsNeedingAddressFetch = baseRewardsForReturn.filter(reward => {
        const addrKey = `${reward.chainId}-${reward.address.toLowerCase()}`
        return !tokenLogos[addrKey] && !(addrKey in logoByAddressCache)
      })

      if (rewardsNeedingAddressFetch.length) {
        const grouped: Record<number, Set<string>> = {}
        rewardsNeedingAddressFetch.forEach(reward => {
          grouped[reward.chainId] = grouped[reward.chainId] || new Set<string>()
          grouped[reward.chainId].add(reward.address.toLowerCase())
        })

        const results = await Promise.all(
          Object.entries(grouped).map(([chainId, addresses]) =>
            fetchListTokenByAddresses(Array.from(addresses), Number(chainId) as ChainId).catch(() => []),
          ),
        )

        const fetchedByAddress: Record<string, string> = {}
        results.forEach(tokens => {
          tokens.forEach(token => {
            const key = `${token.chainId}-${token.address.toLowerCase()}`
            const resolvedLogo = token.logoURI ? uriToHttp(token.logoURI).reverse()[0] || token.logoURI : ''
            if (resolvedLogo) {
              fetchedByAddress[key] = resolvedLogo
              logoByAddressCache[key] = resolvedLogo
            }
          })
        })
        // Mark all queried addresses as attempted (even ones not found) to avoid re-fetching
        rewardsNeedingAddressFetch.forEach(reward => {
          const key = `${reward.chainId}-${reward.address.toLowerCase()}`
          if (!(key in logoByAddressCache)) logoByAddressCache[key] = ''
        })

        if (Object.keys(fetchedByAddress).length) {
          setTokenLogos(prev => ({ ...prev, ...fetchedByAddress }))
        }
      }

      // Step 2: fallback search by symbol for tokens still without a logo
      const stillMissing = baseRewardsForReturn.filter(reward => {
        const addrKey = `${reward.chainId}-${reward.address.toLowerCase()}`
        return !tokenLogos[addrKey] && !logoByAddressCache[addrKey]
      })
      if (!stillMissing.length) return

      const symbolsToFetch = Array.from(
        new Set(stillMissing.map(r => r.symbol).filter(symbol => symbol && !queriedSymbols.has(symbol.toLowerCase()))),
      )

      if (symbolsToFetch.length) {
        symbolsToFetch.forEach(symbol => queriedSymbols.add(symbol.toLowerCase()))

        const searchResults = await Promise.all(
          symbolsToFetch.map(symbol =>
            searchTokensBySymbol({ query: symbol, pageSize: 5 })
              .unwrap()
              .catch(() => null),
          ),
        )

        searchResults.forEach((result, idx) => {
          const querySymbol = symbolsToFetch[idx].toLowerCase()
          const tokens = result?.data?.tokens || []
          const match = tokens.find(t => t.symbol?.toLowerCase() === querySymbol && t.logoURI)
          if (match?.logoURI) {
            logoBySymbolCache[querySymbol] = uriToHttp(match.logoURI).reverse()[0] || match.logoURI
          }
        })
      }

      // Always apply any resolved symbol logos (including ones fetched by a concurrent hook instance)
      const fetchedBySymbol: Record<string, string> = {}
      stillMissing.forEach(reward => {
        const key = `${reward.chainId}-${reward.address.toLowerCase()}`
        const logo = logoBySymbolCache[reward.symbol.toLowerCase()]
        if (logo) fetchedBySymbol[key] = logo
      })

      if (Object.keys(fetchedBySymbol).length) {
        setTokenLogos(prev => ({ ...prev, ...fetchedBySymbol }))
      }
    }

    fetchLogos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseRewardsForReturn, searchTokensBySymbol])

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

  const parsedRewardsByPosition = useMemo<
    Record<string, { rewards: TokenRewardInfo[]; totalUsdValue: number; claimedUsdValue: number }>
  >(() => {
    if (!Object.keys(rewardsByPosition).length) return {}
    const result: Record<string, { rewards: TokenRewardInfo[]; totalUsdValue: number; claimedUsdValue: number }> = {}
    Object.entries(rewardsByPosition).forEach(([positionId, value]) => {
      result[positionId] = {
        totalUsdValue: value.totalUsdValue,
        claimedUsdValue: value.claimedUsdValue,
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

  const chainRewards = useMemo<ChainRewardInfo[]>(() => {
    if (!parsedRewards.length) return []

    const grouped: Record<number, { tokens: TokenRewardInfo[]; claimableUsdValue: number }> = {}
    parsedRewards.forEach(reward => {
      if (!grouped[reward.chainId]) {
        grouped[reward.chainId] = { tokens: [], claimableUsdValue: 0 }
      }
      grouped[reward.chainId].tokens.push(reward)
      grouped[reward.chainId].claimableUsdValue += reward.claimableUsdValue
    })

    return Object.entries(grouped).map(([chainIdStr, info]) => {
      const cId = Number(chainIdStr)
      // Prefer Kyber's name/icon for branding consistency, fall back to Merkl's data for chains
      // Kyber doesn't list (e.g., Stellar) so the row still renders sensibly.
      const kyberChain = supportedChains.find(c => c.chainId === cId)
      const merklChain = merklChains?.find(c => c.id === cId)
      return {
        chainId: cId,
        chainName: kyberChain?.name || merklChain?.name || `Chain ${cId}`,
        chainLogo: kyberChain?.icon || merklChain?.icon || '',
        claimableUsdValue: info.claimableUsdValue,
        tokens: info.tokens,
      }
    })
  }, [parsedRewards, supportedChains, merklChains])

  return useMemo(
    () => ({
      rewardsByPosition: parsedRewardsByPosition,
      rewards: parsedRewards,
      chainRewards,
      totalUsdValue,
      loading: isFetching,
      refetch: refetchMerklRewards,
      // Raw Merkl response — needed by the claim flow to access merkle proofs.
      rawData: data,
    }),
    [parsedRewardsByPosition, parsedRewards, chainRewards, totalUsdValue, isFetching, refetchMerklRewards, data],
  )
}

export default useMerklRewards
