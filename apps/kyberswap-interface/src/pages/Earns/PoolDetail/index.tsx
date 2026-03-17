import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePoolDetailQuery, usePoolsExplorerQuery } from 'services/zapEarn'

import AddLiquidity from 'pages/Earns/PoolDetail/AddLiquidity'
import PoolHeader from 'pages/Earns/PoolDetail/components/PoolHeader'
import PoolInformation from 'pages/Earns/PoolDetail/components/PoolInformation'
import { PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { Pool } from 'pages/Earns/PoolDetail/types'

const PoolDetailPage = () => {
  const [searchParams] = useSearchParams()

  const exchange = searchParams.get('exchange') || ''
  const poolAddress = searchParams.get('poolAddress') || ''
  const chainId = Number(searchParams.get('poolChainId') || 0)
  const positionId = searchParams.get('positionId') || undefined
  const tickLower = searchParams.get('tickLower')
  const tickUpper = searchParams.get('tickUpper')

  const { data: poolDetail } = usePoolDetailQuery(
    {
      chainId,
      address: poolAddress,
    },
    { skip: !chainId || !poolAddress },
  )

  const { data: explorerData } = usePoolsExplorerQuery(
    {
      chainId,
      protocol: exchange,
      q: poolAddress,
    },
    { skip: !chainId || !poolAddress || !exchange },
  )
  const explorerPool = explorerData?.data?.pools?.[0]

  const pool = useMemo<Pool | undefined>(() => {
    if (!poolDetail) return undefined
    return {
      ...explorerPool,
      ...poolDetail,
      tokens: poolDetail.tokens.map((token, index) => {
        return {
          ...token,
          logoURI: explorerPool?.tokens?.[index]?.logoURI,
        }
      }),
    }
  }, [poolDetail, explorerPool])

  return (
    <PoolDetailWrapper>
      <PoolHeader pool={pool} chainId={chainId} exchange={exchange} />
      <AddLiquidity
        route={{
          exchange,
          poolAddress,
          chainId,
          positionId,
          tickLower,
          tickUpper,
        }}
      >
        <PoolInformation pool={pool} />
      </AddLiquidity>
    </PoolDetailWrapper>
  )
}

export default PoolDetailPage
