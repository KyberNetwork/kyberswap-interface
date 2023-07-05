import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo, useRef } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useGetElasticEarningQuery, useGetElasticLegacyEarningQuery } from 'services/earning'
import { ElasticPoolEarningWithDetails, ElasticPositionEarningWithDetails } from 'services/earning/types'

import LoaderWithKyberLogo from 'components/LocalLoader'
import { EMPTY_ARRAY } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { usePositionsFees } from 'hooks/usePositionsFees'
import useTheme from 'hooks/useTheme'
import SinglePool from 'pages/MyEarnings/ElasticPools/SinglePool'
import { chainIdByRoute } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'

const getPositionEarningsByPoolId = (
  earnings: ElasticPositionEarningWithDetails[] | undefined,
  includeClosedPositions = false,
): Record<string, ElasticPositionEarningWithDetails[]> => {
  const data = earnings || []

  return data.reduce((acc, positionEarning) => {
    const poolId = positionEarning.pool?.id
    if (!poolId) {
      return acc
    }

    if (!includeClosedPositions && (!positionEarning.liquidity || positionEarning.liquidity === '0')) {
      return acc
    }

    if (!acc[poolId]) {
      acc[poolId] = [positionEarning]
    } else {
      acc[poolId].push(positionEarning)
    }

    return acc
  }, {} as Record<string, ElasticPositionEarningWithDetails[]>)
}

interface PoolType {
  chainId: ChainId
  poolEarning: ElasticPoolEarningWithDetails
  positionEarnings: ElasticPositionEarningWithDetails[]
}

const ElasticPools = () => {
  const { account = '' } = useActiveWeb3React()

  // need to store last account because when user switch to another chain
  // `account` can be '' in one of the renders
  // and if `account` = '', this page is no longer visible (we have a condition for this in MyEarnings/index.tsx)
  const lastAccountRef = useRef(account)
  if (account) {
    lastAccountRef.current = account
  }

  const theme = useTheme()
  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const activeTab = useAppSelector(state => state.myEarnings.activeTab)
  const shouldShowClosedPositions = useAppSelector(state => state.myEarnings.shouldShowClosedPositions)
  const originalSearchText = useAppSelector(state => state.myEarnings.searchText)
  const searchText = useDebounce(originalSearchText, 300).toLowerCase().trim()

  // const getEarningData = useGetEarningDataQuery({ account, chainIds: selectedChainIds })
  const elasticEarningQueryResponse = useGetElasticEarningQuery({
    account: lastAccountRef.current,
    chainIds: selectedChainIds,
  })
  const elasticLegacyEarningQueryResponse = useGetElasticLegacyEarningQuery({
    account: lastAccountRef.current,
    chainIds: selectedChainIds,
  })

  const earningResponse = useMemo(() => {
    let data = elasticEarningQueryResponse.data
    if (activeTab === VERSION.ELASTIC_LEGACY) {
      data = elasticLegacyEarningQueryResponse.data
    } else if (activeTab === VERSION.CLASSIC) {
      data = undefined
    }

    return data
  }, [activeTab, elasticEarningQueryResponse, elasticLegacyEarningQueryResponse])

  const isLoading = elasticEarningQueryResponse.isLoading || elasticLegacyEarningQueryResponse.isLoading

  const pools: PoolType[] = useMemo(() => {
    if (!earningResponse) {
      return []
    }

    return Object.entries(earningResponse).flatMap(([chainRoute, earningData]) => {
      const chainId = chainIdByRoute[chainRoute]
      const positionEarningsByPoolId = getPositionEarningsByPoolId(earningData.positions, shouldShowClosedPositions)

      const poolIdsThatHasPositions = Object.keys(positionEarningsByPoolId)

      const poolEarnings =
        earningData.pools?.filter(pool => {
          if (!poolIdsThatHasPositions.includes(pool.id)) {
            return false
          }

          if (!searchText) {
            return true
          }

          return (
            pool.id.toLowerCase() === searchText ||
            pool.token0.id.toLowerCase() === searchText ||
            pool.token0.symbol.toLowerCase() === searchText ||
            pool.token0.name.toLowerCase() === searchText ||
            pool.token1.id.toLowerCase() === searchText ||
            pool.token1.symbol.toLowerCase() === searchText ||
            pool.token1.name.toLowerCase() === searchText
          )
        }) || EMPTY_ARRAY

      poolEarnings.sort((pool1, pool2) => Number(pool2.totalValueLockedUsd) - Number(pool1.totalValueLockedUsd))

      return poolEarnings.map(poolEarning => {
        return {
          poolEarning,
          chainId,
          positionEarnings: positionEarningsByPoolId[poolEarning.id],
        }
      })
    })
  }, [earningResponse, searchText, shouldShowClosedPositions])

  const isEmpty = pools?.length === 0
  if (isLoading || isEmpty) {
    return (
      <Flex
        flexDirection={'column'}
        width="100%"
        height="240px"
        alignItems={'center'}
        justifyContent={'center'}
        sx={{ gap: '8px' }}
        color={theme.subText}
      >
        {isLoading ? (
          <LoaderWithKyberLogo />
        ) : (
          <>
            <Info width="32px" height="32px" />
            <Text fontSize="16px" fontWeight={500}>
              <Trans>No liquidity found</Trans>
            </Text>
          </>
        )}
      </Flex>
    )
  }

  const poolsByChainId = pools.reduce((acc, cur) => {
    if (!acc[cur.chainId]) {
      acc[cur.chainId] = [cur]
    } else {
      acc[cur.chainId].push(cur)
    }
    return acc
  }, {} as { [id: string]: Array<PoolType> })

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {Object.keys(poolsByChainId).map(chain => (
        <PoolsByChainId pools={poolsByChainId[chain]} key={chain} chainId={Number(chain) as ChainId} />
      ))}
    </Flex>
  )
}

const PoolsByChainId = ({ pools, chainId }: { chainId: ChainId; pools: PoolType[] }) => {
  const isLegacy = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)
  const allPositions = pools
    .map(p => p.positionEarnings.map(pe => ({ id: pe.id, poolAddress: pe.pool.id })).flat())
    .flat()

  const pendingFees = usePositionsFees(allPositions, isLegacy, chainId)
  const tokens = [...new Set(pools.map(p => p.positionEarnings.map(pe => [pe.token0, pe.token1]).flat()).flat())]
  const { data: tokenPrices } = useTokenPricesWithLoading(tokens, chainId)

  return (
    <>
      {pools.map(pool => {
        return (
          <SinglePool
            key={`${pool.chainId}-${pool.poolEarning.id}`}
            poolEarning={pool.poolEarning}
            chainId={pool.chainId}
            positionEarnings={pool.positionEarnings}
            pendingFees={pendingFees}
            tokenPrices={tokenPrices}
          />
        )
      })}
    </>
  )
}

export default ElasticPools
