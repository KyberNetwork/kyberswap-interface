import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import { useLimitOrderTracking } from 'components/LimitOrder/hooks/useLimitOrderTracking'
import { RateInfo } from 'components/LimitOrder/types'
import { calcInvert, calcOutput, calcRate, formatPriceInputValue, parseFraction } from 'components/LimitOrder/utils'
import { TIMES_IN_SECS } from 'constants/index'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { formatTimeDuration } from 'utils/time'

export type UseLimitOrderFormStateProps = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  useUrlParams?: boolean
}

const DEFAULT_EXPIRED = 30 * TIMES_IN_SECS.ONE_DAY
const DEFAULT_RATE_INFO: RateInfo = { rate: '', invertRate: '' }

export const useLimitOrderFormState = ({ currencyIn, currencyOut, useUrlParams }: UseLimitOrderFormStateProps) => {
  const { chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const { priceInputRequest } = useLimitOrderContext()
  const limitOrderTracking = useLimitOrderTracking()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlChainId = searchParams.get('chainId')
  const urlChainIdNumber = urlChainId ? +urlChainId : undefined
  const chainId: ChainId =
    useUrlParams && urlChainIdNumber && SUPPORTED_NETWORKS.includes(urlChainIdNumber) ? urlChainIdNumber : walletChainId

  const {
    setCurrencyIn: updateCurrencyIn,
    setCurrencyOut: updateCurrencyOut,
    switchCurrency: rotateCurrency,
    setPair: updatePair,
    setInputValue: setInputAmount,
  } = useLimitActionHandlers()
  const { inputAmount } = useLimitState()

  const autoFillMarketPrice = useRef(false)
  const appliedPriceInputRequestId = useRef<number | undefined>(undefined)

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

  const toCurrencyParam = (currency: Currency | undefined) =>
    !currency ? '' : currency.isNative ? currency.symbol || '' : currency.wrapped.address

  const setCurrencyIn = (currency: Currency | undefined) => {
    if (useUrlParams) {
      const nextSearchParams = new URLSearchParams(searchParams)
      for (const key of ['from', 'to', 'tokenIn', 'tokenOut', 'toChain']) nextSearchParams.delete(key)
      nextSearchParams.set('inputCurrency', toCurrencyParam(currency))
      setSearchParams(nextSearchParams)
    } else updateCurrencyIn(currency)
    autoFillMarketPrice.current = false
  }

  const setCurrencyOut = (currency: Currency | undefined) => {
    if (useUrlParams) {
      const nextSearchParams = new URLSearchParams(searchParams)
      for (const key of ['from', 'to', 'tokenIn', 'tokenOut', 'toChain']) nextSearchParams.delete(key)
      nextSearchParams.set('outputCurrency', toCurrencyParam(currency))
      setSearchParams(nextSearchParams)
    } else updateCurrencyOut(currency)
    autoFillMarketPrice.current = false
  }

  const switchCurrency = () => {
    if (useUrlParams) {
      const cin = searchParams.get('inputCurrency') || ''
      const cout = searchParams.get('outputCurrency') || ''
      const nextSearchParams = new URLSearchParams(searchParams)
      for (const key of ['from', 'to', 'tokenIn', 'tokenOut', 'toChain']) nextSearchParams.delete(key)
      nextSearchParams.set('outputCurrency', cin)
      nextSearchParams.set('inputCurrency', cout)
      setSearchParams(nextSearchParams)
    } else rotateCurrency()
  }

  /** Both sides at once, for a pick that turns the pair round: the setters above each change one side. */
  const setPair = (nextIn: Currency, nextOut: Currency) => {
    if (useUrlParams) {
      const nextSearchParams = new URLSearchParams(searchParams)
      for (const key of ['from', 'to', 'tokenIn', 'tokenOut', 'toChain']) nextSearchParams.delete(key)
      nextSearchParams.set('inputCurrency', toCurrencyParam(nextIn))
      nextSearchParams.set('outputCurrency', toCurrencyParam(nextOut))
      setSearchParams(nextSearchParams)
    } else updatePair(nextIn, nextOut)
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

  const onChangeInvertedRate = (val: string) => {
    if (currencyIn) {
      onSetRate('', val)
    }
  }

  useEffect(() => {
    if (!priceInputRequest || appliedPriceInputRequestId.current === priceInputRequest.id) return

    appliedPriceInputRequestId.current = priceInputRequest.id
    onSetRate(priceInputRequest.rate, priceInputRequest.invertRate)
  }, [onSetRate, priceInputRequest])

  const setPriceRateMarket = useCallback(
    (autoFillInput = false) => {
      try {
        !autoFillInput && limitOrderTracking.trackFormSetPriceClick()
        if ((loadingTrade && !autoFillInput) || !tradeInfo) return
        const marketRate = formatPriceInputValue(tradeInfo.marketRate)
        onSetRate(marketRate, formatPriceInputValue(tradeInfo.invertRate))
        if (!autoFillInput) {
          limitOrderTracking.trackFormMarketPriceSet({
            currencyIn,
            currencyOut,
            limitPrice: marketRate,
            chain: networkInfo.name,
          })
        }
      } catch (error) {}
    },
    [currencyIn, currencyOut, limitOrderTracking, loadingTrade, networkInfo.name, onSetRate, tradeInfo],
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

  /** Carries the amounts and the rate across as the two sides trade places. */
  const carryAcrossRotation = () => {
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

  const handleRotateClick = () => {
    limitOrderTracking.trackFormSideSelected({ currencyIn, currencyOut, chain: networkInfo.name })
    switchCurrency()
    carryAcrossRotation()
  }

  /**
   * Picking the asset the other side already holds — the very token, or its native or wrapped form —
   * turns the pair round as the rotate button does, then keeps the form the user picked: with WBNB to
   * buy, choosing BNB to sell leaves BNB sold and the previous sell token bought.
   */
  const handleInputSelect = (currency: Currency, resetRate = true) => {
    if (currencyIn && currencyOut && currency?.wrapped.equals(currencyOut.wrapped)) {
      setPair(currency, currencyIn)
      carryAcrossRotation()
      return
    }
    setCurrencyIn(currency)
    resetRate && clearRate()
  }

  const handleOutputSelect = (currency: Currency) => {
    if (currencyIn && currencyOut && currency?.wrapped.equals(currencyIn.wrapped)) {
      setPair(currencyOut, currency)
      carryAcrossRotation()
      return
    }
    setCurrencyOut(currency)
    clearRate()
  }

  const toggleDatePicker = () => {
    setShowDatePicker(showDatePicker => !showDatePicker)
  }

  const onChangeExpire = (val: Date | number) => {
    const previousExpiry = displayTime
    if (typeof val === 'number') {
      setExpire(val)
      setCustomDateExpire(undefined)
      limitOrderTracking.trackFormChooseDate()
      limitOrderTracking.trackFormExpiryChanged({
        previousExpiry,
        newExpiry: formatTimeDuration(val),
        customExpiryMinutes: null,
        chain: networkInfo.name,
      })
    } else {
      setCustomDateExpire(val)
      limitOrderTracking.trackFormExpiryChanged({
        previousExpiry,
        newExpiry: 'custom',
        customExpiryMinutes: Math.round((val.getTime() - Date.now()) / 60000),
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
    onChangeInvertedRate,
    handleInputSelect,
    handleOutputSelect,
    handleRotateClick,
    toggleDatePicker,
    onChangeExpire,
    onResetForm,
    setPriceRateMarket,
  }
}
