import { ReactNode, createContext, useContext, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePoolDetailQuery, usePoolsExplorerQuery } from 'services/zapEarn'

import PoolDetailPageSkeleton from 'pages/Earns/PoolDetail/components/PoolDetailPageSkeleton'
import { NoteCard, PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { Pool } from 'pages/Earns/PoolDetail/types'
import { Exchange } from 'pages/Earns/constants'

export interface PoolDetailPoolParams {
  poolChainId: number
  exchange?: string
  poolAddress: string
}

interface PoolDetailContextValue {
  poolParams: PoolDetailPoolParams
  pool: Pool
}

const PoolDetailContext = createContext<PoolDetailContextValue | null>(null)

const getExplorerPoolMatch = (pools: Pool[] | undefined, poolAddress: string, exchange?: string) => {
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

const mergePoolTokens = (poolDetail: Pool, explorerPool?: Pool) => {
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
      name: explorerToken.name || detailToken.name,
      logoURI: explorerToken.logoURI || detailToken.logoURI,
      weight: explorerToken.weight ?? detailToken.weight,
      swappable: explorerToken.swappable ?? detailToken.swappable,
    }
  })
}

export const PoolDetailProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams] = useSearchParams()

  const exchange = searchParams.get('exchange') || undefined
  const poolAddress = searchParams.get('poolAddress') || ''
  const poolChainId = Number(searchParams.get('poolChainId') || 0)

  const poolParams = useMemo<PoolDetailPoolParams>(
    () => ({
      poolChainId,
      exchange,
      poolAddress,
    }),
    [exchange, poolAddress, poolChainId],
  )

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
    () => getExplorerPoolMatch(explorerData?.data?.pools as Pool[] | undefined, poolAddress, exchange),
    [exchange, explorerData?.data?.pools, poolAddress],
  )

  const pool = useMemo<Pool | undefined>(() => {
    if (!poolDetail) return undefined

    return {
      ...explorerPool,
      ...poolDetail,
      exchange: explorerPool?.exchange || poolDetail.exchange || exchange,
      tokens: mergePoolTokens(poolDetail, explorerPool),
    }
  }, [exchange, explorerPool, poolDetail])

  const isPoolLoading =
    Boolean(poolChainId && poolAddress) && (isPoolDetailLoading || (Boolean(exchange) && isExplorerLoading))

  if (!poolChainId || !poolAddress) {
    return (
      <PoolDetailWrapper>
        <NoteCard $warning>This page needs `poolChainId` and `poolAddress` to load pool detail.</NoteCard>
      </PoolDetailWrapper>
    )
  }

  if (!pool && isPoolLoading) {
    return <PoolDetailPageSkeleton exchange={exchange} />
  }

  if (!pool) {
    return (
      <PoolDetailWrapper>
        <NoteCard $warning>Unable to load pool detail.</NoteCard>
      </PoolDetailWrapper>
    )
  }

  const value = {
    poolParams,
    pool,
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
