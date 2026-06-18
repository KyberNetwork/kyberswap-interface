import { ChainId, Currency, CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCreateOrderMutation, useGetLOConfigQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'

import { NotificationType } from 'components/Announcement/type'
import { getTipLinkAttribution } from 'components/TipLinkGeneratorModal/shared'
import type { DeltaRateLimitOrder } from 'components/swapv2/LimitOrder/Form/LimitOrderRateSection'
import { SummaryNotifyOrderPlaced } from 'components/swapv2/LimitOrder/ListOrder/SummaryNotify'
import {
  calcUsdPrices,
  getErrorMessage,
  getPayloadCreateOrder,
  removeTrailingZero,
} from 'components/swapv2/LimitOrder/helpers'
import useSignOrder from 'components/swapv2/LimitOrder/hooks/useSignOrder'
import useValidateInputError from 'components/swapv2/LimitOrder/hooks/useValidateInputError'
import useWarningCreateOrder from 'components/swapv2/LimitOrder/hooks/useWarningCreateOrder'
import useWrapEthStatus from 'components/swapv2/LimitOrder/hooks/useWrapEthStatus'
import { CreateOrderParam, RateInfo } from 'components/swapv2/LimitOrder/type'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useTokenAllowance } from 'data/Allowances'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import type { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useWrapCallback from 'hooks/useWrapCallback'
import { useNotify } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { getCookieValue } from 'utils'
import { subscribeNotificationOrderExpired } from 'utils/firebase'
import { maxAmountSpend } from 'utils/maxAmountSpend'

type UseLimitOrderExecutionArgs = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
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

export type ProcessingOrderStep = 'wrap' | 'approve' | 'create'
export type ProcessingOrderStepStatus = 'idle' | 'active' | 'success' | 'error'

export type ProcessingOrderState = {
  show: boolean
  steps: ProcessingOrderStep[]
  currentStep?: ProcessingOrderStep
  errorStep?: ProcessingOrderStep
  completedSteps: ProcessingOrderStep[]
}

export default function useLimitOrderExecution({
  currencyIn,
  currencyOut,
  setFlowState,
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
  const [processingOrder, setProcessingOrder] = useState<ProcessingOrderState>({
    show: false,
    steps: [],
    completedSteps: [],
  })
  const processingStepStartedRef = useRef<ProcessingOrderStep>()
  const approvalRef = useRef<ApprovalState>(ApprovalState.UNKNOWN)

  // Balances, allowance, and form readiness.
  const { data: activeOrderMakingAmount = '', refetch: getActiveMakingAmount } = useGetTotalActiveMakingAmountQuery(
    { chainId, tokenAddress: currencyIn?.wrapped.address ?? '', account: account ?? '' },
    { skip: !currencyIn || !account },
  )

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
        return TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(activeOrderMakingAmount))
      }
    } catch (error) {}
    return undefined
  }, [currencyIn, activeOrderMakingAmount])

  const balance = useCurrencyBalance(currencyIn, chainId)
  const nativeCurrency = NativeCurrencies[chainId]
  const nativeBalance = useCurrencyBalance(nativeCurrency, chainId)
  const isWrappedNativeInput = !!currencyIn?.equals(WETH[chainId])
  const wrapAmountForOrder = useMemo(() => {
    if (!currencyIn || !isWrappedNativeInput || !parseInputAmount || !balance?.currency.equals(currencyIn)) {
      return undefined
    }
    if (!balance.lessThan(parseInputAmount)) return undefined
    const deficit = JSBI.subtract(parseInputAmount.quotient, balance.quotient)
    return CurrencyAmount.fromRawAmount(nativeCurrency, deficit)
  }, [balance, currencyIn, isWrappedNativeInput, nativeCurrency, parseInputAmount])
  const needsWrap = !!currencyIn?.isNative || !!wrapAmountForOrder
  const wrapInputCurrency = currencyIn?.isNative ? currencyIn : wrapAmountForOrder ? nativeCurrency : currencyIn
  const wrapTypedValue = wrapAmountForOrder ? wrapAmountForOrder.toExact() : inputAmount
  const { execute: onWrap } = useWrapCallback(wrapInputCurrency, WETH[chainId], wrapTypedValue, true, chainId)
  const maxAmountInput = useMemo(() => {
    return maxAmountSpend(balance)
  }, [balance])

  const insufficientBalance = useMemo(() => {
    if (!parseInputAmount || !currencyIn || !balance?.currency.equals(currencyIn)) return false
    if (!balance.lessThan(parseInputAmount)) return false
    if (!isWrappedNativeInput || !wrapAmountForOrder || !nativeBalance?.currency.equals(nativeCurrency)) return true
    return nativeBalance.lessThan(wrapAmountForOrder)
  }, [balance, currencyIn, isWrappedNativeInput, nativeBalance, nativeCurrency, parseInputAmount, wrapAmountForOrder])

  const insufficientBalanceSymbol = currencyIn?.symbol
  const insufficientBalanceText = insufficientBalance ? t`Insufficient ${insufficientBalanceSymbol} balance` : undefined

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
    displayRate,
    currencyIn,
    currencyOut,
  })

  const hasInputError = Boolean(inputError || outPutError)
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

  const markProcessingStepSuccess = useCallback((step: ProcessingOrderStep) => {
    processingStepStartedRef.current = undefined
    setProcessingOrder(state => {
      if (!state.show || state.currentStep !== step) return state
      const completedSteps = state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step]
      const nextStep = state.steps[state.steps.indexOf(step) + 1]
      return {
        ...state,
        currentStep: nextStep,
        completedSteps,
      }
    })
  }, [])

  const markProcessingStepError = useCallback((step: ProcessingOrderStep) => {
    processingStepStartedRef.current = undefined
    setProcessingOrder(state => {
      if (!state.show || state.currentStep !== step) return state
      return {
        ...state,
        errorStep: step,
      }
    })
  }, [])

  const hideProcessingOrder = useCallback(() => {
    processingStepStartedRef.current = undefined
    setProcessingOrder({ show: false, steps: [], completedSteps: [] })
  }, [])

  const retryProcessingOrder = useCallback(() => {
    processingStepStartedRef.current = undefined
    setProcessingOrder(state => {
      if (!state.errorStep) return state
      return {
        ...state,
        currentStep: state.errorStep,
        errorStep: undefined,
      }
    })
  }, [])

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

  const onSubmitCreateOrderWithTracking = useCallback(async () => {
    trackingPlaceOrder(TRACKING_EVENT_TYPE.LO_CLICK_PLACE_ORDER)
    const order_id = await onSubmitCreateOrder({
      currencyIn,
      currencyOut,
      chainId,
      account,
      inputAmount,
      outputAmount,
      expiredAt,
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
    return order_id
  }, [
    account,
    chainId,
    currencyIn,
    currencyOut,
    deltaRate.rawPercent,
    displayRate,
    displayTime,
    estimateUSD.rawInput,
    expiredAt,
    inputAmount,
    networkName,
    onSubmitCreateOrder,
    outputAmount,
    rateInfo.invert,
    searchParams,
    trackingHandler,
    trackingPlaceOrder,
    tradeInfo,
  ])

  const runProcessingStep = useCallback(
    (step: ProcessingOrderStep) => {
      if (step === 'wrap') {
        if (!needsWrap) {
          markProcessingStepSuccess('wrap')
          return
        }
        if (isWrappingEth || processingStepStartedRef.current === 'wrap') return
        processingStepStartedRef.current = 'wrap'
        ;(async () => {
          try {
            const hash = await onWrap?.()
            if (!hash) {
              markProcessingStepError('wrap')
              return
            }
            setTxHashWrapped(hash)
          } catch (error) {
            handleError(error)
            markProcessingStepError('wrap')
          }
        })()
        return
      }

      if (step === 'approve') {
        if (approval === ApprovalState.APPROVED) {
          markProcessingStepSuccess('approve')
          return
        }
        if (approval === ApprovalState.UNKNOWN || approval === ApprovalState.PENDING) return
        if (processingStepStartedRef.current === 'approve') return
        processingStepStartedRef.current = 'approve'
        ;(async () => {
          try {
            await approveCallback()
            setTimeout(() => {
              if (approvalRef.current === ApprovalState.NOT_APPROVED) {
                markProcessingStepError('approve')
              }
            }, 800)
          } catch (error) {
            handleError(error)
            markProcessingStepError('approve')
          }
        })()
        return
      }

      if (processingStepStartedRef.current === 'create') return
      processingStepStartedRef.current = 'create'
      ;(async () => {
        try {
          const orderId = await onSubmitCreateOrderWithTracking()
          if (orderId) {
            markProcessingStepSuccess('create')
            return
          }
          markProcessingStepError('create')
        } catch (error) {
          handleError(error)
          markProcessingStepError('create')
        }
      })()
    },
    [
      approval,
      approveCallback,
      handleError,
      isWrappingEth,
      markProcessingStepError,
      markProcessingStepSuccess,
      needsWrap,
      onSubmitCreateOrderWithTracking,
      onWrap,
      setTxHashWrapped,
    ],
  )

  const startProcessingOrder = useCallback(() => {
    const steps: ProcessingOrderStep[] = []
    if (needsWrap) steps.push('wrap')
    if (needsWrap || (!currencyIn?.isNative && approval !== ApprovalState.APPROVED)) steps.push('approve')
    steps.push('create')
    const firstStep = steps[0]
    processingStepStartedRef.current = undefined
    setFlowState(state => ({ ...state, showConfirm: false, errorMessage: undefined }))
    setProcessingOrder({
      show: true,
      steps,
      currentStep: firstStep,
      completedSteps: [],
    })
    runProcessingStep(firstStep)
  }, [approval, currencyIn?.isNative, needsWrap, runProcessingStep, setFlowState])

  // External state synchronization.
  useEffect(() => {
    approvalRef.current = approval
  }, [approval])

  useEffect(() => {
    const currentStep = processingOrder.currentStep
    if (!processingOrder.show || !currentStep || processingOrder.errorStep) return
    runProcessingStep(currentStep)
  }, [processingOrder.currentStep, processingOrder.errorStep, processingOrder.show, runProcessingStep])

  useEffect(() => {
    if (!account) return
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, refreshActiveMakingAmount)
    return () => {
      unsubscribeExpired?.()
    }
  }, [account, chainId, refreshActiveMakingAmount])

  return {
    estimateUSD,
    handleMaxInput,
    hasInputError,
    hidePreview,
    hideProcessingOrder,
    inputError,
    insufficientBalance,
    insufficientBalanceText,
    isNotFillAllInput,
    outPutError,
    processingOrder,
    retryProcessingOrder,
    showPreview,
    startProcessingOrder,
    trackingPriceSetOnBlur,
    trackingTouchInput,
    trackingTouchSelectToken,
    warningMessage,
  }
}
