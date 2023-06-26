import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { Flex } from 'rebass'
import { useGetClassicEarningQuery } from 'services/earning'
import { ClassicPoolEarningWithDetails } from 'services/earning/types'

import { useActiveWeb3React } from 'hooks'
import { ClassicPoolData, useAllPoolsData } from 'pages/MyEarnings/hooks'
import { chainIdByRoute } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { UserLiquidityPosition, useUserLiquidityPositions } from 'state/pools/hooks'

import SinglePool from './SinglePool'

const ClassicPools = () => {
  const { account = '' } = useActiveWeb3React()
  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const classicEarningQueryResponse = useGetClassicEarningQuery({ account, chainIds: selectedChainIds })
  const data = classicEarningQueryResponse.data

  const renderPools = () => {
    if (!data) {
      return <span>empty data</span>
    }

    return Object.keys(data).map(chainRoute => {
      const chainId = chainIdByRoute[chainRoute]
      const poolEarnings = data[chainRoute].positions

      return <PoolsByChainId key={chainId} chainId={chainId} poolEarnings={poolEarnings} />
    })
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {renderPools()}
    </Flex>
  )
}

const PoolsByChainId = ({
  chainId,
  poolEarnings,
}: {
  chainId: ChainId
  poolEarnings: ClassicPoolEarningWithDetails[]
}) => {
  const result = useAllPoolsData(ChainId.MAINNET)

  const userLiquidityPositionsQueryResult = useUserLiquidityPositions(chainId)
  const userLiquidityPositions = userLiquidityPositionsQueryResult.data

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = useMemo(() => {
    if (!userLiquidityPositions) return {}

    return userLiquidityPositions.liquidityPositions.reduce((acc, position) => {
      acc[position.pool.id] = position
      return acc
    }, {} as { [key: string]: UserLiquidityPosition })
  }, [userLiquidityPositions])

  const isLoading = result.loading || userLiquidityPositionsQueryResult.loading

  if (isLoading) {
    return <span>loading for {chainId}</span>
  }

  if (result.error) {
    return <span>error for {JSON.stringify(result.error)}</span>
  }

  const pools: ClassicPoolData[] = result.data

  return (
    <>
      {poolEarnings.map(poolEarning => {
        const poolData = pools.find(pool => pool.id === poolEarning.pool.id)

        if (!poolData) {
          return <span key={`${chainId}-${poolEarning.id}`}>not loaded pool</span>
        }

        return (
          <SinglePool
            key={`${chainId}-${poolEarning.id}`}
            chainId={chainId}
            poolEarning={poolEarning}
            poolData={poolData}
            userLiquidity={transformedUserLiquidityPositions[poolData.id]}
          />
        )
      })}
    </>
  )
}

export default ClassicPools
