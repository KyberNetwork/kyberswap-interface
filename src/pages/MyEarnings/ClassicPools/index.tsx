import { ChainId } from '@kyberswap/ks-sdk-core'
import produce from 'immer'
import { useEffect, useMemo, useReducer } from 'react'
import { Flex } from 'rebass'
import { useGetClassicEarningQuery } from 'services/earning'
import { ClassicPoolEarningWithDetails } from 'services/earning/types'

import LoaderWithKyberLogo from 'components/LocalLoader'
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
  const [loadingByChainId, setLoadingByChainId] = useReducer(
    (state: Record<string, boolean>, { chainId, value }: { chainId: ChainId; value: boolean }) => {
      return produce(state, draft => {
        draft[chainId] = value
      })
    },
    {},
  )

  const renderPools = () => {
    if (!data) {
      return <span>empty data</span>
    }

    return Object.keys(data).map(chainRoute => {
      const chainId = chainIdByRoute[chainRoute]
      const poolEarnings = data[chainRoute].positions

      return (
        <PoolsByChainId
          key={chainId}
          chainId={chainId}
          poolEarnings={poolEarnings}
          outsideLoading={!!loadingByChainId[chainId]}
          setLoading={(value: boolean) => {
            setLoadingByChainId({
              chainId,
              value,
            })
          }}
        />
      )
    })
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
        minHeight: '400px',
      }}
    >
      {Object.values(loadingByChainId).some(Boolean) ? <LoaderWithKyberLogo /> : null}
      {renderPools()}
    </Flex>
  )
}

const PoolsByChainId = ({
  chainId,
  poolEarnings,
  outsideLoading,
  setLoading,
}: {
  chainId: ChainId
  poolEarnings: ClassicPoolEarningWithDetails[]
  outsideLoading: boolean
  setLoading: (value: boolean) => void
}) => {
  const result = useAllPoolsData(chainId)

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

  const isLoading = result.isLoading || userLiquidityPositionsQueryResult.loading

  useEffect(() => {
    setLoading(isLoading)
  }, [isLoading, setLoading])

  if (isLoading || result.error || outsideLoading) {
    return null
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
