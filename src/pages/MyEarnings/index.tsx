import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'
import { PositionEarningWithDetails, TokenEarning, useGetEarningDataQuery } from 'services/earning'

import { EMPTY_ARRAY } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import ClassicElasticTab from 'pages/MyEarnings/ClassicElasticTab'
import Pools from 'pages/MyEarnings/Pools'
import { useAppSelector } from 'state/hooks'
import { EarningStatsTick, EarningsBreakdown } from 'types/myEarnings'
import { isAddress } from 'utils'

import CurrentChainButton from './CurrentChainButton'
import EarningsBreakdownPanel from './EarningsBreakdownPanel'
import MultipleChainSelect from './MultipleChainSelect'
import MyEarningsOverTimePanel from './MyEarningsOverTimePanel'
import { PageWrapper } from './styleds'

const chainIdByRoute: Record<string, ChainId> = SUPPORTED_NETWORKS_FOR_MY_EARNINGS.map(chainId => ({
  route: NETWORKS_INFO[chainId].aggregatorRoute,
  chainId,
})).reduce((acc, { route, chainId }) => {
  acc[route] = chainId
  return acc
}, {} as Record<string, ChainId>)

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

const MyEarnings = () => {
  const { account = '' } = useActiveWeb3React()

  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const getEarningData = useGetEarningDataQuery({ account, chainIds: selectedChainIds })
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)

  const earningBreakdown: EarningsBreakdown | undefined = useMemo(() => {
    const dataByChainRoute = getEarningData?.data || {}
    const latestAggregatedData = Object.keys(dataByChainRoute)
      .flatMap(chainRoute => {
        const data = dataByChainRoute[chainRoute].account
        const chainId = chainIdByRoute[chainRoute]
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
            title: data.symbol,
            value: String(data.amountUSD),
            percent: (data.amountUSD / totalValue) * 100,
          }))
        : [
            ...latestAggregatedData.slice(0, 9).map(data => ({
              title: data.symbol,
              value: String(data.amountUSD),
              percent: (data.amountUSD / totalValue) * 100,
            })),
            {
              title: t`Others`,
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

    return ticks
  }, [getEarningData?.data, tokensByChainId])

  const positionEarningsByPoolId = useMemo(() => {
    const data = getEarningData?.data?.['ethereum']?.positions || []
    return data.reduce((acc, positionEarning) => {
      const poolId = positionEarning.pool?.id
      if (!poolId) {
        return acc
      }

      if (!acc[poolId]) {
        acc[poolId] = [positionEarning]
      } else {
        acc[poolId].push(positionEarning)
      }

      return acc
    }, {} as Record<string, PositionEarningWithDetails[]>)
  }, [getEarningData?.data])

  return (
    <PageWrapper>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Text
            as="span"
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              lineHeight: '28px',
            }}
          >
            My Earnings
          </Text>

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
          }}
        >
          <EarningsBreakdownPanel isLoading={getEarningData.isLoading} data={earningBreakdown} />
          <MyEarningsOverTimePanel isLoading={getEarningData.isLoading} ticks={ticks} />
        </Flex>

        <ClassicElasticTab />

        <Pools
          positionEarningsByPoolId={positionEarningsByPoolId}
          chainId={ChainId.MAINNET}
          poolEarnings={getEarningData?.data?.['ethereum']?.pools || EMPTY_ARRAY}
        />
      </Flex>
    </PageWrapper>
  )
}

export default MyEarnings
