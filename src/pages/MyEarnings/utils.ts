import { cloneDeep } from '@apollo/client/utilities'
import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import dayjs from 'dayjs'
import produce from 'immer'
import {
  ElasticPoolEarningWithDetails,
  ElasticPositionEarningWithDetails,
  GetElasticEarningResponse,
  HistoricalEarning,
  HistoricalSingleData,
  TokenEarning,
} from 'services/earning/types'

import { NETWORKS_INFO, SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { UserFarmInfo } from 'state/farms/elastic/types'
import { TokenAddressMap } from 'state/lists/reducer'
import { EarningStatsTick, EarningsBreakdown } from 'types/myEarnings'
import { isAddress } from 'utils'

// TODO: remove later
export function shuffle<T>(array: T[]): T[] {
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

export const today = Math.floor(Date.now() / 1000 / 86400)
const aYearAgo = Math.floor(Date.now() / 1000 / 86400 - 365)

export const fillHistoricalEarningsForEmptyDays = (
  historicalEarnings: HistoricalSingleData[] | undefined,
): HistoricalSingleData[] => {
  if (!historicalEarnings?.length) {
    return Array.from({ length: 365 }).map((_, i) => {
      return {
        day: today - i,
        block: 0,
        fees: [],
        rewards: [],
        total: [],
      }
    })
  }

  const results = [...historicalEarnings]
  const earliestDay = historicalEarnings.slice(-1)[0].day
  const latestDay = historicalEarnings[0].day
  const latestEarning = historicalEarnings[0]

  for (let i = earliestDay - 1; i > aYearAgo; i--) {
    results.push({
      day: i,
      block: 0,
      fees: [],
      rewards: [],
      total: [],
    })
  }

  for (let i = latestDay + 1; i <= today; i++) {
    results.unshift({
      day: i,
      block: 0,
      fees: cloneDeep(latestEarning.fees),
      rewards: cloneDeep(latestEarning.rewards),
      total: cloneDeep(latestEarning.total),
    })
  }

  return results
}

const fillHistoricalEarningsForTicks = (ticks: EarningStatsTick[] | undefined): EarningStatsTick[] => {
  if (!ticks?.length) {
    return Array.from({ length: 365 }).map((_, i) => {
      const day = today - i
      return {
        day,
        date: dayjs(day * 86400 * 1000).format('MMM DD'),
        poolFeesValue: 0,
        farmRewardsValue: 0,
        totalValue: 0,
        tokens: [],
      }
    })
  }

  const results = [...ticks]
  const earliestDay = ticks.slice(-1)[0].day
  const latestDay = ticks[0].day
  const latestTick = ticks[0]

  for (let i = earliestDay - 1; i > aYearAgo; i--) {
    results.push({
      day: i,
      date: dayjs(i * 86400 * 1000).format('MMM DD'),
      poolFeesValue: 0,
      farmRewardsValue: 0,
      totalValue: 0,
      tokens: [],
    })
  }

  for (let i = latestDay + 1; i <= today; i++) {
    results.unshift({
      day: i,
      date: dayjs(i * 86400 * 1000).format('MMM DD'),
      poolFeesValue: latestTick.poolFeesValue,
      farmRewardsValue: latestTick.farmRewardsValue,
      totalValue: latestTick.totalValue,
      tokens: cloneDeep(latestTick.tokens),
    })
  }

  return results
}

export const chainIdByRoute: Record<string, ChainId> = SUPPORTED_NETWORKS_FOR_MY_EARNINGS.map(chainId => ({
  route: NETWORKS_INFO[chainId].aggregatorRoute,
  chainId,
})).reduce((acc, { route, chainId }) => {
  acc[route] = chainId
  return acc
}, {} as Record<string, ChainId>)

export const sumTokenEarnings = (earnings: TokenEarning[]) => {
  return earnings.reduce((sum, tokenEarning) => sum + Number(tokenEarning.amountUSD), 0)
}

export const calculateEarningStatsTick = (
  data: HistoricalEarning['historicalEarning'],
  chainId: ChainId,
  tokensByChainId: TokenAddressMap,
): EarningStatsTick[] | undefined => {
  if (!data?.length) {
    return undefined
  }

  const ticks: EarningStatsTick[] = data.map(singlePointData => {
    const poolRewardsValueUSD = sumTokenEarnings(singlePointData.fees || [])
    const farmRewardsValueUSD = sumTokenEarnings(singlePointData.rewards || [])

    const tick: EarningStatsTick = {
      day: singlePointData.day,
      date: dayjs(singlePointData.day * 86400 * 1000).format('MMM DD'),
      poolFeesValue: poolRewardsValueUSD,
      farmRewardsValue: farmRewardsValueUSD,
      totalValue: poolRewardsValueUSD + farmRewardsValueUSD,
      tokens: (singlePointData.total || [])
        .filter(tokenEarning => {
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
          const isNative = currency.isNative || tokenAddress === WETH[chainId].address
          const symbol = (isNative ? NativeCurrencies[chainId].symbol : currency.symbol) || 'NO SYMBOL'
          const logoUrl = (isNative ? NETWORKS_INFO[chainId].nativeToken.logo : currency.logoURI) || ''

          const tokenInfo: EarningStatsTick['tokens'][number] = {
            logoUrl,
            amount: Number(tokenEarning.amountFloat),
            amountUSD: Number(tokenEarning.amountUSD),
            symbol,
            chainId,
            address: String(tokenAddress),
          }

          return tokenInfo
        })
        .sort((tokenEarning1, tokenEarning2) => tokenEarning2.amountUSD - tokenEarning1.amountUSD),
    }

    return tick
  })

  // fill ticks for unavailable days
  const latestDay = data[0]?.day || today - 30 // fallback to 30 days ago
  if (latestDay < today) {
    for (let i = latestDay + 1; i <= today; i++) {
      ticks.unshift({
        day: i,
        date: dayjs(i * 86400 * 1000).format('MMM DD'),
        poolFeesValue: 0,
        farmRewardsValue: 0,
        totalValue: 0,
        tokens: [],
      })
    }
  }

  return ticks
}

const mergeTokenEarnings = (earnings: Array<TokenEarning>): Array<TokenEarning> => {
  const earningByTokenId: Record<string, TokenEarning> = {}

  earnings.forEach(earning => {
    const tokenId = earning.token
    if (!earningByTokenId[tokenId]) {
      earningByTokenId[tokenId] = cloneDeep(earning)
    } else {
      earningByTokenId[tokenId].amountFloat = String(
        Number(earningByTokenId[tokenId].amountFloat) + Number(earning.amountFloat),
      )
      earningByTokenId[tokenId].amountUSD = String(
        Number(earningByTokenId[tokenId].amountUSD) + Number(earning.amountUSD),
      )
    }
  })

  return Object.values(earningByTokenId)
}

const mergeHistoricalEarningsByDay = (historicalData: HistoricalSingleData[]): HistoricalSingleData[] => {
  const dataByDay: Record<string, HistoricalSingleData> = {}

  historicalData.forEach(singlePointData => {
    const day = singlePointData.day
    if (!dataByDay[day]) {
      dataByDay[day] = cloneDeep(singlePointData)
    } else {
      const fees = mergeTokenEarnings([...(dataByDay[day].fees || []), ...(singlePointData.fees || [])])
      const rewards = mergeTokenEarnings([...(dataByDay[day].rewards || []), ...(singlePointData.rewards || [])])

      dataByDay[day].fees = fees
      dataByDay[day].rewards = rewards
    }
  })

  const days = Object.keys(dataByDay)
    .map(d => Number(d))
    .sort((d1, d2) => d2 - d1)

  return days.map(day => {
    dataByDay[day].total = mergeTokenEarnings([...(dataByDay[day].fees || []), ...(dataByDay[day].rewards || [])])
    return dataByDay[day]
  })
}

const mergeEarningStatsTick = (tick: EarningStatsTick): EarningStatsTick => {
  const earnings: Record<string /* chainId */, Record<string /* address */, EarningStatsTick['tokens'][number]>> = {}

  tick.tokens.forEach(tokenInfo => {
    const { chainId, address } = tokenInfo
    if (!earnings[chainId]) {
      earnings[chainId] = {}
    }

    if (!earnings[chainId][address]) {
      earnings[chainId][address] = cloneDeep(tokenInfo)
    } else {
      const existingTokenInfo = earnings[chainId][address]
      existingTokenInfo.amount += tokenInfo.amount
      existingTokenInfo.amountUSD += tokenInfo.amountUSD
    }
  })

  const tokens = Object.values(earnings)
    .map(each => Object.values(each))
    .flat()
    .sort((token1, token2) => token2.amountUSD - token1.amountUSD)

  const newTick = {
    ...tick,
    tokens,
  }

  return newTick
}

export const fillEmptyDaysForPositionEarnings = (
  earningResponse: GetElasticEarningResponse | undefined,
): GetElasticEarningResponse | undefined => {
  if (!earningResponse) {
    return undefined
  }

  const result = produce(earningResponse, draft => {
    const chainRoutes = Object.keys(draft)
    chainRoutes.forEach(chainRoute => {
      const { positions } = draft[chainRoute]
      positions.forEach(position => {
        position.historicalEarning = fillHistoricalEarningsForEmptyDays(position.historicalEarning)
      })
    })
  })

  return result
}

export const aggregatePositionEarnings = <
  T extends Record<
    string,
    {
      positions: { historicalEarning: HistoricalSingleData[] }[]
    }
  >,
>(
  earningResponse: T,
): T => {
  const result = produce(earningResponse, draft => {
    const chains = Object.keys(draft)

    chains.forEach(chain => {
      const { positions } = draft[chain]

      positions.forEach(position => {
        const earnings = position.historicalEarning || []

        earnings.forEach(earning => {
          const fees = mergeTokenEarnings(earning.fees || [])
          const rewards = mergeTokenEarnings(earning.rewards || [])
          const total = mergeTokenEarnings([...fees, ...rewards])
          earning.fees = fees
          earning.rewards = rewards
          earning.total = total
        })
      })
    })
  })

  return result
}

export const aggregatePoolEarnings = (
  earningResponse: GetElasticEarningResponse | undefined,
): GetElasticEarningResponse | undefined => {
  if (!earningResponse) {
    return undefined
  }

  const result = produce(earningResponse, draft => {
    const chains = Object.keys(draft)

    chains.forEach(chain => {
      const { positions } = draft[chain]
      // historical earning data only
      const byPool: Record<string, ElasticPoolEarningWithDetails> = {}

      positions.forEach(position => {
        const poolId = position.pool.id
        const positionEarnings = position.historicalEarning ? cloneDeep(position.historicalEarning) : []
        if (!byPool[poolId]) {
          byPool[poolId] = {
            ...cloneDeep(position.pool),
            historicalEarning: positionEarnings,
          }
        } else {
          byPool[poolId].historicalEarning.push(...positionEarnings)
        }
      })

      const poolIds = Object.keys(byPool)
      const pools = poolIds.map(poolId => {
        const historicalEarning = fillHistoricalEarningsForEmptyDays(
          mergeHistoricalEarningsByDay(byPool[poolId].historicalEarning),
        )
        byPool[poolId].historicalEarning = historicalEarning

        return byPool[poolId]
      })

      draft[chain].pools = pools
    })
  })

  return result
}

export const aggregateAccountEarnings = <
  T extends Record<
    string,
    {
      positions: { historicalEarning: HistoricalSingleData[] }[]
      account: HistoricalSingleData[]
    }
  >,
>(
  earningResponse: T | undefined,
): T | undefined => {
  if (!earningResponse) {
    return undefined
  }

  const result = produce(earningResponse, draft => {
    const chains = Object.keys(draft)

    chains.forEach(chain => {
      const { positions } = draft[chain]

      const byDay: Record<string, HistoricalSingleData> = {}

      positions.forEach(position => {
        const earnings = position.historicalEarning || []

        earnings.forEach(earning => {
          const day = earning.day

          if (!byDay[day]) {
            byDay[day] = {
              day,
              block: 0,
              fees: [],
              rewards: [],
              total: [],
            }
          }

          byDay[day].fees = (byDay[day].fees || []).concat(earning.fees ? cloneDeep(earning.fees) : [])
          byDay[day].rewards = (byDay[day].rewards || []).concat(earning.rewards ? cloneDeep(earning.rewards) : [])
        })
      })

      Object.keys(byDay).forEach(day => {
        const earning = byDay[day]
        const fees = mergeTokenEarnings(earning.fees || [])
        const rewards = mergeTokenEarnings(earning.rewards || [])
        const total = mergeTokenEarnings([...fees, ...rewards])
        earning.fees = fees
        earning.rewards = rewards
        earning.total = total
      })

      const days = Object.keys(byDay)
        .map(d => Number(d))
        .sort((d1, d2) => d2 - d1)

      const accountEarnings = days.map(day => byDay[day])
      draft[chain].account = accountEarnings
    })
  })

  return result
}

export const removeEmptyTokenEarnings = <
  T extends Record<
    string,
    {
      positions: { historicalEarning: HistoricalSingleData[] }[]
    }
  >,
>(
  earningResponse: T,
): T => {
  const filter = (tokenEarnings: TokenEarning[]): TokenEarning[] => {
    return tokenEarnings.filter(tokenEarning => {
      return (
        !!tokenEarning.amount &&
        tokenEarning.amount !== '0' &&
        !!tokenEarning.amountFloat &&
        tokenEarning.amountFloat !== '0'
      )
    })
  }

  const result = produce(earningResponse, draft => {
    const chains = Object.keys(draft)

    chains.forEach(chain => {
      const { positions } = draft[chain]

      positions.forEach(position => {
        const earnings = position.historicalEarning || []

        earnings.forEach(earning => {
          earning.fees = filter(earning.fees || [])
          earning.rewards = filter(earning.rewards || [])
          earning.total = filter(earning.total || [])
        })
      })
    })
  })

  return result
}

export const calculateTicksOfAccountEarningsInMultipleChains = (
  earningResponses: Array<
    | Record<
        string,
        {
          account: HistoricalSingleData[]
        }
      >
    | undefined
  >,
  tokensByChainId: TokenAddressMap | undefined,
): EarningStatsTick[] | undefined => {
  if (!tokensByChainId) {
    return undefined
  }

  const byDay: Record<string, EarningStatsTick> = {}

  const responses = earningResponses.filter(Boolean) as GetElasticEarningResponse[]

  responses.forEach(earningResponse => {
    const chainRoutes = Object.keys(earningResponse)
    chainRoutes.forEach(chainRoute => {
      const chainId = chainIdByRoute[chainRoute]
      const data = earningResponse[chainRoute].account

      // TODO: check tick has more than 5 tokens
      const ticks: EarningStatsTick[] = data.map(singleDataPoint => {
        const poolRewardsValueUSD = sumTokenEarnings(singleDataPoint.fees || [])
        const farmRewardsValueUSD = sumTokenEarnings(singleDataPoint.rewards || [])

        const tick: EarningStatsTick = {
          day: singleDataPoint.day,
          date: dayjs(singleDataPoint.day * 86400 * 1000).format('MMM DD'),
          poolFeesValue: poolRewardsValueUSD,
          farmRewardsValue: farmRewardsValueUSD,
          totalValue: poolRewardsValueUSD + farmRewardsValueUSD,
          tokens: (singleDataPoint.total || [])
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
              const isNative = currency.isNative || tokenAddress === WETH[chainId].address
              const symbol = (isNative ? NativeCurrencies[chainId].symbol : currency.symbol) || 'NO SYMBOL'
              const logoUrl = (isNative ? NETWORKS_INFO[chainId].nativeToken.logo : currency.logoURI) || ''

              const tokenInfo: EarningStatsTick['tokens'][number] = {
                logoUrl,
                amount: Number(tokenEarning.amountFloat),
                amountUSD: Number(tokenEarning.amountUSD),
                symbol,
                chainId,
                address: String(tokenAddress),
              }

              return tokenInfo
            })
            .sort((tokenEarning1, tokenEarning2) => tokenEarning2.amount - tokenEarning1.amount),
        }

        return tick
      })

      ticks.forEach(tick => {
        const day = tick.day
        if (!byDay[day]) {
          byDay[day] = tick
        } else {
          byDay[day] = produce(byDay[day], draft => {
            draft.farmRewardsValue += tick.farmRewardsValue
            draft.poolFeesValue += tick.poolFeesValue
            draft.totalValue += tick.totalValue
            draft.tokens.push(...tick.tokens)
          })
        }
      })
    })
  })

  const days = Object.keys(byDay)
    .map(d => Number(d))
    .sort((d1, d2) => d2 - d1)

  let ticks = days.map(day => {
    return mergeEarningStatsTick(byDay[day])
  })

  ticks = fillHistoricalEarningsForTicks(ticks)

  return ticks
}

export const calculateEarningBreakdowns = (
  todayEarningTick: EarningStatsTick | undefined,
): EarningsBreakdown | undefined => {
  if (!todayEarningTick) {
    return undefined
  }

  const totalValue = todayEarningTick.totalValue
  const tokens = todayEarningTick.tokens
  const isAllZero = tokens.every(token => token.amountUSD === 0)
  const visibleItems = tokens.length <= 10 ? tokens.length : 10
  const totalValueOfOthers = todayEarningTick.tokens.slice(9).reduce((acc, data) => acc + data.amountUSD, 0)
  const breakdowns: EarningsBreakdown['breakdowns'] =
    tokens.length <= 10
      ? tokens.map(data => ({
          chainId: data.chainId,
          logoUrl: data.logoUrl,
          symbol: data.symbol,
          value: String(data.amountUSD),
          percent: isAllZero ? (1 / visibleItems) * 100 : (data.amountUSD / totalValue) * 100,
        }))
      : [
          ...tokens.slice(0, 9).map(data => ({
            chainId: data.chainId,
            logoUrl: data.logoUrl,
            symbol: data.symbol,
            value: String(data.amountUSD),
            percent: isAllZero ? 10 : (data.amountUSD / totalValue) * 100,
          })),
          {
            symbol: `Others`,
            chainId: undefined,
            value: String(totalValueOfOthers),
            percent: isAllZero ? 10 : (totalValueOfOthers / totalValue) * 100,
          },
        ]

  return {
    totalValue,
    breakdowns,
  }
}

export const calculateMyPoolAPR = (
  positionEarning: ElasticPositionEarningWithDetails,
  position: Position,
  prices: Record<string, number>,
  currency0: Currency,
  currency1: Currency,
  pendingFee: string[],
): number => {
  const feeReward0 = CurrencyAmount.fromRawAmount(currency0, pendingFee[0])
  const feeReward1 = CurrencyAmount.fromRawAmount(currency1, pendingFee[1])
  const feeUsd =
    +feeReward0.toExact() * prices[position.pool.token0.address] +
    +feeReward1.toExact() * prices[position.pool.token1.address]

  const liquidityInUsd =
    parseFloat(position.amount0.toExact() || '0') * prices[currency0.wrapped.address || ''] +
    parseFloat(position.amount1.toExact() || '0') * prices[currency1.wrapped.address || '']

  const liquidityTime =
    positionEarning.lastCollectedFeeAt && Date.now() / 1000 - Number(positionEarning.lastCollectedFeeAt)
  const estimatedOneYearFee = liquidityTime && (feeUsd * 365 * 24 * 60 * 60) / liquidityTime
  const positionAPR = liquidityTime ? ((estimatedOneYearFee || 0) * 100) / liquidityInUsd : 0

  return positionAPR
}

export const calculateMyFarmAPR = (
  positionEarning: ElasticPositionEarningWithDetails,
  position: Position,
  prices: Record<string, number>,
  currency0: Currency,
  currency1: Currency,
  userFarmInfo: UserFarmInfo,
): number => {
  const rewards: CurrencyAmount<Currency>[][] = []

  Object.values(userFarmInfo).forEach(info => {
    Object.keys(info.rewardByNft).forEach(key => {
      if (key.split('_')[1] === positionEarning.id) {
        rewards.push(info.rewardByNft[key])
      }
    })
  })

  const liquidityInUsd =
    parseFloat(position.amount0.toExact() || '0') * prices[currency0.wrapped.address || ''] +
    parseFloat(position.amount1.toExact() || '0') * prices[currency1.wrapped.address || '']

  const rewardUsd = rewards.reduce((total, item) => {
    const temp = item.reduce((acc, cur) => {
      return acc + +cur.toExact() * prices[cur.currency.wrapped.address]
    }, 0)

    return temp + total
  }, 0)

  const farmingTime =
    positionEarning.lastHarvestedFarmRewardAt && Date.now() / 1000 - Number(positionEarning.lastHarvestedFarmRewardAt)

  const estimatedOneYearFarmReward = farmingTime && (rewardUsd * 365 * 24 * 60 * 60) / farmingTime
  const farmAPR =
    rewardUsd && farmingTime && liquidityInUsd ? ((estimatedOneYearFarmReward || 0) * 100) / liquidityInUsd : 0

  return farmAPR
}
