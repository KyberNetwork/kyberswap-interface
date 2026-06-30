import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { RateInfo } from 'components/LimitOrder/types'
import { calcInvert, calcOutput, calcRate, formatPriceInputValue, parseFraction } from 'components/LimitOrder/utils'
import { TIMES_IN_SECS } from 'constants/index'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { formatTimeDuration } from 'utils/time'

export type UseLimitOrderFormStateProps = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  useUrlParams?: boolean
}

const DEFAULT_EXPIRED = 36500 * TIMES_IN_SECS.ONE_DAY
const DEFAULT_RATE_INFO: RateInfo = { rate: '', invertRate: '' }

export const useLimitOrderFormState = ({ currencyIn, currencyOut, useUrlParams }: UseLimitOrderFormStateProps) => {
  const { chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlChainId = searchParams.get('chainId')
  const urlChainIdNumber = urlChainId ? +urlChainId : undefined
  const chainId: ChainId =
    useUrlParams && urlChainIdNumber && SUPPORTED_NETWORKS.includes(urlChainIdNumber) ? urlChainIdNumber : walletChainId

  const {
    setCurrencyIn: updateCurrencyIn,
    setCurrencyOut: updateCurrencyOut,
    switchCurrency: rotateCurrency,
    setInputValue: setInputAmount,
  } = useLimitActionHandlers()
  const { inputAmount } = useLimitState()

  const autoFillMarketPrice = useRef(false)

  const [outputAmount, setOutputAmount] = useState('')
  const [rateInfo, setRateInfo] = useState<RateInfo>(DEFAULT_RATE_INFO)
  const [expire, setExpire] = useState(DEFAULT_EXPIRED)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDateExpire, setCustomDateExpire] = useState<Date | undefined>()
  const [expanded, setExpanded] = useState(false)

  const { loading: loadingTrade, tradeInfo } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)

  const displayRate = rateInfo.rate
  const expiredAt = customDateExpire?.getTime() || Date.now() + expire * 1000
  const displayTime = customDateExpire ? dayjs(customDateExpire).format('DD/MM/YYYY HH:mm') : formatTimeDuration(expire)

  const clearRate = () => {
    setRateInfo(rateInfo => ({ ...rateInfo, invertRate: '', rate: '', rateFraction: undefined }))
  }

  const setCurrencyIn = (currency: Currency | undefined) => {
    if (useUrlParams) {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.set(
        'inputCurrency',
        !currency ? '' : currency.isNative ? currency.symbol || '' : currency.wrapped.address,
      )
      setSearchParams(nextSearchParams)
    } else updateCurrencyIn(currency)
    autoFillMarketPrice.current = false
  }

  const setCurrencyOut = (currency: Currency | undefined) => {
    if (useUrlParams) {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.set(
        'outputCurrency',
        !currency ? '' : currency.isNative ? currency.symbol || '' : currency.wrapped.address,
      )
      setSearchParams(nextSearchParams)
    } else updateCurrencyOut(currency)
    autoFillMarketPrice.current = false
  }

  const switchCurrency = () => {
    if (useUrlParams) {
      const cin = searchParams.get('inputCurrency') || ''
      const cout = searchParams.get('outputCurrency') || ''
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.set('outputCurrency', cin)
      nextSearchParams.set('inputCurrency', cout)
      setSearchParams(nextSearchParams)
    } else rotateCurrency()
  }

  const onSetInput = (input: string) => {
    setInputAmount(input)
    if (rateInfo.rate && currencyIn && currencyOut && input) {
      setOutputAmount(calcOutput(input, rateInfo.rateFraction || rateInfo.rate, currencyOut.decimals))
    }
  }

  const onSetRate = useCallback(
    (rate: string, invertRate: string) => {
      if (!currencyIn || !currencyOut) return
      const newRate: RateInfo = { ...rateInfo, rate, invertRate, rateFraction: parseFraction(rate) }
      if (!rate && !invertRate) {
        setRateInfo(newRate)
        return
      }

      if (rate) {
        if (inputAmount) {
          const output = calcOutput(inputAmount, newRate.rateFraction || rate, currencyOut.decimals)
          setOutputAmount(output)
        }
        if (!invertRate) {
          newRate.invertRate = calcInvert(rate)
        }
        setRateInfo(newRate)
        return
      }
      if (invertRate) {
        newRate.rate = calcInvert(invertRate)
        newRate.rateFraction = parseFraction(invertRate).invert()
        if (inputAmount) {
          const output = calcOutput(inputAmount, newRate.rateFraction, currencyOut.decimals)
          setOutputAmount(output)
        }
        setRateInfo(newRate)
        return
      }
    },
    [currencyIn, currencyOut, inputAmount, rateInfo],
  )

  const onChangeRate = (val: string) => {
    if (currencyOut) {
      onSetRate(val, '')
    }
  }

  const setPriceRateMarket = useCallback(
    (autoFillInput = false) => {
      try {
        !autoFillInput && trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'set price')
        if ((loadingTrade && !autoFillInput) || !tradeInfo) return
        const marketRate = formatPriceInputValue(tradeInfo.marketRate)
        onSetRate(marketRate, formatPriceInputValue(tradeInfo.invertRate))
        if (!autoFillInput) {
          trackingHandler(TRACKING_EVENT_TYPE.LO_PRICE_SET, {
            side: 'sell',
            limit_price: marketRate,
            market_price: marketRate,
            price_difference_pct: 0,
            from_token: currencyIn?.symbol,
            to_token: currencyOut?.symbol,
            chain: networkInfo.name,
          })
        }
      } catch (error) {}
    },
    [loadingTrade, trackingHandler, onSetRate, tradeInfo, currencyIn, currencyOut, networkInfo.name],
  )

  const onSetOutput = (output: string) => {
    if (inputAmount && parseFloat(inputAmount) !== 0 && currencyOut && output) {
      const rate = calcRate(inputAmount, output, currencyOut.decimals)
      setRateInfo({
        ...rateInfo,
        rate,
        rateFraction: parseFraction(rate),
        invertRate: calcInvert(rate),
      })
    }
    setOutputAmount(output)
  }

  const handleInputSelect = (currency: Currency, resetRate = true) => {
    if (currencyOut && currency?.equals(currencyOut)) {
      switchCurrency()
      return
    }
    setCurrencyIn(currency)
    resetRate && clearRate()
  }

  const handleOutputSelect = (currency: Currency) => {
    if (currencyIn && currency?.equals(currencyIn)) {
      switchCurrency()
      return
    }
    setCurrencyOut(currency)
    clearRate()
  }

  const handleRotateClick = () => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_SIDE_SELECTED, {
      side: 'buy',
      from_token: currencyOut?.symbol,
      to_token: currencyIn?.symbol,
      chain: networkInfo.name,
    })
    switchCurrency()
    setInputAmount(outputAmount)
    setOutputAmount(inputAmount)
    if (currencyIn) {
      const rate = calcRate(outputAmount, inputAmount, currencyIn.decimals)
      setRateInfo({
        ...rateInfo,
        rate,
        rateFraction: parseFraction(rate),
        invertRate: calcInvert(rate),
      })
    }
  }

  const toggleDatePicker = () => {
    setShowDatePicker(showDatePicker => !showDatePicker)
  }

  const onChangeExpire = (val: Date | number) => {
    const previousExpiry = displayTime
    if (typeof val === 'number') {
      setExpire(val)
      setCustomDateExpire(undefined)
      trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'choose date')
      trackingHandler(TRACKING_EVENT_TYPE.LO_EXPIRY_CHANGED, {
        previous_expiry: previousExpiry,
        new_expiry: formatTimeDuration(val),
        custom_expiry_minutes: null,
        chain: networkInfo.name,
      })
    } else {
      setCustomDateExpire(val)
      trackingHandler(TRACKING_EVENT_TYPE.LO_EXPIRY_CHANGED, {
        previous_expiry: previousExpiry,
        new_expiry: 'custom',
        custom_expiry_minutes: Math.round((val.getTime() - Date.now()) / 60000),
        chain: networkInfo.name,
      })
    }
  }

  const onResetForm = () => {
    setInputAmount('')
    setOutputAmount('')
    setRateInfo(DEFAULT_RATE_INFO)
    setExpire(DEFAULT_EXPIRED)
    setCustomDateExpire(undefined)
  }

  useEffect(() => {
    if (tradeInfo && !autoFillMarketPrice.current && !loadingTrade) {
      autoFillMarketPrice.current = true
      setPriceRateMarket(true)
    }
  }, [tradeInfo, setPriceRateMarket, loadingTrade])

  return {
    chainId,
    walletChainId,
    networkInfo,
    searchParams,
    inputAmount,
    outputAmount,
    rateInfo,
    displayRate,
    expire,
    showDatePicker,
    customDateExpire,
    expanded,
    loadingTrade,
    tradeInfo,
    expiredAt,
    displayTime,
    setExpanded,
    onSetInput,
    onSetOutput,
    onChangeRate,
    handleInputSelect,
    handleOutputSelect,
    handleRotateClick,
    toggleDatePicker,
    onChangeExpire,
    onResetForm,
    setPriceRateMarket,
  }
}
