import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import axios, { AxiosResponse } from 'axios'
import { getUnixTime, subHours } from 'date-fns'
import { useMemo } from 'react'
import useSWR from 'swr'

import { useActiveWeb3React } from 'hooks'

import { LiveDataTimeframeEnum } from './useBasicChartData'

type ChartData = { time: number; value: any }

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

const getResolution = (timeFrame: LiveDataTimeframeEnum) => {
  switch (timeFrame) {
    case LiveDataTimeframeEnum.HOUR:
      return '1'
    case LiveDataTimeframeEnum.FOUR_HOURS:
      return '5'
    case LiveDataTimeframeEnum.DAY:
      return '5'
    case LiveDataTimeframeEnum.WEEK:
      return '60'
    case LiveDataTimeframeEnum.MONTH:
      return '240'
    case LiveDataTimeframeEnum.SIX_MONTHS:
      return '1D'
    default:
      return '15'
  }
}

const formatData = (res: AxiosResponse) => {
  if (res.status === 204) {
    throw new Error('No content')
  }
  return res.data
}
const fetchDefinedDataSWR = async ([tokenAddresses, chainIds, timeFrame]: [
  tokenAddresses: string[],
  chainIds: ChainId[],
  timeFrame: any,
]): Promise<any> => {
  const timeTo = getUnixTime(new Date())
  const timeFrom =
    timeFrame === 'live' ? timeTo - 1000 : getUnixTime(subHours(new Date(), getTimeFrameHours(timeFrame)))

  return await Promise.all(
    tokenAddresses.map((address, i) =>
      axios
        .post(
          'https://api.defined.fi/',
          {
            query: `{
              getBars(
                symbol: "${address}:${chainIds[i]}"
                from: ${timeFrom}
                to: ${timeTo}
                resolution: "${getResolution(timeFrame)}"
              ) {
                t
                c
              }
            }`,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': 'PzpyQxAMbQ7hEL2sjhoSz6h4HohT2LMI7bmpMJdK',
            },
          },
        )
        .then(formatData),
    ),
  ).then((res: any) =>
    // res.map((_: any) =>
    //   _.data.getBars.t.map((timestamp: number, i: number) => {
    //     return {
    //       time: timestamp,
    //       value: _.data.getBars.c[i],
    //     }
    //   }),
    // ),
    {
      const timeMap = res[0].data.getBars.t
      return timeMap.map((timestamp: number, i: number) => {
        return { time: timestamp, value: res[0].data.getBars.c[i] / res[1].data.getBars.c[i] }
      })
    },
  )
}

export default function useDefinedAPI(
  tokens: (Token | null | undefined)[],
  timeFrame: LiveDataTimeframeEnum,
): { data: ChartData[]; loading: boolean; error: boolean } {
  const { chainId, isEVM } = useActiveWeb3React()

  const tokenAddresses = useMemo(
    () =>
      tokens.filter(Boolean).map(token => {
        const tokenAdd = token?.isNative ? WETH[chainId].address : token?.address
        return isEVM ? tokenAdd?.toLowerCase() : tokenAdd
      }),
    [tokens, chainId, isEVM],
  )

  const { data: definedData, isLoading } = useSWR(
    tokenAddresses[0] && tokenAddresses[1]
      ? [tokenAddresses, [tokens[0]?.chainId, tokens[1]?.chainId], timeFrame]
      : null,

    fetchDefinedDataSWR,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )
  return { data: definedData || [], loading: isLoading, error: false }
}
