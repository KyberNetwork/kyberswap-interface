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
) => {
  if (!data?.length) {
    return undefined
  }

  const ticks: EarningStatsTick[] = data.map(singlePointData => {
    const poolRewardsValueUSD = sumTokenEarnings(singlePointData.fees || [])
    const farmRewardsValueUSD = sumTokenEarnings(singlePointData.rewards || [])

    const tick: EarningStatsTick = {
      day: singlePointData.day,
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
            chainId,
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
        day: i,
        date: dayjs(i * 86400 * 1000).format('MMM DD'),
        poolRewardsValue: 0,
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
      earningByTokenId[tokenId] = earning
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
        const earnings = position.historicalEarning
        if (!byPool[poolId]) {
          byPool[poolId] = []
        }

        const poolEarnings = byPool[poolId]

        poolEarnings.forEach(poolEarning => {
          const day = poolEarning.day

          const dayEarning = earnings.find(e => e.day === day)
          if (dayEarning) {
            poolEarning.fees = (poolEarning.fees || []).concat(dayEarning.fees || [])
            poolEarning.rewards = (poolEarning.rewards || []).concat(dayEarning.rewards || [])
          }
        })

        earnings.forEach(earning => {
          const day = earning.day
          const poolEarning = poolEarnings.find(e => e.day === day)
          if (poolEarning) {
            earning.fees = (earning.fees || []).concat(poolEarning.fees || [])
            earning.rewards = (earning.rewards || []).concat(poolEarning.rewards || [])
          } else {
            poolEarnings.push(earning)
          }
        })
      })

      Object.keys(byPool).forEach(poolId => {
        const poolEarnings = byPool[poolId]
        poolEarnings.sort((earning1, earning2) => {
          if (earning1.day < earning2.day) {
            return -1
          }

          if (earning1.day > earning2.day) {
            return 1
          }

          return 0
        })

        poolEarnings.forEach(poolEarning => {
          const fees = mergeTokenEarnings(poolEarning.fees || [])
          const rewards = mergeTokenEarnings(poolEarning.rewards || [])
          const total = mergeTokenEarnings([...fees, ...rewards])

          poolEarning.fees = fees
          poolEarning.rewards = rewards
          poolEarning.total = total
        })
      })

      draft[chain].pools.forEach(pool => {
        pool.historicalEarning = byPool[pool.id]
      })
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
        const earnings = position.historicalEarning

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

          byDay[day].fees!.push(...(earning.fees || []))
          byDay[day].rewards!.push(...(earning.rewards || []))
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
  earningResponse: GetEarningDataResponse | undefined,
  tokensByChainId: TokenAddressMap | undefined,
): EarningStatsTick[] | undefined => {
  if (!earningResponse || !tokensByChainId) {
    return undefined
  }

  const today = Math.floor(Date.now() / 1000 / 86400)
  const byDay: Record<string, EarningStatsTick> = {}

  const chainRoutes = Object.keys(earningResponse)

  chainRoutes.forEach(chainRoute => {
    const chainId = chainIdByRoute[chainRoute]
    const data = earningResponse[chainRoute].account

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
        day: singlePointData.day,
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
              chainId,
            }
          })
          .sort((tokenEarning1, tokenEarning2) => tokenEarning2.amount - tokenEarning1.amount),
      }

      return tick
    })

    // fill ticks for unavailable days
    const latestDay = ticks[0]?.day || today - 365 // fallback to 30 days ago
    const tickToFill: Omit<EarningStatsTick, 'day' | 'date'> = ticks[0]
      ? ticks[0]
      : {
          poolRewardsValue: 0,
          farmRewardsValue: 0,
          totalValue: 0,
          tokens: [],
        }

    if (latestDay < today) {
      for (let i = latestDay + 1; i <= today; i++) {
        ticks.unshift({
          ...tickToFill,
          day: i,
          date: dayjs(i * 86400 * 1000).format('MMM DD'),
        })
      }
    }

    ticks.forEach(tick => {
      const day = tick.day
      if (!byDay[day]) {
        byDay[day] = tick
      } else {
        byDay[day].farmRewardsValue += tick.farmRewardsValue
        byDay[day].poolRewardsValue += tick.poolRewardsValue
        byDay[day].totalValue += tick.totalValue
        byDay[day].tokens.push(...tick.tokens)
      }
    })
  })

  const days = Object.keys(byDay)
    .map(d => Number(d))
    .sort((d1, d2) => d2 - d1)

  const ticks = days.map(day => byDay[day])

  return ticks
}

export const calculateEarningBreakdowns = (
  earningResponse: GetEarningDataResponse | undefined,
  tokensByChainId: TokenAddressMap | undefined,
): EarningsBreakdown | undefined => {
  const dataByChainRoute = earningResponse || {}
  const tokens = tokensByChainId || {}

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

          const currency = tokens[chainId][tokenAddress]
          return !!currency
        })
        .map(tokenData => {
          const tokenAddress = isAddress(chainId, tokenData.token)
          const currency = tokens[chainId][String(tokenAddress)]
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
            symbol: `Others`,
            value: String(totalValueOfOthers),
            percent: (totalValueOfOthers / totalValue) * 100,
          },
        ]

  return {
    totalValue,
    breakdowns: breakdowns,
  }
}
