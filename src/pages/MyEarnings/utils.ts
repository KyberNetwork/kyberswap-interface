import { ChainId } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import produce from 'immer'
import { GetEarningDataResponse, HistoricalEarning, HistoricalSingleData, TokenEarning } from 'services/earning'

import { TokenAddressMap } from 'state/lists/reducer'
import { EarningStatsTick } from 'types/myEarnings'
import { isAddress } from 'utils'

export const today = Math.floor(Date.now() / 1000 / 86400)

const sumTokenEarnings = (earnings: TokenEarning[]) => {
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
