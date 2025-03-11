import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { KyberOauth2Api } from '@kyberswap/oauth2'
import { AxiosResponse } from 'axios'
import { getUnixTime, subHours } from 'date-fns'
import { useMemo } from 'react'
import coingeckoApi from 'services/coingecko'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

import useCoingeckoAPI from './useCoingeckoAPI'

export enum LiveDataTimeframeEnum {
  HOUR = '1H',
  FOUR_HOURS = '4H',
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  SIX_MONTHS = '6M',
}

const getTimeFrameHours = (timeFrame: LiveDataTimeframeEnum) => {
  switch (timeFrame) {
    case LiveDataTimeframeEnum.HOUR:
      return 1
    case LiveDataTimeframeEnum.FOUR_HOURS:
      return 4
    case LiveDataTimeframeEnum.DAY:
      return 24
    case LiveDataTimeframeEnum.WEEK:
      return 7 * 24
    case LiveDataTimeframeEnum.MONTH:
      return 30 * 24
    case LiveDataTimeframeEnum.SIX_MONTHS:
      return 180 * 24
    default:
      return 7 * 24
  }
}
const generateCoingeckoUrl = (
  coingeckoAPI: string,
  chainId: ChainId,
  address: string | undefined,
  timeFrame: LiveDataTimeframeEnum | 'live',
): string => {
  const timeTo = getUnixTime(new Date())
  const timeFrom =
    timeFrame === 'live' ? timeTo - 1000 : getUnixTime(subHours(new Date(), getTimeFrameHours(timeFrame)))
  const cgkId = NETWORKS_INFO[chainId].coingeckoNetworkId
  if (!cgkId) return ''
  return `${coingeckoAPI}/coins/${cgkId}/contract/${address}/market_chart/range?vs_currency=usd&from=${timeFrom}&to=${timeTo}`
}
const getClosestPrice = (prices: any[], time: number) => {
  let closestIndex = 0
  prices.forEach((item, index) => {
    if (Math.abs(item[0] - time) < Math.abs(prices[closestIndex][0] - time)) {
      closestIndex = index
    }
  })
  return prices[closestIndex][0] - time > 10000000 ? 0 : prices[closestIndex][1]
}
const formatData = (res: AxiosResponse) => {
  if (res.status === 204) {
    throw new Error('No content')
  }
  return res.data
}

export const fetchCoingeckoData = async ([tokenAddresses, chainIds, timeFrame, coingeckoAPI]: [
  tokenAddresses: string[],
  chainIds: ChainId[],
  timeFrame: any,
  coingeckoAPI: string,
]): Promise<any> => {
  return await Promise.all(
    tokenAddresses.map((address, i) =>
      KyberOauth2Api.get(generateCoingeckoUrl(coingeckoAPI, chainIds[i], address, timeFrame), undefined, {
        timeout: 5000,
      }).then(formatData),
    ),
  )
}

type ChartData = { time: number; value: any }

export default function useBasicChartData(
  tokens: (Token | null | undefined)[],
  timeFrame: LiveDataTimeframeEnum,
): { data: ChartData[]; loading: boolean; error: any } {
  const { chainId } = useActiveWeb3React()
  const coingeckoAPI = useCoingeckoAPI()

  const tokenAddresses = useMemo(
    () =>
      tokens.filter(Boolean).map(token => {
        const tokenAdd = token?.isNative ? WETH[chainId].address : token?.address
        return tokenAdd?.toLowerCase()
      }),
    [tokens, chainId],
  )

  const {
    data: coingeckoData,
    error: coingeckoError,
    isLoading: coingeckoLoading,
  } = coingeckoApi.useFetchCoingeckoDataQuery(
    {
      tokenAddresses: tokenAddresses as string[],
      chainIds: [tokens[0]?.chainId, tokens[1]?.chainId] as ChainId[],
      timeFrame,
      coingeckoAPI,
    },
    { skip: !tokenAddresses[0] || !tokenAddresses[1] },
  )

  const chartData = useMemo(() => {
    if (coingeckoData && coingeckoData[0]?.prices?.length > 0 && coingeckoData[1]?.prices?.length > 0) {
      const [data1, data2] = coingeckoData
      return data1.prices.map((item: number[]) => {
        const closestPrice = getClosestPrice(data2.prices, item[0])
        return { time: item[0], value: closestPrice > 0 ? parseFloat((item[1] / closestPrice).toPrecision(6)) : 0 }
      })
    } else return []
  }, [coingeckoData])

  const { data: liveCoingeckoData } = coingeckoApi.useFetchCoingeckoDataQuery(
    {
      tokenAddresses: tokenAddresses as string[],
      chainIds: [tokens[0]?.chainId, tokens[1]?.chainId] as ChainId[],
      timeFrame: 'live',
      coingeckoAPI,
    },
    { skip: !coingeckoData, pollingInterval: 60_000 },
  )

  const latestData = useMemo(() => {
    if (liveCoingeckoData) {
      const [data1, data2] = liveCoingeckoData
      if (data1?.prices?.length > 0 && data2?.prices?.length > 0) {
        const newValue = parseFloat(
          (data1.prices[data1.prices.length - 1][1] / data2.prices[data2.prices.length - 1][1]).toPrecision(6),
        )
        return { time: new Date().getTime(), value: newValue }
      }
    }
    return null
  }, [liveCoingeckoData])

  return {
    data: useMemo(() => (latestData ? [...chartData, latestData] : chartData), [latestData, chartData]),
    error: !!coingeckoError || chartData.length === 0,
    loading: !tokenAddresses[0] || !tokenAddresses[1] || coingeckoLoading,
  }
}
