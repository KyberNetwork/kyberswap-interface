import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, createContext, useContext, useMemo } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useGetTokenByAddressesQuery } from 'services/ksSetting'
import { PoolDetail, PoolDetailToken, usePoolDetailQuery } from 'services/zapEarn'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import PoolDetailPageSkeleton from 'pages/Earns/PoolDetail/components/PoolDetailPageSkeleton'
import { NoteCard, PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { EARN_DEXES, EarnDexInfo, Exchange } from 'pages/Earns/constants'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

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

const mergePoolTokens = (poolDetail: PoolDetail, tokenMetadata: WrappedTokenInfo[]): PoolDetailToken[] =>
  poolDetail.tokens.map(detailToken => {
    const metadata = tokenMetadata.find(token => token.address?.toLowerCase() === detailToken.address.toLowerCase())
    if (!metadata) return detailToken

    return {
      ...detailToken,
      address: metadata.address ?? detailToken.address,
      name: metadata.name ?? detailToken.name,
      symbol: metadata.symbol ?? detailToken.symbol,
      decimals: metadata.decimals ?? detailToken.decimals,
      logo: metadata.logoURI ?? detailToken.logoURI,
      logoURI: metadata.logoURI ?? detailToken.logoURI,
      isStable: detailToken.isStable ?? metadata.isStable,
    }
  })

export const PoolDetailProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams] = useSearchParams()

  const exchange = searchParams.get('exchange') || undefined
  const poolAddress = searchParams.get('poolAddress') || ''
  const poolChainId = Number(searchParams.get('poolChainId') || 0)

  const { data: poolDetail, isLoading: isPoolDetailLoading } = usePoolDetailQuery(
    {
      chainId: poolChainId,
      address: poolAddress,
    },
    { skip: !poolChainId || !poolAddress },
  )

  const { data: tokenMetadata = [], isLoading: isTokenMetadataLoading } = useGetTokenByAddressesQuery(
    {
      chainId: poolChainId as ChainId,
      addresses: poolDetail?.tokens.map(token => token.address) as string[],
    },
    { skip: !poolDetail },
  )

  const pool = useMemo<PoolDetail | undefined>(() => {
    if (!poolDetail) return undefined
    return {
      ...poolDetail,
      exchange: poolDetail.exchange || exchange,
      tokens: mergePoolTokens(poolDetail, tokenMetadata as WrappedTokenInfo[]),
    }
  }, [exchange, poolDetail, tokenMetadata])

  const isPoolLoading = Boolean(poolChainId && poolAddress) && (isPoolDetailLoading || isTokenMetadataLoading)

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
    poolAddress: pool.address,
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
