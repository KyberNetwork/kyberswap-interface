import { useEffect, useMemo, useRef } from 'react'

import {
  ErrorCallback,
  HistoryCallback,
  LibrarySymbolInfo,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SubscribeBarsCallback,
  Timezone,
} from 'components/TradingViewChart/charting_library'
import { useLazyCharingDataQuery } from 'pages/TrueSightV2/hooks/useTruesightV2Data'
import { OHLCData } from 'pages/TrueSightV2/types'

import dataJson from './../chart/candles.json'

const configurationData = {
  supported_resolutions: ['1H', '4H', '1D', '4D'],
}

export const useDatafeed = (isBTC: boolean) => {
  const intervalRef = useRef<any>()
  const [getChartingData, { isLoading }] = useLazyCharingDataQuery()
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return useMemo(() => {
    return {
      onReady: (callback: any) => {
        setTimeout(() => callback(configurationData))
      },
      resolveSymbol: async (
        _symbolName: string,
        onSymbolResolvedCallback: ResolveCallback,
        _onResolveErrorCallback: ErrorCallback,
      ) => {
        try {
          const symbolInfo: LibrarySymbolInfo = {
            ticker: 'BTC/USD',
            name: 'BTC/USD',
            full_name: 'BTC/USD',
            listed_exchange: '',
            format: 'price',
            description: 'BTC/USD',
            type: 'crypto',
            session: '24x7',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone as Timezone,
            exchange: '',
            minmov: 1,
            pricescale: 10000,
            has_intraday: true,
            has_empty_bars: true,
            has_weekly_and_monthly: true,
            has_daily: true,
            supported_resolutions: configurationData.supported_resolutions as ResolutionString[],
            data_status: 'streaming',
          }
          onSymbolResolvedCallback(symbolInfo)
        } catch (error) {
          console.log(error)
        }
      },
      getBars: async (
        // symbolInfo is not used
        _symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        periodParams: PeriodParams,
        onHistoryCallback: HistoryCallback,
        _onErrorCallback: ErrorCallback,
      ) => {
        if (isLoading) return
        const { data } = await getChartingData({
          from: periodParams.from,
          to: periodParams.to,
          candleSize: { 60: '1h', 240: '4h', 1440: '1d', 5760: '4d' }[resolution as string] || '1h',
          currency: isBTC ? 'BTC' : 'USD',
        })
        const data2 = data
          ?.slice()
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((item: OHLCData, index: number, arr: OHLCData[]) => {
            return {
              open: arr[index - 1]?.close || item.open,
              high: item.high,
              close: item.close,
              low: item.low,
              volume: +resolution < 1440 ? (item.volume24H / 1440) * +resolution : item.volume24H,
              time: item.timestamp * 1000,
            }
          })

        onHistoryCallback(data2 || [], { noData: data2?.length === 0 ? true : false })
      },
      searchSymbols: () => {
        //
      },
      subscribeBars: async (
        _symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        onTick: SubscribeBarsCallback,
        _listenerGuid: string,
        _onResetCacheNeededCallback: () => void,
      ) => {
        const getData = async () => {
          const data = dataJson

          onTick(
            (data || []).map((item: any) => ({
              time: new Date(item.dt).getTime(),
              open: item.o,
              high: item.h,
              close: item.c,
              low: item.l,
              volume: item.v,
            }))[0],
          )
        }
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(getData, 30000)
        getData()
      },
      unsubscribeBars: () => {
        //
      },
    }
  }, [isLoading, getChartingData, isBTC])
}
