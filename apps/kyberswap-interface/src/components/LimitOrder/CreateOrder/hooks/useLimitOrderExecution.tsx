import { Currency, CurrencyAmount, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import JSBI from 'jsbi'
import { useEffect, useMemo } from 'react'
import { useGetLOConfigQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'

import { useWarningCreateOrder } from 'components/LimitOrder/CreateOrder/hooks/useWarningCreateOrder'
import { useValidateInputError } from 'components/LimitOrder/Form/hooks/useValidateInputError'
import { ProcessingOrderStep } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import { calcUsdPrices, getErrorMessage, removeTrailingZero } from 'components/LimitOrder/helpers'
import { LimitOrderCreateContext } from 'components/LimitOrder/types'
import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useApproveCallback } from 'hooks/useApproveCallback'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useWrapCallback from 'hooks/useWrapCallback'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { subscribeNotificationOrderExpired } from 'utils/firebase'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { Address } from 'utils/viem'

type UseLimitOrderExecutionArgs = {
  order: LimitOrderCreateContext
  onCloseReview?: () => void
  onOpenReview?: () => void
  onSetInput?: (input: string) => void
  onResetForm?: () => void
  switchToWeth?: () => void
}

const getTokenAddress = (currency: Currency | undefined) => (currency?.isNative ? 'NATIVE' : currency?.wrapped?.address)

export const useLimitOrderExecution = ({
  order,
  onCloseReview,
  onOpenReview,
  onSetInput,
  onResetForm,
  switchToWeth,
}: UseLimitOrderExecutionArgs) => {
  const {
    currencyIn,
    currencyOut,
    chainId,
    networkName,
    inputAmount,
    outputAmount,
    displayRate,
    displayTime,
    tradeInfo,
    deltaRate,
  } = order
  const { account } = useActiveWeb3React()
  const { trackingHandler } = useTracking()

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

  // Balance and wrap requirements.
  const balance = useCurrencyBalance(currencyIn, chainId)
  const approvalBalance = useCurrencyBalance(approvalCurrency, chainId)
  const nativeCurrency = NativeCurrencies[chainId]
  const nativeBalance = useCurrencyBalance(nativeCurrency, chainId)
  const isWrappedNativeApproval = !!approvalCurrency?.equals(WETH[chainId])

  const wrapAmountForOrder = useMemo(() => {
    if (
      !approvalCurrency ||
      !isWrappedNativeApproval ||
      !parsedApprovalAmount ||
      !approvalBalance?.currency.equals(approvalCurrency)
    ) {
      return undefined
    }
    if (!approvalBalance.lessThan(parsedApprovalAmount)) return undefined
    const deficit = JSBI.subtract(parsedApprovalAmount.quotient, approvalBalance.quotient)
    return CurrencyAmount.fromRawAmount(nativeCurrency, deficit)
  }, [approvalBalance, approvalCurrency, isWrappedNativeApproval, nativeCurrency, parsedApprovalAmount])

  const needsWrap = !!wrapAmountForOrder
  const wrapInputCurrency = wrapAmountForOrder ? nativeCurrency : undefined
  const wrapTypedValue = wrapAmountForOrder?.toExact()

  const { execute: onWrap } = useWrapCallback(wrapInputCurrency, WETH[chainId], wrapTypedValue, true, chainId)

  const maxAmountInput = maxAmountSpend(balance)

  const insufficientBalance = (() => {
    if (!approvalCurrency || !parsedApprovalAmount || !approvalBalance?.currency.equals(approvalCurrency)) return false
    if (!approvalBalance.lessThan(parsedApprovalAmount)) return false
    if (!isWrappedNativeApproval || !wrapAmountForOrder || !nativeBalance?.currency.equals(nativeCurrency)) return true
    return nativeBalance.lessThan(wrapAmountForOrder)
  })()

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
  const [approval, approveCallback] = useApproveCallback(parsedApprovalAmount, limitOrderContract || undefined, true)

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

  const checkApprovalManually = async () => {
    if (!approvalCurrency || !account || !limitOrderContract || !parsedApprovalAmount) return false

    const allowance = (await readContract(wagmiConfig, {
      address: approvalCurrency.address as Address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, limitOrderContract],
      chainId: chainId as number,
    })) as bigint

    return hasEnoughAllowance(TokenAmount.fromRawAmount(approvalCurrency, allowance.toString()))
  }

  const processingSteps = (() => {
    const steps: ProcessingOrderStep[] = []

    if (needsWrap) steps.push('wrap')
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

  // Tracking callbacks used by form inputs.
  const trackingTouchInput = () => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter amount box')
  }

  const trackingPriceSetOnBlur = () => {
    if (!displayRate || !currencyIn || !currencyOut) return
    trackingHandler(TRACKING_EVENT_TYPE.LO_PRICE_SET, {
      side: 'sell',
      limit_price: displayRate,
      market_price: tradeInfo ? removeTrailingZero(tradeInfo.marketRate.toFixed(16)) : undefined,
      price_difference_pct: deltaRate.rawPercent ? Number(deltaRate.rawPercent) : undefined,
      from_token: currencyIn.symbol,
      to_token: currencyOut.symbol,
      chain: networkName,
    })
  }

  const trackingTouchSelectToken = () => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter token box')
  }

  // Review modal and shared error handling.
  const openReview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return

    onOpenReview?.()

    trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_REVIEW_PLACE_ORDER, {
      from_token: currencyIn.symbol,
      to_token: currencyOut.symbol,
      from_network: chainId,
      trade_qty: inputAmount,
    })

    trackingHandler(TRACKING_EVENT_TYPE.LO_REVIEW_OPENED, {
      side: 'sell',
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

  const closeReview = () => {
    onCloseReview?.()
  }

  const handleError = (error: unknown) => {
    const errorMessage = getErrorMessage(error)
    const isUserRejected =
      errorMessage.toLowerCase().includes('user denied') || errorMessage.toLowerCase().includes('user rejected')

    trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_FAILED, {
      side: 'sell',
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      pair: currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
      limit_price: displayRate,
      amount_in: inputAmount,
      error_type: isUserRejected ? 'user_rejected' : 'tx_failed',
      error_message: errorMessage,
      chain: networkName,
    })
  }

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
    handleError,
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
      steps: processingSteps,
    },
    tracking: {
      trackingPriceSetOnBlur,
      trackingTouchInput,
      trackingTouchSelectToken,
    },
    validation: {
      inputError,
      isNotFillAllInput,
      outputError,
      warningMessage,
    },
  }
}
