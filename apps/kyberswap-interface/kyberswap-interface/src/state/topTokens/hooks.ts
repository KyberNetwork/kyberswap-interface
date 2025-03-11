import { Token } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'
import { useLazyGetTopTokensQuery } from 'services/ksSetting'

import { SUPPORTED_NETWORKS } from 'constants/networks'
import { CORRELATED_COINS_ADDRESS, SUPER_STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useStableCoins } from 'hooks/Tokens'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { updateTopTokens } from '.'
import { PairFactor, TopToken } from './type'

const validateAPI = (tokens: TopToken[]): boolean => {
  return tokens.every(
    token =>
      SUPPORTED_NETWORKS.includes(token.chainId) &&
      typeof token.address === 'string' &&
      typeof token.symbol === 'string' &&
      typeof token.name === 'string' &&
      typeof token.decimals === 'number' &&
      typeof token.marketCap === 'number' &&
      typeof token.logoURI === 'string' &&
      typeof token.isWhitelisted === 'boolean',
  )
}

const useTopTokens = (): {
  [address: string]: Token
} => {
  const { chainId } = useActiveWeb3React()
  const topTokens = useAppSelector(state => state.topTokens[chainId])
  const dispatch = useAppDispatch()
  const [getTopTokens] = useLazyGetTopTokensQuery()

  useEffect(() => {
    const fetchTopTokens = async () => {
      const { data: res } = await getTopTokens({ chainId, page: 1 })
      const topTokens = res?.data?.tokens || []

      if (topTokens.length) {
        if (!validateAPI(topTokens)) {
          console.error('Validate top tokens API failed', res)
        } else {
          dispatch(updateTopTokens({ chainId, topTokens }))
        }
      }
    }

    fetchTopTokens()
  }, [chainId, dispatch, getTopTokens])

  return useMemo(() => {
    if (!topTokens) return {}
    return topTokens.reduce((acc, topToken: TopToken) => {
      const token = new Token(topToken.chainId, topToken.address, topToken.decimals, topToken.symbol, topToken.name)
      acc[token.address] = token
      acc[token.address.toLowerCase()] = token
      return acc
    }, {} as { [address: string]: Token })
  }, [topTokens])
}

export const usePairFactor = (tokens: [Token | undefined | null, Token | undefined | null]): PairFactor => {
  // super stable: - super stable/super stable
  // stable: - stable/stable
  //         - super stable/stable
  //         - correlated
  // normal: - token/token in top 50 & not stable
  // exotic: other cases
  //         - token / token
  //         - token / stable
  //         - token / non-whitelisted
  //         - non-whitelisted / non-whitelisted
  const { chainId } = useActiveWeb3React()
  const topTokens = useTopTokens()
  const { isStableCoin } = useStableCoins(chainId)
  const token0 = tokens[0]
  const token1 = tokens[1]

  if (!token0 || !token1) return PairFactor.EXOTIC

  const isBothSuperStable =
    SUPER_STABLE_COINS_ADDRESS[chainId].includes(token0.address) &&
    SUPER_STABLE_COINS_ADDRESS[chainId].includes(token1.address)
  if (isBothSuperStable) return PairFactor.SUPER_STABLE

  const isBothStable = isStableCoin(token0.address) && isStableCoin(token1.address)
  const isCorrelated = CORRELATED_COINS_ADDRESS[chainId].some(
    coinsGroup => coinsGroup.includes(token0.address) && coinsGroup.includes(token1.address),
  )
  if (isBothStable || isCorrelated) return PairFactor.STABLE

  const isBothTop =
    topTokens[token0.address] &&
    topTokens[token1.address] &&
    !isStableCoin(token0.address) &&
    !isStableCoin(token1.address)
  if (isBothTop) return PairFactor.NOMAL

  return PairFactor.EXOTIC
}
