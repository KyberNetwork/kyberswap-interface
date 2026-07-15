import { TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useEffect, useMemo } from 'react'
import { useCreateOrderMutation, useGetLOConfigQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'

import { NotificationType } from 'components/Announcement/type'
import { useSignOrder } from 'components/LimitOrder/CreateOrder/useSignOrder'
import { useWarningCreateOrder } from 'components/LimitOrder/CreateOrder/useWarningCreateOrder'
import { useValidateInputError } from 'components/LimitOrder/Form/useValidateInputError'
import { SummaryNotifyOrderPlaced } from 'components/LimitOrder/MyOrders/SummaryNotify'
import { ProcessingOrderStep } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import { useLimitOrderApproval } from 'components/LimitOrder/hooks/useLimitOrderApproval'
import { useLimitOrderTracking } from 'components/LimitOrder/hooks/useLimitOrderTracking'
import { useLimitOrderWrapStep } from 'components/LimitOrder/hooks/useLimitOrderWrapStep'
import { CreateOrderParams, LimitOrderCreateContext } from 'components/LimitOrder/types'
import { calcUsdPrices, getPayloadCreateOrder } from 'components/LimitOrder/utils'
import { useActiveWeb3React } from 'hooks'
import { useApproveCallback } from 'hooks/useApproveCallback'
import { useNotify } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { getCookieValue } from 'utils'
import { subscribeNotificationOrderExpired } from 'utils/firebase'
import { maxAmountSpend } from 'utils/maxAmountSpend'

type UseCreateLimitOrderProps = {
  order: LimitOrderCreateContext
  searchParams: URLSearchParams
  onCloseReview?: () => void
  onOpenReview?: () => void
  onSetInput?: (input: string) => void
  onResetForm?: () => void
}

export const useCreateLimitOrder = ({
  order,
  searchParams,
  onCloseReview,
  onOpenReview,
  onSetInput,
  onResetForm,
}: UseCreateLimitOrderProps) => {
  const { currencyIn, currencyOut, chainId, inputAmount, outputAmount, displayRate, expiredAt, tradeInfo, deltaRate } =
    order
  const { account } = useActiveWeb3React()
  const notify = useNotify()
  const signOrder = useSignOrder()
  const limitOrderTracking = useLimitOrderTracking()
  const [submitOrder] = useCreateOrderMutation()

  const parsedInputAmount = useMemo(
    () => tryParseAmount(inputAmount, currencyIn ?? undefined),
    [currencyIn, inputAmount],
  )

  const balance = useCurrencyBalance(currencyIn, chainId)

  const nativeWrapAmount = useMemo(() => {
    if (!currencyIn?.isNative || !parsedInputAmount || !balance?.currency.equals(currencyIn)) return undefined
    return balance.lessThan(parsedInputAmount) ? undefined : parsedInputAmount
  }, [balance, currencyIn, parsedInputAmount])

  const { insufficientBalance, onWrap, wrapAmount } = useLimitOrderWrapStep({
    chainId,
    amount: parsedInputAmount,
    balance,
    wrapAmount: nativeWrapAmount,
  })

  const maxAmountInput = maxAmountSpend(balance)

  const inputCurrencySymbol = currencyIn?.symbol
  const insufficientBalanceText = insufficientBalance ? t`Insufficient ${inputCurrencySymbol} balance` : undefined

  const { currentData } = useGetLOConfigQuery(chainId)
  const limitOrderContract = currentData?.contract

  const approvalCurrency = useMemo(() => {
    if (!currencyIn) return undefined
    return currencyIn.isNative ? WETH[chainId] : currencyIn.wrapped
  }, [chainId, currencyIn])

  const parsedApprovalAmount = useMemo(() => {
    if (!approvalCurrency || !parsedInputAmount) return undefined
    return TokenAmount.fromRawAmount(approvalCurrency, parsedInputAmount.quotient)
  }, [approvalCurrency, parsedInputAmount])

  const { data: activeOrderMakingAmount = '', refetch: getActiveMakingAmount } = useGetTotalActiveMakingAmountQuery(
    {
      chainId,
      makerAsset: currencyIn?.wrapped.address,
      account,
    },
    { skip: !currencyIn || !account },
  )

  const parsedActiveOrderMakingAmount = useMemo(() => {
    try {
      if (approvalCurrency && activeOrderMakingAmount) {
        return TokenAmount.fromRawAmount(approvalCurrency, JSBI.BigInt(activeOrderMakingAmount))
      }
    } catch (error) {}
    return undefined
  }, [approvalCurrency, activeOrderMakingAmount])

  // Allowance is checked inside the processing approve step so the modal can show the step even when it passes.
  const [approval, approveCallback] = useApproveCallback({
    amount: parsedApprovalAmount,
    spender: limitOrderContract || undefined,
    forceApprove: true,
  })

  const hasEnoughAllowance = (allowance: TokenAmount) => {
    if (!parsedApprovalAmount) return true
    try {
      const availableAllowance = parsedActiveOrderMakingAmount
        ? allowance.subtract(parsedActiveOrderMakingAmount)
        : allowance
      return availableAllowance.greaterThan(parsedApprovalAmount) || availableAllowance.equalTo(parsedApprovalAmount)
    } catch (error) {
      return false
    }
  }

  const checkApprovalManually = useLimitOrderApproval({
    account,
    amount: parsedApprovalAmount,
    chainId,
    currency: approvalCurrency,
    spender: limitOrderContract,
    isAllowanceEnough: hasEnoughAllowance,
  })

  const processingSteps = (() => {
    const steps: ProcessingOrderStep[] = []

    if (wrapAmount) steps.push('wrap')
    steps.push('approve')
    steps.push('create')
    return steps
  })()

  // Form validation and warning messages.
  const { inputError, outputError } = useValidateInputError({
    inputAmount,
    outputAmount,
    displayRate,
    currencyIn,
    currencyOut,
  })

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

  const { shouldWarningAction, shouldDisableAction, warnings } = useWarningCreateOrder({
    chainId,
    currencyIn,
    currencyOut,
    deltaRate,
    onSharedBalanceReview: () => limitOrderTracking.trackCreateSharedBalanceReview(order),
    parsedInputAmount,
  })

  const handleMaxInput = () => {
    if (!maxAmountInput) return
    try {
      onSetInput?.(maxAmountInput.toExact())
    } catch (error) {}
  }

  const openReview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return

    onOpenReview?.()
    limitOrderTracking.trackCreateReviewOpened({ order, estimateUSD })
  }

  const closeReview = () => {
    onCloseReview?.()
  }

  const trackOrderFailed = (error: unknown) => limitOrderTracking.trackCreateOrderFailed(order, error)

  const submitCreateOrder = async (params: CreateOrderParams) => {
    try {
      const { currencyIn, currencyOut, account, inputAmount, outputAmount, expiredAt } = params
      if (!currencyIn || !currencyOut || !account || !inputAmount || !outputAmount || !expiredAt) {
        throw new Error('wrong input')
      }

      const refCode = getCookieValue('refCode')
      const clientId = searchParams.get('clientId')
      const { signature, salt } = await signOrder({ ...params, referral: refCode })
      const payload = getPayloadCreateOrder(params)
      const response = await submitOrder({
        ...payload,
        salt: salt || '',
        signature,
        referral: refCode,
        clientId,
      }).unwrap()

      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Order Placed`,
          summary: <SummaryNotifyOrderPlaced {...{ currencyIn, currencyOut, inputAmount, outputAmount }} />,
        },
        10000,
      )
      onResetForm?.()
      return response?.id
    } catch (error) {
      trackOrderFailed(error)
      return
    }
  }

  const submitCreateOrderWithTracking = async () => {
    const orderId = await submitCreateOrder({
      currencyIn,
      currencyOut,
      chainId,
      account,
      inputAmount,
      outputAmount,
      expiredAt,
    })
    if (!orderId) return

    limitOrderTracking.trackCreatePlaceOrderSubmitSuccess(order, orderId)
    limitOrderTracking.trackCreateOrderPlaced({ order, estimateUSD, orderId })
    limitOrderTracking.trackCreateTipLinkTrade({ order, estimateUSD, orderId, searchParams })
    return orderId
  }

  useEffect(() => {
    if (!account || !currencyIn) return
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, () => {
      try {
        getActiveMakingAmount()
      } catch (error) {}
    })
    return () => {
      unsubscribeExpired?.()
    }
  }, [account, chainId, currencyIn, getActiveMakingAmount])

  return {
    estimateUSD,
    balance: {
      handleMaxInput,
      insufficientBalance,
      insufficientBalanceText,
    },
    review: {
      closeReview,
      openReview,
    },
    processing: {
      chainId,
      approval,
      approveCallback,
      checkApprovalManually,
      onWrap,
      finalStep: 'create' as const,
      onFinalStep: async () => !!(await submitCreateOrderWithTracking()),
      onError: trackOrderFailed,
      onStart: () => limitOrderTracking.trackCreatePlaceOrderClick(order),
      steps: processingSteps,
    },
    tracking: {
      trackingMarketRateClick: () => limitOrderTracking.trackCreateMarketRateClick(order),
      trackingPriceSetOnBlur: () => limitOrderTracking.trackCreatePriceSetOnBlur(order),
      trackingRatePresetClick: (preset: string) => limitOrderTracking.trackCreateRatePresetClick(order, preset),
      trackingTouchInput: limitOrderTracking.trackCreateTouchInput,
      trackingTouchSelectToken: limitOrderTracking.trackCreateTouchSelectToken,
    },
    validation: {
      inputError,
      isNotFillAllInput,
      outputError,
      shouldDisableAction,
      shouldWarningAction,
      warnings,
    },
  }
}
