import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, createContext, useContext, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box } from 'rebass'
import { PoolDetailToken, usePoolDetailQuery, usePoolsExplorerQuery } from 'services/zapEarn'
import styled from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import { NETWORKS_INFO } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import PoolDetailPageSkeleton from 'pages/Earns/PoolDetail/components/PoolDetailPageSkeleton'
import { NoteCard, PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { Pool } from 'pages/Earns/PoolDetail/types'
import { EARN_DEXES, EarnDexInfo, Exchange } from 'pages/Earns/constants'

const TestSkeletonButton = styled(ButtonOutlined)`
  position: fixed;
  width: fit-content;
  top: 80px;
  right: 40px;
`

interface PoolDetailContextValue {
  pool: Pool
  poolAddress: string
  chainId: number
  exchange: Exchange
  dexInfo: EarnDexInfo
  chainInfo: NetworkInfo
  primaryToken: PoolDetailToken
  secondaryToken: PoolDetailToken
  feeTier: number
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
      chainId: explorerPool?.chainId || explorerPool?.chain?.id || poolChainId,
      tokens: mergePoolTokens(poolDetail, explorerPool),
    }
  }, [exchange, explorerPool, poolChainId, poolDetail])

  const isPoolLoading =
    Boolean(poolChainId && poolAddress) && (isPoolDetailLoading || (Boolean(exchange) && isExplorerLoading))

  const [checkSkeleton, setCheckSkeleton] = useState(false)

  if (checkSkeleton)
    return (
      <Box width="100%">
        <TestSkeletonButton onClick={() => setCheckSkeleton(false)}>Check Skeleton</TestSkeletonButton>
        <PoolDetailPageSkeleton />
      </Box>
    )

  if (!poolChainId || !poolAddress) {
    return (
      <PoolDetailWrapper>
        <NoteCard $warning>This page needs `poolChainId` and `poolAddress` to load pool detail.</NoteCard>
      </PoolDetailWrapper>
    )
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

  const chainId = pool.chainId || pool.chain?.id || poolChainId
  const exchangeValue = pool.exchange as Exchange
  const primaryToken = pool.tokens[0]
  const secondaryToken = pool.tokens[1]
  const feeTier = typeof pool.swapFee === 'number' ? pool.swapFee : Number(pool.feeTier || 0)

  const value = {
    pool,
    poolAddress: pool.address,
    chainId,
    exchange: exchangeValue,
    dexInfo: EARN_DEXES[exchangeValue],
    chainInfo: NETWORKS_INFO[chainId as ChainId],
    primaryToken,
    secondaryToken,
    feeTier,
  }

  return (
    <PoolDetailContext.Provider value={value}>
      <TestSkeletonButton onClick={() => setCheckSkeleton(true)}>Check Skeleton</TestSkeletonButton>
      {children}
    </PoolDetailContext.Provider>
  )
}

export const usePoolDetailContext = () => {
  const context = useContext(PoolDetailContext)

  if (!context) {
    throw new Error('usePoolDetailContext must be used within PoolDetailProvider')
  }

  return context
}
