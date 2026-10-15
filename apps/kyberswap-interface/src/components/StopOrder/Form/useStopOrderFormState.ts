import { Currency } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { calcOutput, formatPriceInputValue } from 'components/LimitOrder/utils'
import { STOP_ORDER_SLIPPAGE_MULTIPLIER } from 'components/StopOrder/constants'
import { useStopOrderOraclePrice } from 'components/StopOrder/hooks/useStopOrderOraclePrice'
import { getStopOrderPairKey } from 'components/StopOrder/utils'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOLATILITY, PAIR_CATEGORY } from 'constants/trade'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { resetStopOrderForm, updateStopOrderForm } from 'state/stopOrder/reducer'
import { useDefaultSlippageByPair, usePairCategory } from 'state/swap/hooks'
import { checkRangeSlippage } from 'utils/slippage'
import { formatTimeDuration } from 'utils/time'

export type UseStopOrderFormStateProps = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}

/** A custom date is absolute; a preset counts `expire` seconds on from `start`. */
const resolveExpiredAt = (start: number, expire: number, customDateExpire: Date | undefined) =>
  customDateExpire?.getTime() || start + expire * 1000

/**
 * Owns everything on the stop order card except the tokens and sell amount, which come from the shared
 * swap state so switching between Swap, Limit and Stop Order keeps them. The card's own inputs live in
 * the store for the same reason — see `state/stopOrder/reducer`.
 */
export const useStopOrderFormState = ({ currencyIn, currencyOut }: UseStopOrderFormStateProps) => {
  const { chainId } = useActiveWeb3React()
  const { inputAmount } = useLimitState()
  const { setCurrencyIn, setCurrencyOut, setInputValue, switchCurrency } = useLimitActionHandlers()

  const dispatch = useAppDispatch()
  const {
    triggerPrice: storedTriggerPrice,
    triggerPair,
    slippage: pickedSlippage,
    expire,
    customDateExpire: customDateExpireMs,
  } = useAppSelector(s => s.stopOrder)

  // The swap form's suggestion, presets and warning bands for this pair's category, each scaled by the
  // same multiplier so the stop order stays in step with swap as either changes.
  const pairCategory = usePairCategory(chainId)
  const defaultSlippage = useDefaultSlippageByPair(chainId) * STOP_ORDER_SLIPPAGE_MULTIPLIER
  const slippage = pickedSlippage ?? defaultSlippage
  const slippagePresets = useMemo(
    () =>
      (pairCategory === PAIR_CATEGORY.HIGH_VOLATILITY ? DEFAULT_SLIPPAGES_HIGH_VOLATILITY : DEFAULT_SLIPPAGES).map(
        preset => preset * STOP_ORDER_SLIPPAGE_MULTIPLIER,
      ),
    [pairCategory],
  )
  // Scaling the value down against swap's bands is the same as scaling the bands up.
  const slippageStatus = checkRangeSlippage(slippage / STOP_ORDER_SLIPPAGE_MULTIPLIER, pairCategory)
  const customDateExpire = useMemo(
    () => (customDateExpireMs === undefined ? undefined : new Date(customDateExpireMs)),
    [customDateExpireMs],
  )

  /**
   * A trigger is a price in one pair's terms, so it only stands while that pair is on screen. Every way
   * the pair can change — the token pickers and the switch button, but also a network switch, a link
   * from another page or a token picked on Swap — leaves a stored trigger for some other pair, which is
   * read as empty and reseeded from this pair's feed.
   */
  const pairKey = useMemo(
    () =>
      currencyIn && currencyOut
        ? getStopOrderPairKey(chainId, currencyIn.wrapped.address, currencyOut.wrapped.address)
        : undefined,
    [chainId, currencyIn, currencyOut],
  )
  const triggerPrice = pairKey && triggerPair === pairKey ? storedTriggerPrice : ''

  const setTriggerPrice = useCallback(
    (value: string) => dispatch(updateStopOrderForm({ triggerPrice: value, triggerPair: pairKey })),
    [dispatch, pairKey],
  )
  const setSlippage = useCallback((value: number) => dispatch(updateStopOrderForm({ slippage: value })), [dispatch])

  // Panel open/closed is presentation, not part of the order, so it stays with the component.
  const [expiryExpanded, setExpiryExpanded] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // USD prices still back the "≈ $" figures, but the trigger is compared against the oracle feed the
  // service evaluates, so the two must not be conflated.
  const { tradeInfo } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)
  const { priceNumber: marketPrice, isLoading: loadingMarketPrice } = useStopOrderOraclePrice(
    currencyIn,
    currencyOut,
    chainId,
  )

  /**
   * The pair is set but its feed gave no usable price — the request failed, or the pair has no feed.
   * Nothing can then tell a stop below the market from a trigger above it, which would sell at once.
   */
  const marketPriceUnavailable = !!pairKey && !loadingMarketPrice && !marketPrice

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

  /**
   * How far the trigger sits below the market price, negative while it is a valid stop order. A trigger
   * the rule above counts as at market reads 0 even when rounding left it a hair under the live price,
   * so no "below" figure ever sits next to the warning that blocks it for not being below.
   */
  const triggerPercent = useMemo(() => {
    const price = Number(triggerPrice)
    if (!marketPrice || !price || !Number.isFinite(price)) return undefined
    const percent = ((price - marketPrice) / marketPrice) * 100
    return triggerAtOrAboveMarket ? Math.max(percent, 0) : percent
  }, [triggerPrice, marketPrice, triggerAtOrAboveMarket])

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
   * Seeds the trigger with the market price once the pair's feed has resolved, so the field opens with
   * a usable figure instead of blank. Once per pair, and skipped whenever the pair already has a price:
   * the poll must not overwrite what the user typed, and Recreate stages a past order's trigger before
   * this runs. `marketPrice` is the current pair's own — the feed hook drops the previous pair's price
   * while the next one loads — so a seed never lands on the wrong pair.
   */
  const seededPair = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!pairKey || !marketPrice || loadingMarketPrice || seededPair.current === pairKey) return
    seededPair.current = pairKey
    if (!triggerPrice) setTriggerPrice(formatPriceInputValue(marketPrice))
  }, [pairKey, marketPrice, loadingMarketPrice, triggerPrice, setTriggerPrice])

  const onChangeExpire = useCallback(
    (value: Date | number) => {
      dispatch(
        value instanceof Date
          ? updateStopOrderForm({ customDateExpire: value.getTime() })
          : updateStopOrderForm({ customDateExpire: undefined, expire: value }),
      )
    },
    [dispatch],
  )

  const onSelectCurrencyIn = useCallback(
    (currency: Currency) => {
      // Picking the token already on the other side swaps them rather than leaving a same-token pair.
      if (currencyOut && currency.equals(currencyOut)) setCurrencyOut(currencyIn)
      setCurrencyIn(currency)
    },
    [currencyIn, currencyOut, setCurrencyIn, setCurrencyOut],
  )

  const onSelectCurrencyOut = useCallback(
    (currency: Currency) => {
      if (currencyIn && currency.equals(currencyIn)) setCurrencyIn(currencyOut)
      setCurrencyOut(currency)
    },
    [currencyIn, currencyOut, setCurrencyIn, setCurrencyOut],
  )

  const onResetForm = useCallback(() => {
    setInputValue('')
    dispatch(resetStopOrderForm())
    // A cleared trigger is eligible for the market seed again on the next feed tick.
    seededPair.current = undefined
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

  /**
   * Turns the pair around, as the limit-order form does: the receive token becomes the one sold, and
   * the estimate becomes the amount. The trigger does not carry over — inverted, it would sit above
   * the reversed market, a take-profit rather than a stop order — and needs no clearing here: it was
   * set for the other direction, so the reversed pair reads it as empty and reseeds from its own feed.
   */
  const onSwitchPair = useCallback(() => {
    switchCurrency()
    setInputValue(estimatedOutput)
  }, [switchCurrency, setInputValue, estimatedOutput])

  /**
   * A preset expiry counts from `expiryStart`, which `startExpiry` resets as each order goes to review:
   * every order gets its full window, and the review shows exactly the deadline that gets signed.
   * Reading the clock on every render instead would give `expiredAt` a new value each time, which
   * cascades into anything memoised on it.
   */
  const [expiryStart, setExpiryStart] = useState(Date.now)
  const expiredAt = useMemo(
    () => resolveExpiredAt(expiryStart, expire, customDateExpire),
    [expiryStart, expire, customDateExpire],
  )
  /** Returns the deadline it produces, for callers that need it before the next render. */
  const startExpiry = useCallback(() => {
    const now = Date.now()
    setExpiryStart(now)
    return resolveExpiredAt(now, expire, customDateExpire)
  }, [expire, customDateExpire])
  const displayTime = customDateExpire ? dayjs(customDateExpire).format('DD/MM/YYYY HH:mm') : formatTimeDuration(expire)

  return {
    chainId,
    inputAmount,
    triggerPrice,
    triggerPercent,
    triggerAtOrAboveMarket,
    marketPrice,
    loadingMarketPrice,
    marketPriceUnavailable,
    tradeInfo,
    estimatedOutput,
    slippage,
    defaultSlippage,
    slippagePresets,
    slippageStatus,
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
    startExpiry,
    onSelectCurrencyIn,
    onSelectCurrencyOut,
    onSwitchPair,
    onResetForm,
  }
}
