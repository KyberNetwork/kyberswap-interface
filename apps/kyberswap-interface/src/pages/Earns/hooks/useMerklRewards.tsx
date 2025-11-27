import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useState } from 'react'
import { useMerklRewardsQuery } from 'services/rewardMerkl'

import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import useFilter from 'pages/Earns/UserPositions/useFilter'
import { ParsedPosition, TokenRewardInfo } from 'pages/Earns/types'
import uriToHttp from 'utils/uriToHttp'

type UseMerklRewardsProps = {
  position?: ParsedPosition
}

const useMerklRewards = (options?: UseMerklRewardsProps) => {
  const { account } = useActiveWeb3React()
  const { filters } = useFilter()
  const { supportedChains } = useChainsConfig()
  const [tokenLogos, setTokenLogos] = useState<Record<string, string>>({})

  const { data, isFetching } = useMerklRewardsQuery(
    {
      address: account || '',
      chainId: filters.chainIds || supportedChains.map(chain => chain.chainId).join(','),
    },
    { skip: !account },
  )

  const baseRewards = useMemo<TokenRewardInfo[]>(() => {
    if (!data) return []

    const calculatedRewards = data.flatMap(chainRewards =>
      (chainRewards.rewards || []).map(reward => {
        const breakdowns = reward.breakdowns.filter(item => {
          const [protocol, poolAddress, positionId] = item.reason.split('_')
          return (
            protocol.startsWith('Uniswap') &&
            (options?.position
              ? poolAddress === options.position.pool.address && positionId === options.position.tokenId
              : true)
          )
        })
        return {
          ...reward,
          amount: breakdowns.reduce((sum, item) => sum + +item.amount, 0).toString(),
          claimed: breakdowns.reduce((sum, item) => sum + +item.claimed, 0).toString(),
          pending: breakdowns.reduce((sum, item) => sum + +item.pending, 0).toString(),
        }
      }),
    )

    return calculatedRewards
      .filter(reward => Number(reward.amount) > 0)
      .map(reward => {
        const decimalsPow = 10 ** reward.token.decimals
        const totalAmount = Number(reward.amount) / decimalsPow
        const claimedAmount = Number(reward.claimed) / decimalsPow
        const pendingAmount = Number(reward.pending) / decimalsPow
        const claimableAmount = Math.max(totalAmount - claimedAmount, 0)

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
  }, [data, options?.position])

  useEffect(() => {
    if (!baseRewards.length) return

    const fetchLogos = async () => {
      const grouped: Record<number, Set<string>> = {}
      baseRewards.forEach(reward => {
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
  }, [baseRewards])

  const parsedRewards = useMemo<TokenRewardInfo[]>(() => {
    if (!baseRewards.length) return []

    return baseRewards.map(reward => {
      const logoKey = `${reward.chainId}-${reward.address.toLowerCase()}`
      return {
        ...reward,
        logo: tokenLogos[logoKey] || reward.logo,
      }
    })
  }, [baseRewards, tokenLogos])

  return useMemo(
    () => ({
      rewards: parsedRewards,
      loading: isFetching,
    }),
    [parsedRewards, isFetching],
  )
}

export default useMerklRewards
