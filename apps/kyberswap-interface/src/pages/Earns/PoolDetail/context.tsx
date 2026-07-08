import { ChainId, NativeCurrency } from '@kyberswap/ks-sdk-core'
import { ReactNode, createContext, useContext, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { PoolDetail, PoolDetailToken, usePoolDetailQuery, usePoolsExplorerQuery } from 'services/earn'
import { useGetTokenByAddressesQuery } from 'services/ksSetting'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import PoolDetailPageSkeleton from 'pages/Earns/PoolDetail/components/PoolDetailPageSkeleton'
import { NoteCard, PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { EARN_DEXES, EarnDexInfo, Exchange } from 'pages/Earns/constants'
import { EarnPool } from 'pages/Earns/types'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { getChainIdFromSlug } from 'utils/string'

interface PoolDetailContextValue {
  pool: PoolDetail
  poolAddress: string
  chainId: number
  exchange: Exchange
  dexInfo: EarnDexInfo
  chainInfo: NetworkInfo
  primaryToken: PoolDetailToken
  secondaryToken: PoolDetailToken
}

const PoolDetailContext = createContext<PoolDetailContextValue | null>(null)

const mergePoolTokens = (
  poolDetail: PoolDetail,
  poolExplorer: EarnPool | undefined,
  tokenMetadata: (WrappedTokenInfo | NativeCurrency)[] = [],
): PoolDetailToken[] => {
  const tokenMap = new Map(
    tokenMetadata
      .filter((token): token is WrappedTokenInfo => token && 'address' in token)
      .map(token => [token.address.toLowerCase(), token]),
  )
  return poolDetail.tokens.map((tokenDetail, index) => {
    const tokenExplorer = poolExplorer?.tokens[index]
    const metadata = tokenMap.get(tokenDetail.address.toLowerCase())
    return {
      ...tokenDetail,
      address: tokenExplorer?.address || tokenDetail.address,
      symbol: tokenExplorer?.symbol ?? tokenDetail.symbol,
      name: metadata?.name ?? '',
      logo: tokenExplorer?.logoURI ?? metadata?.logoURI,
      logoURI: tokenExplorer?.logoURI ?? metadata?.logoURI,
      isStable: metadata?.isStable,
    }
  })
}

export const PoolDetailProvider = ({ children }: { children: ReactNode }) => {
  // Pool identity comes from the path params: /pools/<chain-slug>/<protocol>/<address>.
  const { chain, protocol, address } = useParams()

  const exchange = protocol || ''
  const poolAddress = address || ''
  const poolChainId = getChainIdFromSlug(chain) ?? 0

  const { data: poolDetail, isLoading: isPoolLoading } = usePoolDetailQuery(
    {
      chainId: poolChainId,
      address: poolAddress,
    },
    { skip: !poolChainId || !poolAddress },
  )

  const { data: explorerData } = usePoolsExplorerQuery(
    {
      chainId: poolChainId,
      protocol: exchange,
      q: poolAddress,
    },
    { skip: !poolChainId || !poolAddress || !exchange },
  )

  const { data: tokenMetadata } = useGetTokenByAddressesQuery(
    {
      chainId: poolChainId as ChainId,
      addresses: poolDetail?.tokens.map(token => token.address) as string[],
    },
    { skip: !poolDetail },
  )

  const pool = useMemo<PoolDetail | undefined>(() => {
    if (!poolDetail) return undefined
    const poolExplorer = explorerData?.data.pools[0]

    return {
      ...poolExplorer,
      ...poolDetail,
      tokens: mergePoolTokens(poolDetail, poolExplorer, tokenMetadata),
    }
  }, [poolDetail, explorerData, tokenMetadata])

  if (!poolChainId || !poolAddress) {
    return <Navigate to={APP_PATHS.EARN_POOLS} replace />
  }

  if (!pool && isPoolLoading) {
    return <PoolDetailPageSkeleton />
  }

  if (!pool) {
    return (
      <PoolDetailWrapper>
        <NoteCard $warning>Unable to load pool detail.</NoteCard>
      </PoolDetailWrapper>
    )
  }

  const chainId = poolChainId
  const exchangeValue = pool.exchange as Exchange
  const primaryToken = pool.tokens[0]
  const secondaryToken = pool.tokens[1]

  const value = {
    pool,
    poolAddress: pool.address.toLowerCase(),
    chainId,
    exchange: exchangeValue,
    dexInfo: EARN_DEXES[exchangeValue],
    chainInfo: NETWORKS_INFO[chainId as ChainId],
    primaryToken,
    secondaryToken,
  }

  return <PoolDetailContext.Provider value={value}>{children}</PoolDetailContext.Provider>
}

export const usePoolDetailContext = () => {
  const context = useContext(PoolDetailContext)

  if (!context) {
    throw new Error('usePoolDetailContext must be used within PoolDetailProvider')
  }

  return context
}
