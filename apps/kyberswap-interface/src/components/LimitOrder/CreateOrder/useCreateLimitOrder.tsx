import { TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useEffect, useMemo } from 'react'
import { useGetLOConfigQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'

import { useLimitOrderTracking } from 'components/LimitOrder/CreateOrder/useLimitOrderTracking'
import { useWarningCreateOrder } from 'components/LimitOrder/CreateOrder/useWarningCreateOrder'
import { useValidateInputError } from 'components/LimitOrder/Form/useValidateInputError'
import { ProcessingOrderStep } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import { calcUsdPrices } from 'components/LimitOrder/helpers'
import { useLimitOrderApproval } from 'components/LimitOrder/hooks/useLimitOrderApproval'
import { useLimitOrderWrapStep } from 'components/LimitOrder/hooks/useLimitOrderWrapStep'
import { LimitOrderCreateContext } from 'components/LimitOrder/types'
import { useActiveWeb3React } from 'hooks'
import { useApproveCallback } from 'hooks/useApproveCallback'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { subscribeNotificationOrderExpired } from 'utils/firebase'
import { maxAmountSpend } from 'utils/maxAmountSpend'

type Props = {
  order: LimitOrderCreateContext
  searchParams: URLSearchParams
  onCloseReview?: () => void
  onOpenReview?: () => void
  onSetInput?: (input: string) => void
  onResetForm?: () => void
  switchToWeth?: () => void
}

export const useCreateLimitOrder = ({
  order,
  searchParams,
  onCloseReview,
  onOpenReview,
  onSetInput,
  onResetForm,
  switchToWeth,
}: Props) => {
  const { currencyIn, currencyOut, chainId, inputAmount, outputAmount, displayRate, tradeInfo, deltaRate } = order
  const { account } = useActiveWeb3React()

  // Base order data from API and typed input.
  const { data: activeOrderMakingAmount = '', refetch: getActiveMakingAmount } = useGetTotalActiveMakingAmountQuery(
    { chainId, tokenAddress: currencyIn?.wrapped.address ?? '', account: account ?? '' },
    { skip: !currencyIn || !account },
  )

  const parsedInputAmount = useMemo(
    () => tryParseAmount(inputAmount, currencyIn ?? undefined),
    [currencyIn, inputAmount],
  )

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

  const parsedActiveOrderMakingAmount = useMemo(() => {
    try {
      if (approvalCurrency && activeOrderMakingAmount) {
        return TokenAmount.fromRawAmount(approvalCurrency, JSBI.BigInt(activeOrderMakingAmount))
      }
    } catch (error) {}
    return undefined
  }, [approvalCurrency, activeOrderMakingAmount])

  const balance = useCurrencyBalance(currencyIn, chainId)
  const approvalBalance = useCurrencyBalance(approvalCurrency, chainId)
  const { insufficientBalance, onWrap, wrapAmount } = useLimitOrderWrapStep({
    chainId,
    currency: approvalCurrency,
    amount: parsedApprovalAmount,
    balance: approvalBalance,
  })

  const maxAmountInput = maxAmountSpend(balance)

  const insufficientBalanceText = insufficientBalance ? t`Insufficient Balance` : undefined

  const showReservedOrderNotice = (() => {
    if (!currencyIn || currencyIn.isNative || !parsedInputAmount || !parsedActiveOrderMakingAmount) return false
    if (!balance?.currency.equals(currencyIn)) return false
    if (JSBI.equal(parsedActiveOrderMakingAmount.quotient, JSBI.BigInt(0))) return false

    const remainingBalance = JSBI.subtract(balance.quotient, parsedInputAmount.quotient)
    return JSBI.lessThan(remainingBalance, parsedActiveOrderMakingAmount.quotient)
  })()

  const handleMaxInput = () => {
    if (!maxAmountInput) return
    try {
      onSetInput?.(maxAmountInput.toExact())
    } catch (error) {}
  }

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

  const warningMessage = useWarningCreateOrder({
    currencyIn,
    displayRate,
    deltaRate,
    showReservedOrderNotice,
  })

  // Keep active making amount fresh after order state updates.
  const refreshActiveMakingAmount = () => {
    try {
      getActiveMakingAmount()
    } catch (error) {}
  }

  const resetForm = () => {
    onResetForm?.()
    refreshActiveMakingAmount()
  }

  const limitOrderTracking = useLimitOrderTracking({
    order,
    searchParams,
    estimateUSD,
    onSuccess: resetForm,
  })

  const openReview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return

    onOpenReview?.()
    limitOrderTracking.trackReviewOpened()
  }

  const closeReview = () => {
    onCloseReview?.()
  }

  useEffect(() => {
    if (!account) return
    const refreshActiveMakingAmount = () => {
      try {
        getActiveMakingAmount()
      } catch (error) {}
    }
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, refreshActiveMakingAmount)
    return () => {
      unsubscribeExpired?.()
    }
  }, [account, chainId, getActiveMakingAmount])

  return {
    estimateUSD,
    resetForm,
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
      onWrapSuccess: switchToWeth,
      finalStep: 'create' as const,
      onFinalStep: async () => !!(await limitOrderTracking.submitCreateOrderWithTracking()),
      onError: limitOrderTracking.trackOrderFailed,
      steps: processingSteps,
    },
    tracking: {
      trackingPriceSetOnBlur: limitOrderTracking.trackPriceSetOnBlur,
      trackingTouchInput: limitOrderTracking.trackTouchInput,
      trackingTouchSelectToken: limitOrderTracking.trackTouchSelectToken,
    },
    validation: {
      inputError,
      isNotFillAllInput,
      outputError,
      warningMessage,
    },
  }
}
