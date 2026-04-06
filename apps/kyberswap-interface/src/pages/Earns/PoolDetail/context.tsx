import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, createContext, useContext, useMemo } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { PoolDetail, PoolDetailToken, usePoolDetailQuery, usePoolsExplorerQuery } from 'services/zapEarn'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import PoolDetailPageSkeleton from 'pages/Earns/PoolDetail/components/PoolDetailPageSkeleton'
import { NoteCard, PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { EARN_DEXES, EarnDexInfo, Exchange } from 'pages/Earns/constants'
import { EarnPool } from 'pages/Earns/types'

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

const getExplorerPoolMatch = (pools: EarnPool[] | undefined, poolAddress: string, exchange?: string) => {
  if (!pools?.length || !poolAddress) return undefined

  const normalizedAddress = poolAddress.toLowerCase()

  return (
    pools.find(
      pool =>
        pool.address.toLowerCase() === normalizedAddress &&
        (!exchange || pool.exchange === exchange || pool.exchange === (exchange as Exchange)),
    ) || pools.find(pool => pool.address.toLowerCase() === normalizedAddress)
  )
}

const mergePoolTokens = (poolDetail: PoolDetail, explorerPool?: EarnPool) => {
  const explorerTokens = explorerPool?.tokens || []

  return poolDetail.tokens.map((detailToken, index) => {
    const explorerToken = explorerTokens[index]

    if (!explorerToken) return detailToken

    return {
      ...detailToken,
      ...explorerToken,
      address: explorerToken.address || detailToken.address,
      symbol: explorerToken.symbol || detailToken.symbol,
      decimals: explorerToken.decimals ?? detailToken.decimals,
      logoURI: explorerToken.logoURI || detailToken.logoURI,
    }
  })
}

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

  const { data: explorerData, isLoading: isExplorerLoading } = usePoolsExplorerQuery(
    {
      chainId: poolChainId,
      protocol: exchange || '',
      q: poolAddress,
    },
    { skip: !poolChainId || !poolAddress || !exchange },
  )

  const explorerPool = useMemo(
    () => getExplorerPoolMatch(explorerData?.data?.pools as EarnPool[] | undefined, poolAddress, exchange),
    [exchange, explorerData?.data?.pools, poolAddress],
  )

  const pool = useMemo<PoolDetail | undefined>(() => {
    if (!poolDetail) return undefined

    return {
      ...poolDetail,
      exchange: poolDetail.exchange || exchange,
      tokens: mergePoolTokens(poolDetail, explorerPool),
    }
  }, [exchange, explorerPool, poolDetail])

  const isPoolLoading =
    Boolean(poolChainId && poolAddress) && (isPoolDetailLoading || (Boolean(exchange) && isExplorerLoading))

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
