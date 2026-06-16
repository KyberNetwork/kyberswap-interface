import { ChainId, Currency, CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCreateOrderMutation, useGetLOConfigQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'

import { NotificationType } from 'components/Announcement/type'
import { getTipLinkAttribution } from 'components/TipLinkGeneratorModal/shared'
import type { DeltaRateLimitOrder } from 'components/swapv2/LimitOrder/Form/DeltaRate'
import { SummaryNotifyOrderPlaced } from 'components/swapv2/LimitOrder/ListOrder/SummaryNotify'
import {
  calcUsdPrices,
  formatAmountOrder,
  getErrorMessage,
  getPayloadCreateOrder,
  removeTrailingZero,
} from 'components/swapv2/LimitOrder/helpers'
import useSignOrder from 'components/swapv2/LimitOrder/hooks/useSignOrder'
import useValidateInputError from 'components/swapv2/LimitOrder/hooks/useValidateInputError'
import useWarningCreateOrder from 'components/swapv2/LimitOrder/hooks/useWarningCreateOrder'
import useWrapEthStatus from 'components/swapv2/LimitOrder/hooks/useWrapEthStatus'
import { CreateOrderParam, LimitOrder, RateInfo } from 'components/swapv2/LimitOrder/type'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useTokenAllowance } from 'data/Allowances'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import type { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useWrapCallback from 'hooks/useWrapCallback'
import { useNotify } from 'state/application/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { getCookieValue } from 'utils'
import { subscribeNotificationOrderCancelled, subscribeNotificationOrderExpired } from 'utils/firebase'
import { maxAmountSpend } from 'utils/maxAmountSpend'

type UseLimitOrderExecutionArgs = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  defaultActiveMakingAmount?: string
  defaultInputAmount: string
  defaultRate: RateInfo
  defaultExpire?: Date
  orderInfo?: LimitOrder
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
  isEdit: boolean
  chainId: ChainId
  networkName: string
  searchParams: URLSearchParams
  inputAmount: string
  outputAmount: string
  displayRate: string
  expiredAt: number
  displayTime: string
  rateInfo: RateInfo
  tradeInfo: BaseTradeInfo | undefined
  deltaRate: DeltaRateLimitOrder
  onSetInput: (input: string) => void
  onResetForm: () => void
  switchToWeth: () => void
}

const getTokenAddress = (currency: Currency | undefined) => (currency?.isNative ? 'NATIVE' : currency?.wrapped?.address)

export default function useLimitOrderExecution({
  currencyIn,
  currencyOut,
  defaultActiveMakingAmount = '',
  defaultInputAmount,
  defaultRate,
  defaultExpire,
  orderInfo,
  setFlowState,
  isEdit,
  chainId,
  networkName,
  searchParams,
  inputAmount,
  outputAmount,
  displayRate,
  expiredAt,
  displayTime,
  rateInfo,
  tradeInfo,
  deltaRate,
  onSetInput,
  onResetForm,
  switchToWeth,
}: UseLimitOrderExecutionArgs) {
  const { account } = useActiveWeb3React()
  const notify = useNotify()
  const { trackingHandler } = useTracking()
  const { ordersNeedCreated } = useLimitState()
  const { removeOrderNeedCreated, setOrderEditing } = useLimitActionHandlers()
  const [approvalSubmitted, setApprovalSubmitted] = useState(false)

  // Balances, allowance, and form readiness.
  const { data: activeOrderMakingAmount = defaultActiveMakingAmount, refetch: getActiveMakingAmount } =
    useGetTotalActiveMakingAmountQuery(
      { chainId, tokenAddress: currencyIn?.wrapped.address ?? '', account: account ?? '' },
      { skip: !currencyIn || !account },
    )

  const { execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencyIn,
    currencyOut,
    inputAmount,
    true,
    chainId,
  )
  const showWrap = !!currencyIn?.isNative

  const { isWrappingEth, setTxHashWrapped } = useWrapEthStatus(switchToWeth)

  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  const { currentData } = useGetLOConfigQuery(chainId)
  const limitOrderContract = currentData?.contract

  const currentAllowance = useTokenAllowance(
    currencyIn as Token,
    account ?? undefined,
    limitOrderContract,
  ) as CurrencyAmount<Currency>

  const parsedActiveOrderMakingAmount = useMemo(() => {
    try {
      if (currencyIn && activeOrderMakingAmount) {
        if (currencyIn.isNative) {
          return TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(0))
        }
        const value = TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(activeOrderMakingAmount))
        if (isEdit && orderInfo) {
          const makingAmount = TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(orderInfo.makingAmount))
          return value.greaterThan(makingAmount)
            ? value.subtract(makingAmount)
            : TokenAmount.fromRawAmount(currencyIn, 0)
        }
        return value
      }
    } catch (error) {}
    return undefined
  }, [currencyIn, activeOrderMakingAmount, isEdit, orderInfo])

  const balance = useCurrencyBalance(currencyIn, chainId)
  const maxAmountInput = useMemo(() => {
    return maxAmountSpend(balance)
  }, [balance])

  const handleMaxInput = useCallback(() => {
    if (!maxAmountInput) return
    try {
      onSetInput(maxAmountInput.toExact())
    } catch (error) {}
  }, [maxAmountInput, onSetInput])

  const missingAllowance = useMemo(() => {
    if (currentAllowance?.equalTo(0)) return true
    if (currencyIn?.isNative || !parseInputAmount) return false
    const allowanceSubtracted = parsedActiveOrderMakingAmount
      ? currentAllowance?.subtract(parsedActiveOrderMakingAmount)
      : undefined
    if (
      !allowanceSubtracted ||
      allowanceSubtracted.greaterThan(parseInputAmount) ||
      allowanceSubtracted.equalTo(parseInputAmount)
    )
      return false
    return parseInputAmount.subtract(allowanceSubtracted)
  }, [currencyIn?.isNative, currentAllowance, parseInputAmount, parsedActiveOrderMakingAmount])

  const enoughAllowance = !missingAllowance

  const [approval, approveCallback] = useApproveCallback(
    parseInputAmount,
    limitOrderContract || undefined,
    !enoughAllowance,
  )

  const { inputError, outPutError } = useValidateInputError({
    inputAmount,
    outputAmount,
    balance,
    displayRate,
    parsedActiveOrderMakingAmount: undefined,
    currencyIn,
    wrapInputError,
    showWrap,
    currencyOut,
  })

  const hasInputError = Boolean(inputError || outPutError)
  const checkingAllowance =
    !(currencyIn && parsedActiveOrderMakingAmount?.currency?.equals(currencyIn)) ||
    !(currencyIn && currentAllowance?.currency?.equals(currencyIn))

  const isNotFillAllInput = [outputAmount, inputAmount, currencyIn, currencyOut, displayRate].some(e => !e)

  const estimateUSD = useMemo(() => {
    return calcUsdPrices({
      inputAmount,
      outputAmount,
      priceUsdIn: tradeInfo?.priceUsdIn,
      priceUsdOut: tradeInfo?.priceUsdOut,
      currencyIn,
      currencyOut,
    })
  }, [inputAmount, outputAmount, tradeInfo, currencyIn, currencyOut])

  const showApproveFlow =
    !checkingAllowance &&
    !showWrap &&
    !isNotFillAllInput &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      !enoughAllowance ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const warningMessage = useWarningCreateOrder({
    estimateUSD: estimateUSD.rawInput,
    currencyIn,
    outputAmount,
    displayRate,
    deltaRate,
    missingAllowance,
  })

  // User-facing actions.
  const trackingTouchInput = useCallback(() => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter amount box')
  }, [trackingHandler])

  const trackingPriceSetOnBlur = useCallback(() => {
    if (!displayRate || !currencyIn || !currencyOut) return
    trackingHandler(TRACKING_EVENT_TYPE.LO_PRICE_SET, {
      side: rateInfo.invert ? 'buy' : 'sell',
      limit_price: displayRate,
      market_price: tradeInfo ? removeTrailingZero(tradeInfo.marketRate.toFixed(16)) : undefined,
      price_difference_pct: deltaRate.rawPercent ? Number(deltaRate.rawPercent) : undefined,
      from_token: currencyIn.symbol,
      to_token: currencyOut.symbol,
      chain: networkName,
    })
  }, [
    displayRate,
    currencyIn,
    currencyOut,
    rateInfo.invert,
    tradeInfo,
    deltaRate.rawPercent,
    networkName,
    trackingHandler,
  ])

  const trackingTouchSelectToken = useCallback(() => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter token box')
  }, [trackingHandler])

  const showPreview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return
    setFlowState({ ...TRANSACTION_STATE_DEFAULT, showConfirm: true })
    if (!isEdit) {
      trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_REVIEW_PLACE_ORDER, {
        from_token: currencyIn.symbol,
        to_token: currencyOut.symbol,
        from_network: chainId,
        trade_qty: inputAmount,
      })
      trackingHandler(TRACKING_EVENT_TYPE.LO_REVIEW_OPENED, {
        side: rateInfo.invert ? 'buy' : 'sell',
        from_token: currencyIn.symbol,
        from_token_address: getTokenAddress(currencyIn),
        to_token: currencyOut.symbol,
        to_token_address: getTokenAddress(currencyOut),
        pair: `${currencyIn.symbol}/${currencyOut.symbol}`,
        limit_price: displayRate,
        amount_in: inputAmount,
        amount_in_usd: estimateUSD.rawInput || undefined,
        amount_out_estimated: outputAmount,
        expiry: displayTime,
        market_price: tradeInfo ? removeTrailingZero(tradeInfo.marketRate.toFixed(16)) : undefined,
        price_difference_pct: deltaRate.rawPercent ? Number(deltaRate.rawPercent) : undefined,
        chain: networkName,
      })
    }
  }

  const hidePreview = useCallback(() => {
    setFlowState(state => ({ ...state, showConfirm: false }))
  }, [setFlowState])

  const handleError = useCallback(
    (error: any) => {
      const errorMessage = getErrorMessage(error)
      const isUserRejected =
        errorMessage.toLowerCase().includes('user denied') || errorMessage.toLowerCase().includes('user rejected')
      trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_FAILED, {
        side: rateInfo.invert ? 'buy' : 'sell',
        from_token: currencyIn?.symbol,
        to_token: currencyOut?.symbol,
        pair: currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
        limit_price: displayRate,
        amount_in: inputAmount,
        error_type: isUserRejected ? 'user_rejected' : 'tx_failed',
        error_message: errorMessage,
        chain: networkName,
      })
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage,
      }))
    },
    [setFlowState, trackingHandler, rateInfo.invert, currencyIn, currencyOut, displayRate, inputAmount, networkName],
  )

  const refreshActiveMakingAmount = useCallback(() => {
    try {
      getActiveMakingAmount()
    } catch (error) {}
  }, [getActiveMakingAmount])

  const resetForm = useCallback(() => {
    onResetForm()
    refreshActiveMakingAmount()
  }, [onResetForm, refreshActiveMakingAmount])

  const onWrapToken = async () => {
    try {
      if (isNotFillAllInput || wrapInputError || isWrappingEth || hasInputError) return
      const amount = formatAmountOrder(inputAmount)
      const wethSymbol = WETH[chainId].symbol
      const inSymbol = currencyIn?.symbol
      setFlowState(state => ({
        ...state,
        attemptingTxn: true,
        showConfirm: true,
        pendingText: t`Wrapping ${amount} ${inSymbol} to ${amount} ${wethSymbol}`,
      }))
      const hash = await onWrap?.()
      if (hash) setTxHashWrapped(hash)
      setFlowState(state => ({ ...state, showConfirm: false }))
    } catch (error) {
      handleError(error)
    }
  }

  const trackingPlaceOrder = useCallback(
    (type: TRACKING_EVENT_TYPE, data = {}) => {
      trackingHandler(type, {
        from_token: currencyIn?.symbol,
        to_token: currencyOut?.symbol,
        from_network: networkName,
        trade_qty: inputAmount,
        ...data,
      })
    },
    [currencyIn?.symbol, currencyOut?.symbol, inputAmount, networkName, trackingHandler],
  )

  const signOrder = useSignOrder(setFlowState)
  const [submitOrder] = useCreateOrderMutation()
  const onSubmitCreateOrder = useCallback(
    async (params: CreateOrderParam) => {
      try {
        const { currencyIn, currencyOut, account, inputAmount, outputAmount, expiredAt } = params
        if (!currencyIn || !currencyOut || !account || !inputAmount || !outputAmount || !expiredAt) {
          throw new Error('wrong input')
        }

        const refCode = getCookieValue('refCode')
        const clientId = searchParams.get('clientId')

        const { signature, salt } = await signOrder({ ...params, referral: refCode })
        const payload = getPayloadCreateOrder(params)
        setFlowState(state => ({ ...state, pendingText: t`Placing order` }))
        const response = await submitOrder({ ...payload, salt, signature, referral: refCode, clientId }).unwrap()
        setFlowState(state => ({ ...state, showConfirm: false }))

        notify(
          {
            type: NotificationType.SUCCESS,
            title: t`Order Placed`,
            summary: <SummaryNotifyOrderPlaced {...{ currencyIn, currencyOut, inputAmount, outputAmount }} />,
          },
          10000,
        )
        resetForm()
        return response?.id
      } catch (error) {
        handleError(error)
        return
      }
    },
    [handleError, notify, resetForm, searchParams, setFlowState, signOrder, submitOrder],
  )

  const onSubmitCreateOrderWithTracking = async () => {
    trackingPlaceOrder(TRACKING_EVENT_TYPE.LO_CLICK_PLACE_ORDER)
    const order_id = await onSubmitCreateOrder({
      currencyIn,
      currencyOut,
      chainId,
      account,
      inputAmount,
      outputAmount,
      expiredAt,
      nativeOutput: currencyOut?.isNative || false,
    })
    if (!order_id) return

    trackingPlaceOrder(TRACKING_EVENT_TYPE.LO_PLACE_ORDER_SUCCESS, { order_id })
    trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_PLACED, {
      side: rateInfo.invert ? 'buy' : 'sell',
      from_token: currencyIn?.symbol,
      from_token_address: getTokenAddress(currencyIn),
      to_token: currencyOut?.symbol,
      to_token_address: getTokenAddress(currencyOut),
      pair: currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
      limit_price: displayRate,
      market_price: tradeInfo ? removeTrailingZero(tradeInfo.marketRate.toFixed(16)) : undefined,
      price_difference_pct: deltaRate.rawPercent ? Number(deltaRate.rawPercent) : undefined,
      amount_in: inputAmount,
      amount_in_usd: estimateUSD.rawInput || undefined,
      amount_out_estimated: outputAmount,
      expiry: displayTime,
      chain: networkName,
      order_id,
      volume: estimateUSD.rawInput || undefined,
    })

    const tipLink = getTipLinkAttribution(searchParams)
    if (tipLink) {
      trackingHandler(TRACKING_EVENT_TYPE.TIP_LINK_TRADE, {
        trade_type: 'limit_order',
        trade_status: 'placed',
        tip_charged: false,
        ...tipLink,
        input_token: currencyIn?.symbol,
        output_token: currencyOut?.symbol,
        input_token_address: getTokenAddress(currencyIn),
        output_token_address: getTokenAddress(currencyOut),
        pair: currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
        chain: networkName,
        chain_id: chainId,
        volume: estimateUSD.rawInput || undefined,
        order_id,
      })
    }
  }

  // External state synchronization.
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval])

  useEffect(() => {
    if (!isEdit || !orderInfo?.id) return
    setOrderEditing({
      orderId: orderInfo.id,
      account,
      chainId,
      currencyIn,
      currencyOut,
      inputAmount,
      outputAmount,
      expiredAt,
      nativeOutput: currencyOut?.isNative || false,
    })
  }, [
    setOrderEditing,
    account,
    chainId,
    currencyIn,
    currencyOut,
    inputAmount,
    outputAmount,
    expiredAt,
    orderInfo?.id,
    isEdit,
  ])

  const refSubmitCreateOrder = useRef(onSubmitCreateOrder)
  refSubmitCreateOrder.current = onSubmitCreateOrder

  useEffect(() => {
    if (!account) return
    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, data => {
      data?.orders.forEach(order => {
        const findInfo = ordersNeedCreated.find(e => e.orderId === order.id)
        if (!findInfo?.orderId) return
        removeOrderNeedCreated(findInfo.orderId)
        if (order.isSuccessful && !isEdit) {
          refSubmitCreateOrder.current(findInfo)
        }
      })
      refreshActiveMakingAmount()
    })
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, refreshActiveMakingAmount)
    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
    }
  }, [account, chainId, ordersNeedCreated, removeOrderNeedCreated, refreshActiveMakingAmount, isEdit])

  const hasChangedOrderInfo = useCallback(() => {
    return (
      isEdit &&
      !hasInputError &&
      (defaultInputAmount !== inputAmount ||
        defaultRate?.rate !== rateInfo.rate ||
        defaultExpire?.getTime() !== expiredAt)
    )
  }, [
    defaultExpire,
    defaultInputAmount,
    defaultRate?.rate,
    expiredAt,
    hasInputError,
    inputAmount,
    isEdit,
    rateInfo.rate,
  ])

  return {
    approval,
    approvalSubmitted,
    approveCallback,
    checkingAllowance,
    enoughAllowance,
    estimateUSD,
    handleMaxInput,
    hasChangedOrderInfo,
    hasInputError,
    hidePreview,
    inputError,
    isNotFillAllInput,
    isWrappingEth,
    onSubmitCreateOrderWithTracking,
    onWrapToken,
    outPutError,
    showApproveFlow,
    showPreview,
    showWrap,
    trackingPriceSetOnBlur,
    trackingTouchInput,
    trackingTouchSelectToken,
    warningMessage,
    wrapInputError,
  }
}
