import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import {
  PositionEarningWithDetails,
  useGetElasticEarningQuery,
  useGetElasticLegacyEarningQuery,
} from 'services/earning'
import styled from 'styled-components'

import LoaderWithKyberLogo from 'components/LocalLoader'
import { EMPTY_ARRAY } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import ChainSelect from 'pages/MyEarnings/ChainSelect'
import ClassicElasticTab from 'pages/MyEarnings/ClassicElasticTab'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'
import PoolFilteringBar from 'pages/MyEarnings/PoolFilteringBar'
import SinglePool, { Props as SinglePoolProps } from 'pages/MyEarnings/SinglePool'
import TotalEarningsAndChainSelect from 'pages/MyEarnings/TotalEarningsAndChainSelect'
import { calculateEarningBreakdowns, calculateTicksOfAccountEarningsInMultipleChains } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { EarningStatsTick, EarningsBreakdown } from 'types/myEarnings'

import OriginalEarningsBreakdownPanel from './EarningsBreakdownPanel'
import OriginalMyEarningsOverTimePanel from './MyEarningsOverTimePanel'

const MyEarningsOverTimePanel = styled(OriginalMyEarningsOverTimePanel)`
  flex: 1 0 640px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex: 1 1 100%;
    height: 480px;
  `}
`

const EarningsBreakdownPanel = styled(OriginalEarningsBreakdownPanel)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex: 1;

    &[data-columns='2'] {
      width: 100%;
      flex: 1;
    }
  `}
`

const ChainSelectAndEarningsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
    align-items: initial;
    justify-content: initial;

    ${MultipleChainSelect} {
      flex: 1;
    }
  `}
`

const chainIdByRoute: Record<string, ChainId> = SUPPORTED_NETWORKS_FOR_MY_EARNINGS.map(chainId => ({
  route: NETWORKS_INFO[chainId].aggregatorRoute,
  chainId,
})).reduce((acc, { route, chainId }) => {
  acc[route] = chainId
  return acc
}, {} as Record<string, ChainId>)

const getPositionEarningsByPoolId = (
  earnings: PositionEarningWithDetails[] | undefined,
  includeClosedPositions = false,
): Record<string, PositionEarningWithDetails[]> => {
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
  }, {} as Record<string, PositionEarningWithDetails[]>)
}

const MyEarningsSection = () => {
  const { account = '' } = useActiveWeb3React()
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const activeTab = useAppSelector(state => state.myEarnings.activeTab)
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)
  const shouldShowClosedPositions = useAppSelector(state => state.myEarnings.shouldShowClosedPositions)
  const originalSearchText = useAppSelector(state => state.myEarnings.searchText)
  const searchText = useDebounce(originalSearchText, 300).toLowerCase().trim()

  // const getEarningData = useGetEarningDataQuery({ account, chainIds: selectedChainIds })
  const elasticEarningQueryResponse = useGetElasticEarningQuery({ account, chainIds: selectedChainIds })
  const elasticLegacyEarningQueryResponse = useGetElasticLegacyEarningQuery({ account, chainIds: selectedChainIds })

  const earningResponse = useMemo(() => {
    let data = elasticEarningQueryResponse.data
    if (activeTab === VERSION.ELASTIC_LEGACY) {
      data = elasticLegacyEarningQueryResponse.data
    } else if (activeTab === VERSION.CLASSIC) {
      data = undefined
    }

    return data
  }, [activeTab, elasticEarningQueryResponse, elasticLegacyEarningQueryResponse])

  const isLoading = elasticEarningQueryResponse.isFetching || elasticLegacyEarningQueryResponse.isFetching

  // chop the data into the right duration
  // format pool value
  // multiple chains
  const ticks: EarningStatsTick[] | undefined = useMemo(() => {
    return calculateTicksOfAccountEarningsInMultipleChains(
      [elasticEarningQueryResponse.data, elasticLegacyEarningQueryResponse.data],
      tokensByChainId,
    )
  }, [elasticEarningQueryResponse, elasticLegacyEarningQueryResponse, tokensByChainId])

  const earningBreakdown: EarningsBreakdown | undefined = useMemo(() => {
    return calculateEarningBreakdowns(ticks?.[0])
  }, [ticks])

  const pools: SinglePoolProps[] = useMemo(() => {
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

      return poolEarnings.map(poolEarning => {
        return {
          poolEarning,
          chainId,
          positionEarnings: positionEarningsByPoolId[poolEarning.id],
        }
      })
    })
  }, [earningResponse, searchText, shouldShowClosedPositions])

  const renderPools = () => {
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

    return (
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {pools.map(pool => {
          return (
            <SinglePool
              key={`${pool.chainId}-${pool.poolEarning.id}`}
              poolEarning={pool.poolEarning}
              chainId={pool.chainId}
              positionEarnings={pool.positionEarnings}
            />
          )
        })}
      </Flex>
    )
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <ChainSelectAndEarningsWrapper>
        <TotalEarningsAndChainSelect
          totalEarningToday={Number(ticks?.[0]?.totalValue)}
          totalEarningYesterday={Number(ticks?.[1]?.totalValue || 0)}
        />
        <ChainSelect />
      </ChainSelectAndEarningsWrapper>

      <Flex
        sx={{
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <EarningsBreakdownPanel isLoading={isLoading} data={earningBreakdown} />
        <MyEarningsOverTimePanel isLoading={isLoading} ticks={ticks} isContainerSmall={upToExtraSmall} />
      </Flex>

      <Text
        sx={{
          fontWeight: 400,
          fontSize: '12px',
          lineHeight: '16px',
          fontStyle: 'italic',
          textAlign: 'center',
          color: theme.subText,
          marginBottom: '16px',
        }}
      >
        <Trans>
          Note: Your earnings may fluctuate due to the increase or decrease in price of the tokens earned. These
          earnings include both claimed and unclaimed pool and farm rewards
        </Trans>
      </Text>

      <ClassicElasticTab />

      <PoolFilteringBar />

      {renderPools()}
    </Flex>
  )
}

export default MyEarningsSection
