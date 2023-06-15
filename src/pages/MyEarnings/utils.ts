import { cloneDeep } from '@apollo/client/utilities'
import { ChainId } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import produce from 'immer'
import { GetEarningDataResponse, HistoricalEarning, HistoricalSingleData, TokenEarning } from 'services/earning'

import { NETWORKS_INFO, SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
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

const fillHistoricalEarningsForEmptyDays = (
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
          const tokenInfo: EarningStatsTick['tokens'][number] = {
            logoUrl: currency.logoURI || '',
            amount: Number(tokenEarning.amountFloat),
            amountUSD: Number(tokenEarning.amountUSD),
            symbol: currency.symbol || 'NO SYMBOL',
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
  earningResponse: GetEarningDataResponse | undefined,
): GetEarningDataResponse | undefined => {
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

export const aggregatePoolEarnings = (
  earningResponse: GetEarningDataResponse | undefined,
): GetEarningDataResponse | undefined => {
  if (!earningResponse) {
    return undefined
  }

  const result = produce(earningResponse, draft => {
    const chains = Object.keys(draft)

    chains.forEach(chain => {
      const { positions } = draft[chain]
      // historical earning data only
      const byPool: Record<string, HistoricalSingleData[]> = {}

      positions.forEach(position => {
        const poolId = position.pool.id
        const positionEarnings = position.historicalEarning || []
        if (!byPool[poolId]) {
          byPool[poolId] = []
        }

        const poolEarnings = byPool[poolId]

        poolEarnings.forEach(poolEarning => {
          const day = poolEarning.day

          const dayEarning = positionEarnings.find(e => e.day === day)
          if (dayEarning) {
            poolEarning.fees = (poolEarning.fees || []).concat(dayEarning.fees ? cloneDeep(dayEarning.fees) : [])
            poolEarning.rewards = (poolEarning.rewards || []).concat(
              dayEarning.rewards ? cloneDeep(dayEarning.rewards) : [],
            )
          }
        })

        positionEarnings.forEach(earning => {
          const day = earning.day
          const poolEarning = poolEarnings.find(e => e.day === day)
          if (poolEarning) {
            poolEarning.fees = (poolEarning.fees || []).concat(earning.fees ? cloneDeep(earning.fees) : [])
            poolEarning.rewards = (poolEarning.rewards || []).concat(earning.rewards ? cloneDeep(earning.rewards) : [])
          } else {
            poolEarnings.push(cloneDeep(earning))
          }
        })
      })

      Object.keys(byPool).forEach(poolId => {
        const poolEarnings = byPool[poolId]
        poolEarnings.sort((earning1, earning2) => earning2.day - earning1.day)

        poolEarnings.forEach(poolEarning => {
          const fees = mergeTokenEarnings(poolEarning.fees || [])
          const rewards = mergeTokenEarnings(poolEarning.rewards || [])
          const total = mergeTokenEarnings([...fees, ...rewards])

          poolEarning.fees = fees
          poolEarning.rewards = rewards
          poolEarning.total = total
        })

        byPool[poolId] = fillHistoricalEarningsForEmptyDays(poolEarnings)
      })

      // draft[chain].pools.forEach(pool => {
      //   pool.historicalEarning = byPool[pool.id]
      //   if (pool.historicalEarning.length !== 365) {
      //     const days = pool.historicalEarning.map(e => e.day)
      //     const missingDays = []
      //     let curr = days[0]
      //     for (let i = 1; i < days.length; i++) {
      //       if (curr - days[i] !== 1) {
      //         missingDays.push(
      //           ...Array.from({ length: curr - days[i] })
      //             .map((_, i) => i + 1)
      //             .map(i => curr - i),
      //         )
      //       }

      //       curr = days[i]
      //     }

      //     console.log(
      //       'pool',
      //       pool.id,
      //       pool.historicalEarning.length,
      //       pool.historicalEarning[0].day,
      //       pool.historicalEarning.slice(-1)[0].day,
      //       missingDays,
      //     )
      //   }
      // })
    })
  })

  return result
}

export const aggregateAccountEarnings = (
  earningResponse: GetEarningDataResponse | undefined,
): GetEarningDataResponse | undefined => {
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

export const calculateTicksOfAccountEarningsInMultipleChains = (
  earningResponses: Array<GetEarningDataResponse | undefined>,
  tokensByChainId: TokenAddressMap | undefined,
): EarningStatsTick[] | undefined => {
  if (!tokensByChainId) {
    return undefined
  }

  const byDay: Record<string, EarningStatsTick> = {}

  const responses = earningResponses.filter(Boolean) as GetEarningDataResponse[]

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
              const tokenInfo: EarningStatsTick['tokens'][number] = {
                logoUrl: currency.logoURI || '',
                amount: Number(tokenEarning.amountFloat),
                amountUSD: Number(tokenEarning.amountUSD),
                symbol: currency.symbol || 'NO SYMBOL',
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
  const totalValueOfOthers = todayEarningTick.tokens.slice(9).reduce((acc, data) => acc + data.amountUSD, 0)
  const breakdowns: EarningsBreakdown['breakdowns'] =
    tokens.length <= 10
      ? tokens.map(data => ({
          chainId: data.chainId,
          logoUrl: data.logoUrl,
          symbol: data.symbol,
          value: String(data.amountUSD),
          percent: (data.amountUSD / totalValue) * 100,
        }))
      : [
          ...tokens.slice(0, 9).map(data => ({
            chainId: data.chainId,
            logoUrl: data.logoUrl,
            symbol: data.symbol,
            value: String(data.amountUSD),
            percent: (data.amountUSD / totalValue) * 100,
          })),
          {
            symbol: `Others`,
            chainId: undefined,
            value: String(totalValueOfOthers),
            percent: (totalValueOfOthers / totalValue) * 100,
          },
        ]

  return {
    totalValue,
    breakdowns,
  }
}

// TODO: not in use, can remove later
export const mergeAccountEarningsInChains = (
  listEarnings: Array<HistoricalSingleData[] | undefined>,
): HistoricalSingleData[] | undefined => {
  const earnings = listEarnings.filter(Boolean).flat() as HistoricalSingleData[]

  const byDay: Record<string, HistoricalSingleData> = {}

  earnings.forEach(earning => {
    const day = earning.day
    if (!byDay[day]) {
      byDay[day] = cloneDeep(earning)
    } else {
      byDay[day].fees = (byDay[day].fees || []).concat(earning.fees ? cloneDeep(earning.fees) : [])
      byDay[day].rewards = (byDay[day].rewards || []).concat(earning.rewards ? cloneDeep(earning.rewards) : [])
    }
  })

  Object.keys(byDay).forEach(day => {
    const fees = mergeTokenEarnings(byDay[day].fees || [])
    const rewards = mergeTokenEarnings(byDay[day].rewards || [])
    const total = mergeTokenEarnings(byDay[day].total || [])

    byDay[day].fees = fees
    byDay[day].rewards = rewards
    byDay[day].total = total
  })

  const aggregatedEarnings = Object.keys(byDay)
    .map(dayStr => Number(dayStr))
    .sort((day1, day2) => day2 - day1)
    .map(day => byDay[day])

  return fillHistoricalEarningsForEmptyDays(aggregatedEarnings)
}
