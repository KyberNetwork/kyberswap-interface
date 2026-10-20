import { Currency } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { calcOutput } from 'components/LimitOrder/utils'
import { useStopMarketOraclePrice } from 'components/StopMarket/hooks/useStopMarketOraclePrice'
import { useStopMarketSlippageOptions } from 'components/StopMarket/hooks/useStopMarketSlippageOptions'
import { formatTriggerPriceValue, getStopMarketPairKey } from 'components/StopMarket/utils'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { resetStopMarketForm, updateStopMarketForm } from 'state/stopMarket/reducer'
import { updateStopMarketSlippage } from 'state/user/actions'
import { formatTimeDuration } from 'utils/time'

export type UseStopMarketFormStateProps = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}

/** A custom date is absolute; a preset counts `expire` seconds on from `start`. */
const resolveExpiredAt = (start: number, expire: number, customDateExpire: Date | undefined) =>
  customDateExpire?.getTime() || start + expire * 1000

/**
 * Owns everything on the stop market order card except the tokens and sell amount, which come from the shared
 * swap state so switching between Swap, Limit and Stop Market keeps them. The card's own inputs live in
 * the store for the same reason — see `state/stopMarket/reducer`.
 */
export const useStopMarketFormState = ({ currencyIn, currencyOut }: UseStopMarketFormStateProps) => {
  const { chainId } = useActiveWeb3React()
  const { inputAmount } = useLimitState()
  const { setCurrencyIn, setCurrencyOut, setPair, setInputValue, switchCurrency } = useLimitActionHandlers()

  const dispatch = useAppDispatch()
  const {
    triggerPrice: storedTriggerPrice,
    triggerPair,
    slippage: stagedSlippage,
    expire,
    customDateExpire: customDateExpireMs,
  } = useAppSelector(s => s.stopMarket)

  const { defaultSlippage, slippagePresets, getSlippageStatus } = useStopMarketSlippageOptions(chainId)
  // A recreated order's own slippage first, then what the user last picked, then the pair's suggestion.
  const pickedSlippage = useAppSelector(s => s.user.stopMarketSlippage)
  const slippage = stagedSlippage ?? pickedSlippage ?? defaultSlippage
  const slippageStatus = getSlippageStatus(slippage)
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
        ? getStopMarketPairKey(chainId, currencyIn.wrapped.address, currencyOut.wrapped.address)
        : undefined,
    [chainId, currencyIn, currencyOut],
  )
  const triggerPrice = pairKey && triggerPair === pairKey ? storedTriggerPrice : ''

  const setTriggerPrice = useCallback(
    (value: string) => dispatch(updateStopMarketForm({ triggerPrice: value, triggerPair: pairKey })),
    [dispatch, pairKey],
  )
  /**
   * Kept for later orders and visits. Picking the suggestion itself clears the pick instead, so the
   * slippage goes on following the pair rather than freezing one pair's suggestion for every other.
   */
  const setSlippage = useCallback(
    (value: number) => {
      dispatch(updateStopMarketForm({ slippage: undefined }))
      dispatch(updateStopMarketSlippage({ stopMarketSlippage: value === defaultSlippage ? undefined : value }))
    },
    [dispatch, defaultSlippage],
  )

  // Panel open/closed is presentation, not part of the order, so it stays with the component.
  const [expiryExpanded, setExpiryExpanded] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // USD prices still back the "≈ $" figures, but the trigger is compared against the oracle feed the
  // service evaluates, so the two must not be conflated.
  const { tradeInfo } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)
  const { priceNumber: marketPrice, isLoading: loadingMarketPrice } = useStopMarketOraclePrice(
    currencyIn,
    currencyOut,
    chainId,
  )

  /**
   * The pair is set but its feed gave no usable price — the request failed, or the pair has no feed.
   * The form then cannot show where the trigger sits against the market, so placing waits for it.
   */
  const marketPriceUnavailable = !!pairKey && !loadingMarketPrice && !marketPrice

  /**
   * How far the trigger sits from the market price, negative below it and positive above. Any side is a
   * valid order: the trigger fires once the oracle is at or under it, and the fill must still clear
   * `trigger × (1 − slippage)`, so a trigger above the market waits for the price to rise to that floor.
   */
  const triggerPercent = useMemo(() => {
    const price = Number(triggerPrice)
    if (!marketPrice || !price || !Number.isFinite(price)) return undefined
    return ((price - marketPrice) / marketPrice) * 100
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
      setTriggerPrice(formatTriggerPriceValue(marketPrice * (1 + parsed / 100)))
    },
    [marketPrice, setTriggerPrice],
  )

  const onSetMarketPrice = useCallback(() => {
    if (marketPrice) setTriggerPrice(formatTriggerPriceValue(marketPrice))
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
    if (!triggerPrice) setTriggerPrice(formatTriggerPriceValue(marketPrice))
  }, [pairKey, marketPrice, loadingMarketPrice, triggerPrice, setTriggerPrice])

  const onChangeExpire = useCallback(
    (value: Date | number) => {
      dispatch(
        value instanceof Date
          ? updateStopMarketForm({ customDateExpire: value.getTime() })
          : updateStopMarketForm({ customDateExpire: undefined, expire: value }),
      )
    },
    [dispatch],
  )

  const onResetForm = useCallback(() => {
    setInputValue('')
    dispatch(resetStopMarketForm())
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
   * the estimate becomes the amount. The trigger does not carry over — it is a price in the other
   * direction's units — and needs no clearing here: it was set for the other direction, so the
   * reversed pair reads it as empty and reseeds from its own feed.
   */
  const onSwitchPair = useCallback(() => {
    switchCurrency()
    setInputValue(estimatedOutput)
  }, [switchCurrency, setInputValue, estimatedOutput])

  /**
   * Picking the asset the other side already holds — the very token, or its native or wrapped form —
   * turns the pair round as the switch button does, amount included, and keeps the form the user
   * picked: with WBNB to receive, choosing BNB to sell leaves BNB sold and the previous sell token
   * received. Both sides are set in one step, since each single-side setter would undo the other.
   */
  const onSelectCurrencyIn = useCallback(
    (currency: Currency) => {
      if (currencyIn && currencyOut && currency.wrapped.equals(currencyOut.wrapped)) {
        setPair(currency, currencyIn)
        setInputValue(estimatedOutput)
        return
      }
      setCurrencyIn(currency)
    },
    [currencyIn, currencyOut, setPair, setCurrencyIn, setInputValue, estimatedOutput],
  )

  const onSelectCurrencyOut = useCallback(
    (currency: Currency) => {
      if (currencyIn && currencyOut && currency.wrapped.equals(currencyIn.wrapped)) {
        setPair(currencyOut, currency)
        setInputValue(estimatedOutput)
        return
      }
      setCurrencyOut(currency)
    },
    [currencyIn, currencyOut, setPair, setCurrencyOut, setInputValue, estimatedOutput],
  )

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
