import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import { PositionEarningWithDetails, TokenEarning, useGetEarningDataQuery } from 'services/earning'
import styled from 'styled-components'

import { EMPTY_ARRAY } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import ClassicElasticTab from 'pages/MyEarnings/ClassicElasticTab'
import CurrentChainButton from 'pages/MyEarnings/CurrentChainButton'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'
import PoolFilteringBar from 'pages/MyEarnings/PoolFilteringBar'
import SinglePool, { Props as SinglePoolProps } from 'pages/MyEarnings/SinglePool'
import TotalEarningsAndChainSelect from 'pages/MyEarnings/TotalEarningsAndChainSelect'
import { today } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { EarningStatsTick, EarningsBreakdown } from 'types/myEarnings'
import { isAddress } from 'utils'

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

const PageWrapper = styled.div`
  width: 100%;
  max-width: 1248px; // 1224px + 24px padding

  height: 100%;

  padding: 32px 24px 100px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding-left: 16px;
    padding-right: 16px;
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

const sumTokenEarnings = (earnings: TokenEarning[]) => {
  return earnings.reduce((sum, tokenEarning) => sum + Number(tokenEarning.amountUSD), 0)
}

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }

  return array
}

const MyEarningsSection = () => {
  const { account = '' } = useActiveWeb3React()
  const theme = useTheme()

  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const getEarningData = useGetEarningDataQuery({ account, chainIds: selectedChainIds })
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)
  const shouldShowClosedPositions = useAppSelector(state => state.myEarnings.shouldShowClosedPositions)
  const originalSearchText = useAppSelector(state => state.myEarnings.searchText)

  const searchText = useDebounce(originalSearchText, 300).toLowerCase().trim()

  const earningBreakdown: EarningsBreakdown | undefined = useMemo(() => {
    const dataByChainRoute = getEarningData?.data || {}
    const latestAggregatedData = Object.keys(dataByChainRoute)
      .flatMap(chainRoute => {
        const data = dataByChainRoute[chainRoute].account
        const chainId = chainIdByRoute[chainRoute]

        if (data?.[0]?.day !== today) {
          return []
        }

        const latestData = data?.[0]?.total
          ?.filter(tokenData => {
            // TODO: check with native token
            const tokenAddress = isAddress(chainId, tokenData.token)
            if (!tokenAddress) {
              return false
            }

            const currency = tokensByChainId[chainId][tokenAddress]
            return !!currency
          })
          .map(tokenData => {
            const tokenAddress = isAddress(chainId, tokenData.token)
            const currency = tokensByChainId[chainId][String(tokenAddress)]
            return {
              address: tokenAddress,
              symbol: currency.symbol || '',
              amountUSD: Number(tokenData.amountUSD),
              chainId,
              logoUrl: currency.logoURI,
            }
          })

        return latestData || []
      })
      .sort((data1, data2) => data2.amountUSD - data1.amountUSD)

    const totalValue = latestAggregatedData.reduce((sum, { amountUSD }) => {
      return sum + amountUSD
    }, 0)

    const totalValueOfOthers = latestAggregatedData.slice(9).reduce((acc, data) => acc + data.amountUSD, 0)

    const breakdowns: EarningsBreakdown['breakdowns'] =
      latestAggregatedData.length <= 10
        ? latestAggregatedData.map(data => ({
            chainId: data.chainId,
            logoUrl: data.logoUrl,
            symbol: data.symbol,
            value: String(data.amountUSD),
            percent: (data.amountUSD / totalValue) * 100,
          }))
        : [
            ...latestAggregatedData.slice(0, 9).map(data => ({
              chainId: data.chainId,
              logoUrl: data.logoUrl,
              symbol: data.symbol,
              value: String(data.amountUSD),
              percent: (data.amountUSD / totalValue) * 100,
            })),
            {
              symbol: t`Others`,
              value: String(totalValueOfOthers),
              percent: (totalValueOfOthers / totalValue) * 100,
            },
          ]

    return {
      totalValue,
      breakdowns: breakdowns, // shuffle([...breakdowns, ...breakdowns, ...breakdowns].slice(0, 5)),
    }
  }, [getEarningData?.data, tokensByChainId])

  // chop the data into the right duration
  // format pool value
  // multiple chains
  const ticks: EarningStatsTick[] | undefined = useMemo(() => {
    const data = getEarningData?.data?.['ethereum']?.account
    const chainRoute = 'ethereum'
    const chainId = chainIdByRoute[chainRoute]

    if (!data) {
      return undefined
    }

    // TODO: check tick has more than 5 tokens
    const ticks: EarningStatsTick[] = data.map(singlePointData => {
      const poolRewardsValueUSD = sumTokenEarnings(singlePointData.fees || [])
      const farmRewardsValueUSD = sumTokenEarnings(singlePointData.rewards || [])

      // TODO: tokenEarningByAddress not in use
      const tokenEarningByAddress: Record<string, any> = {}
      ;[...(singlePointData.fees || []), ...(singlePointData.rewards || [])].forEach(tokenEarning => {
        // TODO: check with native token
        const tokenAddress = isAddress(chainId, tokenEarning.token)
        if (!tokenAddress) {
          return
        }

        const currency = tokensByChainId[chainId][tokenAddress]
        if (!currency) {
          return
        }

        if (!tokenEarningByAddress[tokenAddress]) {
          tokenEarningByAddress[tokenAddress] = {
            logoUrl: currency.logoURI,
            amount: 0,
            symbol: currency.symbol || 'NO SYMBOL',
          }
        }

        tokenEarningByAddress[tokenAddress].amount += Number(tokenEarning.amountFloat)
      })

      const tick: EarningStatsTick = {
        date: dayjs(singlePointData.day * 86400 * 1000).format('MMM DD'),
        poolRewardsValue: poolRewardsValueUSD,
        farmRewardsValue: farmRewardsValueUSD,
        totalValue: poolRewardsValueUSD + farmRewardsValueUSD,
        tokens: (singlePointData.total || [])
          .filter(tokenEarning => {
            // TODO: check with native token
            const tokenAddress = isAddress(chainId, tokenEarning.token)
            if (!tokenAddress) {
              return false
            }

            const currency = tokensByChainId[chainId][tokenAddress]
            return !!currency
          })
          .map(tokenEarning => {
            const tokenAddress = isAddress(chainId, tokenEarning.token)
            const currency = tokensByChainId[chainId][String(tokenAddress)]
            return {
              logoUrl: currency.logoURI || '',
              amount: Number(tokenEarning.amountFloat),
              symbol: currency.symbol || 'NO SYMBOL',
            }
          })
          .sort((tokenEarning1, tokenEarning2) => tokenEarning2.amount - tokenEarning1.amount),
      }

      return tick
    })

    // fill ticks for unavailable days
    const latestDay = data[0]?.day || today - 30 // fallback to 30 days ago
    if (latestDay < today) {
      for (let i = latestDay + 1; i <= today; i++) {
        ticks.unshift({
          date: dayjs(i * 86400 * 1000).format('MMM DD'),
          poolRewardsValue: 0,
          farmRewardsValue: 0,
          totalValue: 0,
          tokens: [],
        })
      }
    }

    return ticks
  }, [getEarningData?.data, tokensByChainId])

  const availableChainRoutes = useMemo(() => {
    if (!getEarningData?.data) {
      return []
    }

    return Object.keys(getEarningData.data)
  }, [getEarningData?.data])

  const pools: SinglePoolProps[] = useMemo(() => {
    return availableChainRoutes.flatMap(chainRoute => {
      if (!getEarningData?.data?.[chainRoute]) {
        return []
      }

      const chainId = chainIdByRoute[chainRoute]
      const positionEarningsByPoolId = getPositionEarningsByPoolId(
        getEarningData.data[chainRoute].positions,
        shouldShowClosedPositions,
      )

      const poolIdsThatHasPositions = Object.keys(positionEarningsByPoolId)

      const poolEarnings =
        getEarningData.data[chainRoute]?.pools?.filter(pool => {
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
  }, [availableChainRoutes, getEarningData.data, searchText, shouldShowClosedPositions])

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <Flex alignItems="center" justifyContent="space-between">
        <TotalEarningsAndChainSelect
          totalEarningToday={Number(ticks?.[0]?.totalValue)}
          totalEarningYesterday={Number(ticks?.[1]?.totalValue || 0)}
        />
        <Flex
          alignItems="center"
          sx={{
            gap: '16px',
          }}
        >
          <CurrentChainButton />
          <MultipleChainSelect />
        </Flex>
      </Flex>

      <Flex
        sx={{
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <EarningsBreakdownPanel isLoading={getEarningData.isLoading} data={earningBreakdown} />
        <MyEarningsOverTimePanel isLoading={getEarningData.isLoading} ticks={ticks} />
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

      {pools.length === 0 ? (
        <Flex
          flexDirection={'column'}
          width="100%"
          height="240px"
          alignItems={'center'}
          justifyContent={'center'}
          sx={{ gap: '8px' }}
          color={theme.subText}
        >
          <Info width="32px" height="32px" />
          <Text fontSize="16px" fontWeight={500}>
            <Trans>No liquidity found</Trans>
          </Text>
        </Flex>
      ) : (
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
      )}
    </Flex>
  )
}

export default MyEarningsSection
