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

import dataJson from './../chart/candles.json'

const configurationData = {
  supported_resolutions: ['1', '5', '15', '1H', '2H', '4H', '1D'],
}

export const useDatafeed = () => {
  const intervalRef = useRef<any>()

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
        if (periodParams.to * 1000 < 1674409500000) {
          onHistoryCallback([], { noData: true })
          return
        }
        onHistoryCallback(
          dataJson?.map((item: any) => ({
            time: item.time,
            open: item.open,
            high: Math.min(item.high, item.close * 1.1),
            close: item.close,
            low: Math.max(item.low, item.close / 1.1),
            volume: item.volume,
          })) || [],
          { noData: true },
        )
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
  }, [])
}
