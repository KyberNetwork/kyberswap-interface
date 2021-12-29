import { useMemo, useEffect, useState } from 'react'
import { Token, ChainId, ETHER, WETH } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from 'hooks'
import { COINGECKO_NETWORK_ID } from 'constants/index'
import useSWR from 'swr'
import { getUnixTime, subHours } from 'date-fns'

const getTimeFrameHours = (timeFrame: LiveDataTimeframeEnum) => {
  switch (timeFrame) {
    case LiveDataTimeframeEnum.HOUR:
      return 1
    case LiveDataTimeframeEnum.DAY:
      return 24
    case LiveDataTimeframeEnum.WEEK:
      return 7 * 24
    case LiveDataTimeframeEnum.MONTH:
      return 30 * 24
    case LiveDataTimeframeEnum.YEAR:
      return 365 * 24
    default:
      return 7 * 24
  }
}
const generateCoingeckoUrl = (
  chainId: ChainId,
  address: string | undefined,
  timeFrame: LiveDataTimeframeEnum
): string => {
  const timeTo = getUnixTime(new Date())
  const timeFrom = getUnixTime(subHours(new Date(), getTimeFrameHours(timeFrame)))
  return `https://api.coingecko.com/api/v3/coins/${
    COINGECKO_NETWORK_ID[chainId || ChainId.MAINNET]
  }/contract/${address}/market_chart/range?vs_currency=usd&from=${timeFrom}&to=${timeTo}`
}
const getClosestPrice = (prices: any[], time: number) => {
  let closestIndex = 0
  prices.forEach((item, index) => {
    if (Math.abs(item[0] - time) < Math.abs(prices[closestIndex][0] - time)) {
      closestIndex = index
    }
  })
  return prices[closestIndex][1]
}

export enum LiveDataTimeframeEnum {
  HOUR = '1H',
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  YEAR = '1Y'
}

export interface ChartDataInfo {
  readonly time: number
  readonly value: number
}

export default function useLiveChartData(tokens: (Token | null | undefined)[], timeFrame: LiveDataTimeframeEnum) {
  const { chainId } = useActiveWeb3React()
  const [data, setData] = useState<ChartDataInfo[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const isReverse = useMemo(() => {
    if (!tokens || !tokens[0] || !tokens[1] || tokens[0].equals(tokens[1])) return false
    const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? [tokens[0], tokens[1]] : [tokens[1], tokens[0]]
    return token0 !== tokens[0]
  }, [tokens])

  const tokenAddresses = useMemo(
    () =>
      tokens
        .filter(Boolean)
        .map(token => (token === ETHER ? WETH[chainId || ChainId.MAINNET].address : token?.address)?.toLowerCase()),
    [tokens]
  )
  useEffect(() => {
    if (!tokenAddresses[0] || !tokenAddresses[1] || !chainId) return
    setError(false)
    setLoading(true)
    const url = `https://price-chart.kyberswap.com/api/price-chart?chainId=${chainId}&timeWindow=${timeFrame.toLowerCase()}&tokenIn=${
      tokenAddresses[0]
    }&tokenOut=${tokenAddresses[1]}`
    const fetchKyberData = async () => {
      try {
        const response = await fetch(url)
        if (response.status === 204) {
          throw new Error('No content')
        }
        const data = await response.json()
        if (data.every((item: any) => !item.token0Price || item.token0Price == '0')) {
          throw new Error('Data full zero')
        }
        setData(
          data
            .sort((a: any, b: any) => parseInt(a.timestamp) - parseInt(b.timestamp))
            .map((item: any) => {
              return {
                time: parseInt(item.timestamp) * 1000,
                value: !isReverse ? item.token0Price : item.token1Price || 0
              }
            })
        )
        setLoading(false)
      } catch (error) {
        fetcherCoingeckoData()
      }
    }

    const fetcherCoingeckoData = async () => {
      try {
        const [data1, data2] = await Promise.all(
          [tokenAddresses[0], tokenAddresses[1]].map(address =>
            fetch(generateCoingeckoUrl(chainId, address, timeFrame)).then(r => r.json())
          )
        )
        setData(
          data1.prices.map((item: number[]) => {
            return { time: item[0], value: (item[1] / getClosestPrice(data2.prices, item[0])).toPrecision(6) }
          })
        )
      } catch (error) {
        console.log(error)
        setError(true)
      }
      setLoading(false)
    }

    fetchKyberData()
  }, [tokenAddresses, timeFrame, chainId])

  return { data, error, loading }
}

// export default function useLiveChartData(tokens: (Token | null | undefined)[], timeFrame: LiveDataTimeframeEnum) {
//   const { chainId } = useActiveWeb3React()

//   const tokenAddresses = tokens
//     .filter(Boolean)
//     .map(token => (token === ETHER ? WETH[chainId || ChainId.MAINNET].address : token?.address))

//   const url = `https://price-chart.kyberswap.com/api/price-chart?chainId=${chainId}&timeWindow=${timeFrame.toLowerCase()}&tokenIn=${
//     tokenAddresses[0]
//   }&tokenOut=${tokenAddresses[1]}`

//   const fetcher = (url: string) =>
//     fetch(url).then(res => {
//       if (res.status === 204) throw new Error('No content')
//       return res.json()
//     })

//   const { data, error } = useSWR(url, fetcher)

//   //If Kyber api not return data, use Coingecko apis
//   if (error || !data) {
//     const fetcherCoingecko = (tokenAddress1: string, tokenAddress2: string, tf: LiveDataTimeframeEnum) => {
//       return Promise.all(
//         [tokenAddress1, tokenAddress2].map(address => fetch(generateUrl(chainId, address, tf)).then(r => r.json()))
//       )
//     }
//     const { data } = useSWR([...tokenAddresses, timeFrame], fetcherCoingecko)
//     return useMemo(() => {
//       if (data) {
//         const [data1, data2] = data
//         const chartData = data1.prices.map((item: number[], index: number) => {
//           return { time: item[0], value: (item[1] / getClosestPrice(data2.prices, item[0])).toPrecision(6) }
//         })

//         return chartData
//       }
//       return []
//     }, [chainId, data, JSON.stringify(tokens), timeFrame])
//   }

//   //If Kyber api return data
//   return useMemo(() => {
//     return data
//       .sort((a: any, b: any) => parseInt(a.timestamp) - parseInt(b.timestamp))
//       .map((item: any) => {
//         return { time: parseInt(item.timestamp) * 1000, value: item.token0Price || 0 }
//       })
//   }, [chainId, data, JSON.stringify(tokens), timeFrame])
// }
