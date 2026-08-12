import { Currency } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { calcOutput, formatPriceInputValue } from 'components/LimitOrder/utils'
import { useStopLossOraclePrice } from 'components/StopLoss/hooks/useStopLossOraclePrice'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { resetStopLossForm, updateStopLossForm } from 'state/stopLoss/reducer'
import { formatTimeDuration } from 'utils/time'

export type UseStopLossFormStateProps = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}

/**
 * Owns everything on the stop-loss card except the tokens and sell amount, which come from the shared
 * swap state so switching between Swap, Limit and Stop Loss keeps them. The card's own inputs live in
 * the store for the same reason — see `state/stopLoss/reducer`.
 */
export const useStopLossFormState = ({ currencyIn, currencyOut }: UseStopLossFormStateProps) => {
  const { chainId } = useActiveWeb3React()
  const { inputAmount } = useLimitState()
  const { setCurrencyIn, setCurrencyOut, setInputValue } = useLimitActionHandlers()

  const dispatch = useAppDispatch()
  const { triggerPrice, slippage, expire, customDateExpire: customDateExpireMs } = useAppSelector(s => s.stopLoss)
  const customDateExpire = useMemo(
    () => (customDateExpireMs === undefined ? undefined : new Date(customDateExpireMs)),
    [customDateExpireMs],
  )

  const setTriggerPrice = useCallback(
    (value: string) => dispatch(updateStopLossForm({ triggerPrice: value })),
    [dispatch],
  )
  const setSlippage = useCallback((value: number) => dispatch(updateStopLossForm({ slippage: value })), [dispatch])

  // Panel open/closed is presentation, not part of the order, so it stays with the component.
  const [expiryExpanded, setExpiryExpanded] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // USD prices still back the "≈ $" figures, but the trigger is compared against the oracle feed the
  // service evaluates, so the two must not be conflated.
  const { tradeInfo } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)
  const { priceNumber: marketPrice, isLoading: loadingMarketPrice } = useStopLossOraclePrice(
    currencyIn,
    currencyOut,
    chainId,
  )

  /** How far the trigger sits below the market price, negative while it is a valid stop-loss. */
  const triggerPercent = useMemo(() => {
    const price = Number(triggerPrice)
    if (!marketPrice || !price || !Number.isFinite(price)) return undefined
    return ((price - marketPrice) / marketPrice) * 100
  }, [triggerPrice, marketPrice])

  /**
   * The seed and the Market button both fill the field with the price rounded to the input's own
   * precision, which lands a hair either side of the live price. Comparing against the lower of the
   * two keeps a trigger set to market on the blocked side of the rule whichever way it rounded.
   */
  const triggerAtOrAboveMarket = useMemo(() => {
    const price = Number(triggerPrice)
    if (!marketPrice || !price || !Number.isFinite(price)) return false
    return price >= Math.min(marketPrice, Number(formatPriceInputValue(marketPrice)))
  }, [triggerPrice, marketPrice])

  const onChangeTriggerPrice = setTriggerPrice

  /** The percent chip is the same value from the other side, so typing in it drives the price. */
  const onChangeTriggerPercent = useCallback(
    (percent: string) => {
      const parsed = Number(percent)
      if (!marketPrice || !Number.isFinite(parsed)) {
        setTriggerPrice('')
        return
      }
      setTriggerPrice(formatPriceInputValue(marketPrice * (1 + parsed / 100)))
    },
    [marketPrice, setTriggerPrice],
  )

  const onSetMarketPrice = useCallback(() => {
    if (marketPrice) setTriggerPrice(formatPriceInputValue(marketPrice))
  }, [marketPrice, setTriggerPrice])

  /**
   * Seeds the trigger with the market price once the feed has resolved, so the field opens with a
   * usable figure instead of blank. Skipped whenever a price is already held: the poll must not
   * overwrite what the user typed, and Recreate stages a past order's trigger before this runs.
   */
  const autoFilledTrigger = useRef(false)
  useEffect(() => {
    if (!marketPrice || loadingMarketPrice || autoFilledTrigger.current) return
    autoFilledTrigger.current = true
    if (!triggerPrice) setTriggerPrice(formatPriceInputValue(marketPrice))
  }, [marketPrice, loadingMarketPrice, triggerPrice, setTriggerPrice])

  const onChangeExpire = useCallback(
    (value: Date | number) => {
      dispatch(
        value instanceof Date
          ? updateStopLossForm({ customDateExpire: value.getTime() })
          : updateStopLossForm({ customDateExpire: undefined, expire: value }),
      )
    },
    [dispatch],
  )

  const onSelectCurrencyIn = useCallback(
    (currency: Currency) => {
      // Picking the token already on the other side swaps them rather than leaving a same-token pair.
      if (currencyOut && currency.equals(currencyOut)) setCurrencyOut(currencyIn)
      setCurrencyIn(currency)
      setTriggerPrice('')
      // The new pair prices differently, so it gets its own seed once its feed resolves.
      autoFilledTrigger.current = false
    },
    [currencyIn, currencyOut, setCurrencyIn, setCurrencyOut, setTriggerPrice],
  )

  const onSelectCurrencyOut = useCallback(
    (currency: Currency) => {
      if (currencyIn && currency.equals(currencyIn)) setCurrencyIn(currencyOut)
      setCurrencyOut(currency)
      setTriggerPrice('')
      autoFilledTrigger.current = false
    },
    [currencyIn, currencyOut, setCurrencyIn, setCurrencyOut, setTriggerPrice],
  )

  const onResetForm = useCallback(() => {
    setInputValue('')
    dispatch(resetStopLossForm())
    // A cleared trigger is eligible for the market seed again on the next feed tick.
    autoFilledTrigger.current = false
  }, [setInputValue, dispatch])

  /**
   * Output at the trigger price, before fees. Not a floor: the fill tracks the oracle price at
   * execution, so a market that gaps through the trigger settles lower than this.
   */
  const estimatedOutput = useMemo(
    () =>
      inputAmount && triggerPrice && currencyOut ? calcOutput(inputAmount, triggerPrice, currencyOut.decimals) : '',
    [inputAmount, triggerPrice, currencyOut],
  )

  // Anchored to the moment the expiry was chosen. Reading the clock on every render would give this a
  // new value each time, which cascades into anything memoised on it.
  const expiredAt = useMemo(() => customDateExpire?.getTime() || Date.now() + expire * 1000, [customDateExpire, expire])
  const displayTime = customDateExpire ? dayjs(customDateExpire).format('DD/MM/YYYY HH:mm') : formatTimeDuration(expire)

  return {
    chainId,
    inputAmount,
    triggerPrice,
    triggerPercent,
    triggerAtOrAboveMarket,
    marketPrice,
    loadingMarketPrice,
    tradeInfo,
    estimatedOutput,
    slippage,
    expire,
    customDateExpire,
    expiryExpanded,
    showDatePicker,
    expiredAt,
    displayTime,
    setSlippage,
    setInputValue,
    setExpiryExpanded,
    toggleDatePicker: useCallback(() => setShowDatePicker(value => !value), []),
    onChangeTriggerPrice,
    onChangeTriggerPercent,
    onSetMarketPrice,
    onChangeExpire,
    onSelectCurrencyIn,
    onSelectCurrencyOut,
    onResetForm,
  }
}
