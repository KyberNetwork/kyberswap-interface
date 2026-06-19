import { Currency, CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo } from 'react'
import { useGetLOConfigQuery, useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'

import { wagmiConfig } from 'components/Web3Provider'
import { calcUsdPrices, getErrorMessage, removeTrailingZero } from 'components/swapv2/LimitOrder/helpers'
import { ProcessingOrderStep } from 'components/swapv2/LimitOrder/hooks/useProcessingOrder'
import { useValidateInputError } from 'components/swapv2/LimitOrder/hooks/useValidateInputError'
import { useWarningCreateOrder } from 'components/swapv2/LimitOrder/hooks/useWarningCreateOrder'
import { useWrapEthStatus } from 'components/swapv2/LimitOrder/hooks/useWrapEthStatus'
import { LimitOrderCreateContext } from 'components/swapv2/LimitOrder/types'
import { ERC20_ABI } from 'constants/abis'
import { NativeCurrencies } from 'constants/tokens'
import { useTokenAllowance } from 'data/Allowances'
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
  onCloseReview: () => void
  onOpenReview: () => void
  onSetInput: (input: string) => void
  onResetForm: () => void
  switchToWeth: () => void
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

  // Balance and wrap requirements.
  const balance = useCurrencyBalance(currencyIn, chainId)
  const nativeCurrency = NativeCurrencies[chainId]
  const nativeBalance = useCurrencyBalance(nativeCurrency, chainId)
  const isWrappedNativeInput = !!currencyIn?.equals(WETH[chainId])

  const wrapAmountForOrder = useMemo(() => {
    if (!currencyIn || !isWrappedNativeInput || !parsedInputAmount || !balance?.currency.equals(currencyIn)) {
      return undefined
    }
    if (!balance.lessThan(parsedInputAmount)) return undefined
    const deficit = JSBI.subtract(parsedInputAmount.quotient, balance.quotient)
    return CurrencyAmount.fromRawAmount(nativeCurrency, deficit)
  }, [balance, currencyIn, isWrappedNativeInput, nativeCurrency, parsedInputAmount])

  const needsWrap = !!currencyIn?.isNative || !!wrapAmountForOrder
  const wrapInputCurrency = currencyIn?.isNative ? currencyIn : wrapAmountForOrder ? nativeCurrency : currencyIn
  const wrapTypedValue = wrapAmountForOrder ? wrapAmountForOrder.toExact() : inputAmount

  const { isWrappingEth, setTxHashWrapped } = useWrapEthStatus(switchToWeth)
  const { execute: onWrap } = useWrapCallback(wrapInputCurrency, WETH[chainId], wrapTypedValue, true, chainId)

  const maxAmountInput = useMemo(() => {
    return maxAmountSpend(balance)
  }, [balance])

  const insufficientBalance = useMemo(() => {
    if (!parsedInputAmount || !currencyIn || !balance?.currency.equals(currencyIn)) return false
    if (!balance.lessThan(parsedInputAmount)) return false
    if (!isWrappedNativeInput || !wrapAmountForOrder || !nativeBalance?.currency.equals(nativeCurrency)) return true
    return nativeBalance.lessThan(wrapAmountForOrder)
  }, [balance, currencyIn, isWrappedNativeInput, nativeBalance, nativeCurrency, parsedInputAmount, wrapAmountForOrder])

  const insufficientBalanceText = insufficientBalance ? t`Insufficient Balance` : undefined

  const showReservedOrderNotice = useMemo(() => {
    if (!currencyIn || currencyIn.isNative || !parsedInputAmount || !parsedActiveOrderMakingAmount) return false
    if (!balance?.currency.equals(currencyIn)) return false
    if (JSBI.equal(parsedActiveOrderMakingAmount.quotient, JSBI.BigInt(0))) return false

    const remainingBalance = JSBI.subtract(balance.quotient, parsedInputAmount.quotient)
    return JSBI.lessThan(remainingBalance, parsedActiveOrderMakingAmount.quotient)
  }, [balance, currencyIn, parsedInputAmount, parsedActiveOrderMakingAmount])

  const handleMaxInput = useCallback(() => {
    if (!maxAmountInput) return
    try {
      onSetInput(maxAmountInput.toExact())
    } catch (error) {}
  }, [maxAmountInput, onSetInput])

  // Allowance and process-modal steps.
  const currentAllowance = useTokenAllowance(
    currencyIn as Token,
    account ?? undefined,
    limitOrderContract,
  ) as CurrencyAmount<Currency>

  const missingAllowance = useMemo(() => {
    if (currentAllowance?.equalTo(0)) return true
    if (currencyIn?.isNative || !parsedInputAmount) return false
    const allowanceSubtracted = parsedActiveOrderMakingAmount
      ? currentAllowance?.subtract(parsedActiveOrderMakingAmount)
      : undefined

    if (
      !allowanceSubtracted ||
      allowanceSubtracted.greaterThan(parsedInputAmount) ||
      allowanceSubtracted.equalTo(parsedInputAmount)
    )
      return false
    return parsedInputAmount.subtract(allowanceSubtracted)
  }, [currencyIn?.isNative, currentAllowance, parsedInputAmount, parsedActiveOrderMakingAmount])

  const enoughAllowance = !missingAllowance

  const [approval, approveCallback] = useApproveCallback(
    parsedInputAmount,
    limitOrderContract || undefined,
    !enoughAllowance,
  )

  const hasEnoughAllowance = useCallback(
    (allowance: CurrencyAmount<Currency>) => {
      if (currencyIn?.isNative || !parsedInputAmount) return true
      try {
        const availableAllowance = parsedActiveOrderMakingAmount
          ? allowance.subtract(parsedActiveOrderMakingAmount)
          : allowance
        return availableAllowance.greaterThan(parsedInputAmount) || availableAllowance.equalTo(parsedInputAmount)
      } catch (error) {
        return false
      }
    },
    [currencyIn?.isNative, parsedInputAmount, parsedActiveOrderMakingAmount],
  )

  const checkApprovalManually = useCallback(async () => {
    if (currencyIn?.isNative) return true
    if (!currencyIn || !account || !limitOrderContract || !parsedInputAmount) return false

    const allowance = (await readContract(wagmiConfig, {
      address: currencyIn.wrapped.address as Address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, limitOrderContract],
      chainId: chainId as number,
    })) as bigint

    return hasEnoughAllowance(TokenAmount.fromRawAmount(currencyIn.wrapped, allowance.toString()))
  }, [account, chainId, currencyIn, hasEnoughAllowance, limitOrderContract, parsedInputAmount])

  const processingSteps = useMemo<ProcessingOrderStep[]>(() => {
    const steps: ProcessingOrderStep[] = []
    if (needsWrap) steps.push('wrap')
    if (needsWrap || (!currencyIn?.isNative && !enoughAllowance)) steps.push('approve')
    steps.push('create')
    return steps
  }, [currencyIn?.isNative, enoughAllowance, needsWrap])

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
  const trackingTouchInput = useCallback(() => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter amount box')
  }, [trackingHandler])

  const trackingPriceSetOnBlur = useCallback(() => {
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
  }, [displayRate, currencyIn, currencyOut, tradeInfo, deltaRate.rawPercent, networkName, trackingHandler])

  const trackingTouchSelectToken = useCallback(() => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter token box')
  }, [trackingHandler])

  // Review modal and shared error handling.
  const openReview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return

    onOpenReview()

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

  const closeReview = useCallback(() => {
    onCloseReview()
  }, [onCloseReview])

  const handleError = useCallback(
    (error: unknown) => {
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

      return
    },
    [trackingHandler, currencyIn, currencyOut, displayRate, inputAmount, networkName],
  )

  // Keep active making amount fresh after order state updates.
  const refreshActiveMakingAmount = useCallback(() => {
    try {
      getActiveMakingAmount()
    } catch (error) {}
  }, [getActiveMakingAmount])

  const resetForm = useCallback(() => {
    onResetForm()
    refreshActiveMakingAmount()
  }, [onResetForm, refreshActiveMakingAmount])

  useEffect(() => {
    if (!account) return
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, refreshActiveMakingAmount)
    return () => {
      unsubscribeExpired?.()
    }
  }, [account, chainId, refreshActiveMakingAmount])

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
      approval,
      approveCallback,
      checkApprovalManually,
      isWrappingEth,
      onWrap,
      setTxHashWrapped,
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
