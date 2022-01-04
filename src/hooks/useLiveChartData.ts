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
  return prices[closestIndex][0] - time > 1000000 ? 0 : prices[closestIndex][1]
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

const liveDataApi: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: `${process.env.REACT_APP_AGGREGATOR_API}/ethereum/tokens`,
  [ChainId.BSCMAINNET]: `${process.env.REACT_APP_AGGREGATOR_API}/bsc/tokens`,
  [ChainId.MATIC]: `${process.env.REACT_APP_AGGREGATOR_API}/polygon/tokens`,
  [ChainId.AVAXMAINNET]: `${process.env.REACT_APP_AGGREGATOR_API}/avalanche/tokens`,
  [ChainId.FANTOM]: `${process.env.REACT_APP_AGGREGATOR_API}/fantom/tokens`,
  [ChainId.CRONOS]: `${process.env.REACT_APP_AGGREGATOR_API}/cronos/tokens`
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
    let intervalId: any
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
        intervalId = setInterval(() => {
          getLiveData()
        }, 60000)

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
        intervalId = setInterval(() => {
          getLiveData()
        }, 60000)

        setData(
          data1.prices.map((item: number[]) => {
            const closestPrice = getClosestPrice(data2.prices, item[0])
            return { time: item[0], value: closestPrice > 0 ? (item[1] / closestPrice).toPrecision(6) : 0 }
          })
        )
      } catch (error) {
        console.log(error)
        setError(true)
      }
      setLoading(false)
    }
    const getLiveData = async () => {
      try {
        const liveDataUrl = liveDataApi[chainId] + `?ids=${tokenAddresses[0]},${tokenAddresses[1]}`
        const response = await fetch(liveDataUrl)
        const data: any = await response.json()
        const value =
          data && tokenAddresses[0] && tokenAddresses[1]
            ? data[tokenAddresses[0]].price / data[tokenAddresses[1]].price
            : 0

        value && setData(prevData => [...prevData, { time: new Date().getTime(), value: value }])
      } catch (error) {
        console.log(error)
      }
    }
    fetchKyberData()

    return () => {
      intervalId && clearInterval(intervalId)
    }
  }, [tokenAddresses, timeFrame, chainId])

  return { data, error, loading }
}
