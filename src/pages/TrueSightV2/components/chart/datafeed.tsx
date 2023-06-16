import { useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'

import {
  ErrorCallback,
  HistoryCallback,
  LibrarySymbolInfo,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SubscribeBarsCallback,
} from 'components/TradingViewChart/charting_library'
import { getTradingViewTimeZone } from 'components/TradingViewChart/utils'
import { useLazyChartingDataQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { defaultExplorePageToken } from 'pages/TrueSightV2/pages/SingleToken'
import { ITokenOverview, OHLCData } from 'pages/TrueSightV2/types'

const configurationData = {
  supported_resolutions: ['1H', '4H', '1D', '4D'],
}

export const useDatafeed = (isBTC: boolean, token?: ITokenOverview) => {
  const intervalRef = useRef<any>()
  const { chain, address } = useParams()
  const [getChartingData, { isLoading }] = useLazyChartingDataQuery()
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const ref = useRef<{ isLoading: boolean }>({ isLoading })

  return useMemo(() => {
    const { isLoading } = ref.current
    const log10 = token?.price ? Math.ceil(Math.log10(token.price)) : 0
    const pricescale = log10 < 0 ? Math.pow(10, -log10 + 4) : 10000
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
          const chartName = `${token?.symbol?.toUpperCase()}/${isBTC ? 'BTC' : 'USD'}`
          const symbolInfo: LibrarySymbolInfo = {
            ticker: chartName,
            name: chartName,
            full_name: chartName,
            listed_exchange: '',
            format: 'price',
            description: chartName,
            type: 'crypto',
            session: '24x7',
            timezone: getTradingViewTimeZone(),
            exchange: '',
            minmov: 1,
            pricescale: isBTC ? pricescale * 10000 : pricescale,
            has_intraday: true,
            has_empty_bars: true,
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
        const candleSize = { 60: '1h', 240: '4h', '1D': '1d', '4D': '1d' }[resolution as string] || '1h'

        const { data } = await getChartingData({
          chain: chain || defaultExplorePageToken.chain,
          address: address || defaultExplorePageToken.address,
          from: periodParams.from,
          to: periodParams.to,
          candleSize: candleSize,
          currency: isBTC ? 'BTC' : 'USD',
        })
        const data2 = data
          ?.slice()
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((item: OHLCData) => {
            return {
              open: item.open,
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
          const now = Math.floor(Date.now() / 1000)
          const candleSize = { 60: '1h', 240: '4h', '1D': '1d' }[resolution as string] || '1h'

          const { data } = await getChartingData({
            chain: chain || defaultExplorePageToken.chain,
            address: address || defaultExplorePageToken.address,
            from: now - 345600,
            to: now,
            candleSize: candleSize,
            currency: isBTC ? 'BTC' : 'USD',
          })

          onTick(
            (data || [])
              .slice()
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((item: OHLCData) => {
                return {
                  open: item.open,
                  high: item.high,
                  close: item.close,
                  low: item.low,
                  volume: +resolution < 1440 ? (item.volume24H / 1440) * +resolution : item.volume24H,
                  time: item.timestamp * 1000,
                }
              })[0],
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
  }, [getChartingData, isBTC, chain, address, token])
}
