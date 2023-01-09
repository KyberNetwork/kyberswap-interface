import { useEffect, useMemo, useRef } from 'react'
import { PoolResponse, useLazyCandelsticksQuery } from 'services/geckoTermial'

import {
  ErrorCallback,
  HistoryCallback,
  LibrarySymbolInfo,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SubscribeBarsCallback,
  Timezone,
} from './charting_library'

const configurationData = {
  supported_resolutions: ['1', '3', '5', '15', '30', '1H', '2H', '4H', '1D', '1W', '1M'],
}

export const useDatafeed = (poolDetail: PoolResponse, tokenId: string) => {
  const [getCandles, { isLoading }] = useLazyCandelsticksQuery()

  const intervalRef = useRef<any>()

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const base =
    poolDetail.included[0].id === tokenId
      ? poolDetail.included[0].attributes.symbol
      : poolDetail.included[1].attributes.symbol
  const quote =
    poolDetail.included[0].id !== tokenId
      ? poolDetail.included[0].attributes.symbol
      : poolDetail.included[1].attributes.symbol

  const label = `${base}/${quote}`

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
            ticker: label,
            name: label,
            full_name: label,
            listed_exchange: '',
            format: 'price',
            description: label,
            type: 'crypto',
            session: '24x7',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone as Timezone,
            exchange: '',
            minmov: 1,
            // TODO(viet-nv): check pricescale
            pricescale:
              // candles.length > 0
              //   ? Math.pow(10, Math.ceil(Math.log10(isReverse ? candles[0].open : 1 / candles[0].open)) + 5)
              10000,
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
        console.log('getBars', periodParams)
        if (isLoading) return

        const data = await getCandles({
          token_id: tokenId,
          pool_id: poolDetail.data.id,
          from: periodParams.from,
          to: periodParams.to,
          resolution,
          count_back: periodParams.countBack,
          for_update: false,
          currency: 'token',
        })

        onHistoryCallback(
          data?.data?.data.map((item: any) => ({
            time: new Date(item.dt).getTime(),
            open: item.o,
            high: item.h,
            close: item.c,
            low: item.l,
            volume: item.v,
          })) || [],
          {
            noData: data?.data?.meta?.noData === true,
          },
        )
        // try {
        //   const from = periodParams.from * 1000
        //   const to = periodParams.to * 1000

        //   let candlesTemp = stateRef.current.data

        //   let noData = false

        //   const minTime = candlesTemp[0]?.time || new Date().getTime()
        //   if (minTime > from) {
        //     const lastTimePoint = Math.floor(minTime / monthTs) + (periodParams.firstDataRequest ? 1 : 0)
        //     const fromTimePoint = Math.floor(from / monthTs)

        //     fetchingRef.current = true
        //     const promisesArray = []
        //     for (let i = lastTimePoint - 1; i >= fromTimePoint; i--) {
        //       const ts = i * monthTs
        //       promisesArray.push(getCandles(ts))
        //       if (ts < stateRef.current.oldestTs) {
        //         noData = true
        //         break
        //       }
        //     }
        //     const datas = await Promise.all(promisesArray)
        //     setOldestTs(parseFloat(datas[0]?.oldestTs))
        //     const candles = datas.map(data => {
        //       return data.candles
        //     })
        //     candlesTemp = [...(candles.length ? candles.reduce((p, c) => p.concat(c)) : []), ...candlesTemp].sort(
        //       (a, b) => a.time - b.time,
        //     )
        //     setData(candlesTemp)

        //     fetchingRef.current = false
        //   }
        //   let formatedCandles = candlesTemp
        //     .filter((c: Bar) => c.time > from && c.time < to)
        //     .map((c: Bar, i: number, arr: Bar[]) => {
        //       if (arr[i + 1] && c.close !== arr[i + 1].open) {
        //         c.close = arr[i + 1].open
        //         if (c.close > c.high) {
        //           c.high = c.close
        //         }
        //         if (c.close < c.low) {
        //           c.low = c.close
        //         }
        //       }
        //       if (c.high > 1.1 * Math.max(c.open, c.close)) {
        //         c.high = Math.max(c.open, c.close)
        //       }
        //       if (c.low < Math.min(c.open, c.close) / 1.1) {
        //         c.low = Math.min(c.open, c.close)
        //       }
        //       return c
        //     })

        //   if (isReverse) {
        //     formatedCandles = formatedCandles.map((c: Bar) => {
        //       return { ...c, open: 1 / c.open, close: 1 / c.close, high: 1 / c.low, low: 1 / c.high }
        //     })
        //   }

        //   if (resolution === '1D' || resolution === '1W' || resolution === '1M') {
        //     const dayCandles: { [key: number]: Bar } = {}
        //     let timeTs = 0
        //     switch (resolution) {
        //       case '1D':
        //         timeTs = dayTs
        //         break
        //       case '1W':
        //         timeTs = weekTs
        //         break
        //       case '1M':
        //         timeTs = monthTs
        //         break
        //       default:
        //         timeTs = dayTs
        //     }
        //     formatedCandles.forEach((c: Bar) => {
        //       const ts = Math.floor(c.time / timeTs)
        //       if (!dayCandles[ts]) {
        //         dayCandles[ts] = {
        //           ...c,
        //           time: ts * timeTs,
        //         }
        //       } else {
        //         dayCandles[ts].volume = (c.volume || 0) + (dayCandles[ts].volume || 0)
        //         dayCandles[ts].close = c.close
        //         if (dayCandles[ts].high < c.high) {
        //           dayCandles[ts].high = c.high
        //         }
        //         if (dayCandles[ts].low > c.low) {
        //           dayCandles[ts].low = c.low
        //         }
        //       }
        //     })
        //     onHistoryCallback(Object.values(dayCandles), { noData: noData })
        //   } else {
        //     onHistoryCallback(formatedCandles, { noData: noData })
        //   }
        // } catch (error) {
        //   console.log('[getBars]: Get error', error)
        //   onErrorCallback(error as string)
        // }
      },
      searchSymbols: () => {
        // TODO(viet-nv): check no empty function rule
      },
      subscribeBars: async (
        _symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        onTick: SubscribeBarsCallback,
        _listenerGuid: string,
        _onResetCacheNeededCallback: () => void,
      ) => {
        const getData = async () => {
          const data = await getCandles({
            token_id: tokenId,
            pool_id: poolDetail.data.id,
            from: Math.floor(Date.now() / 1000) - +resolution * 60,
            to: Math.floor(Date.now() / 1000),
            resolution,
            for_update: true,
            currency: 'token',
          })

          onTick(
            (data?.data?.data || []).map((item: any) => ({
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
        // const getLivePrice = async () => {
        //   const ts =
        //     resolution === '1M'
        //       ? Math.floor(new Date().getTime() / monthTs) * monthTs
        //       : Math.floor(new Date().getTime() / weekTs) * weekTs
        //   const data = await getCandles(ts, resolution === '1M' ? 'month' : 'week', '15m')
        //   if (!data || !data.candles) return
        //   const { candles } = data
        //   let lastCandle: any = {}
        //   let timeTs = 0
        //   if (resolution === '1D' || resolution === '1W' || resolution === '1M') {
        //     switch (resolution) {
        //       case '1D':
        //         timeTs = Math.floor(new Date().getTime() / dayTs) * dayTs
        //         break
        //       case '1W':
        //         timeTs = Math.floor(new Date().getTime() / weekTs) * weekTs
        //         break
        //       case '1M':
        //         timeTs = timeTs = Math.floor(new Date().getTime() / monthTs) * monthTs
        //         break
        //       default:
        //         timeTs = Math.floor(new Date().getTime() / dayTs) * dayTs
        //     }
        //     const closestTs = candles
        //       .map((c: any) => c.time)
        //       .reduce((prev: any, curr: any) => {
        //         return Math.abs(curr - timeTs) < Math.abs(prev - timeTs) ? curr : prev
        //       })
        //     const inRangeCandles = candles.filter((c: any) => c.time >= closestTs)
        //     if (inRangeCandles.length > 0) {
        //       lastCandle.time = timeTs
        //       lastCandle.open = inRangeCandles[0].open
        //       lastCandle.close = inRangeCandles[inRangeCandles.length - 1].close
        //       lastCandle.high = Math.max(...inRangeCandles.map((c: any) => c.high))
        //       lastCandle.low = Math.min(...inRangeCandles.map((c: any) => c.low))
        //       lastCandle.volume = inRangeCandles
        //         .map((c: any) => c.volume)
        //         .reduce((prev: any, c: any) => {
        //           return prev + c
        //         })
        //     }
        //   } else {
        //     lastCandle = candles[candles.length - 1]
        //   }
        //   if (!lastCandle) return
        //   if (isReverse) {
        //     lastCandle = {
        //       ...lastCandle,
        //       open: 1 / lastCandle.open,
        //       close: 1 / lastCandle.close,
        //       high: 1 / lastCandle.low,
        //       low: 1 / lastCandle.high,
        //     }
        //   }
        //   onTick(lastCandle)
        // }
        intervalRef.current = setInterval(getData, 30000)
        getData()
      },
      unsubscribeBars: () => {
        //
      },
    }
  }, [getCandles, isLoading, poolDetail.data.id, label, tokenId])
}
