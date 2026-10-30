import { Currency, CurrencyAmount, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import {
  useCreateStopMarketMutation,
  useEstimateStopMarketFeeMutation,
  useGetStopMarketActiveMakingAmountQuery,
  useGetStopMarketConfigQuery,
  useGetStopMarketReplaceSignMessageMutation,
  useGetStopMarketSignMessageMutation,
  useReplaceStopMarketMutation,
} from 'services/stopMarket'

import { NotificationType } from 'components/Announcement/type'
import { ProcessingOrderStep } from 'components/LimitOrder/ProcessingOrder/steps'
import { useLimitOrderWrapStep } from 'components/LimitOrder/hooks/useLimitOrderWrapStep'
import { DEFAULT_MAX_FEES_PERCENTAGE, DEFAULT_MAX_GAS_PERCENTAGE } from 'components/StopMarket/constants'
import { useStopMarketTracking } from 'components/StopMarket/hooks/useStopMarketTracking'
import { StopMarket, StopMarketFee } from 'components/StopMarket/types'
import { buildStopMarketPayload, parseRawAmount, stripEmptyEip712Salt } from 'components/StopMarket/utils'
import { useActiveWeb3React } from 'hooks'
import { useApproveCallback } from 'hooks/useApproveCallback'
import { useCheckAllowance } from 'hooks/useCheckAllowance'
import { useNotify } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { formatSignature } from 'utils/transaction'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount: string
  triggerPrice: string
  slippage: number
  expiredAt: number
  /** How far below the oracle price the trigger sits, in percent. Reported with the placed order. */
  triggerPercent?: number
  /** Sell amount in USD, reported with the placed order. */
  amountUsd?: number
  onResetForm?: () => void
  /** The open order these terms replace. Set, the order is placed as its replacement, under one signature. */
  replacing?: StopMarket
}

export const useCreateStopMarket = ({
  currencyIn,
  currencyOut,
  inputAmount,
  triggerPrice,
  slippage,
  expiredAt,
  triggerPercent,
  amountUsd,
  onResetForm,
  replacing,
}: Props) => {
  const { account, chainId } = useActiveWeb3React()
  const notify = useNotify()
  const tracking = useStopMarketTracking()

  const [estimateFee] = useEstimateStopMarketFeeMutation()
  const [getSignMessage] = useGetStopMarketSignMessageMutation()
  const [submitOrder] = useCreateStopMarketMutation()
  const [getReplaceSignMessage] = useGetStopMarketReplaceSignMessageMutation()
  const [submitReplacement] = useReplaceStopMarketMutation()

  const { data: config } = useGetStopMarketConfigQuery(chainId)
  // Both the contract that pulls tokenIn and the EIP-712 verifying contract.
  const smartIntentAddress = config?.smartIntentAddress

  const parsedInputAmount = useMemo(() => tryParseAmount(inputAmount, currencyIn), [inputAmount, currencyIn])
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

  // The order sells the wrapped token, so that is what gets approved.
  const approvalCurrency = useMemo(
    () => (currencyIn ? (currencyIn.isNative ? WETH[chainId] : currencyIn.wrapped) : undefined),
    [chainId, currencyIn],
  )

  const parsedApprovalAmount = useMemo(() => {
    if (!approvalCurrency || !parsedInputAmount) return undefined
    return CurrencyAmount.fromRawAmount(approvalCurrency, parsedInputAmount.quotient)
  }, [approvalCurrency, parsedInputAmount])

  const [approval, approveCallback] = useApproveCallback({
    amount: parsedApprovalAmount,
    spender: smartIntentAddress || undefined,
    forceApprove: true,
  })

  /**
   * The wallet's open stop market orders on this token already lay claim to part of the smartIntent
   * allowance. Ignoring that lets a second order skip approval and leaves the two competing for an
   * allowance only one can spend. Limit orders are not counted: they draw on an approval to a different
   * spender.
   */
  const { data: activeMakingAmount } = useGetStopMarketActiveMakingAmountQuery(
    { chainId, userWallet: account || '', tokenIn: approvalCurrency?.address ?? '' },
    { skip: !account || !approvalCurrency },
  )
  const committedAmount = useMemo(() => {
    if (!approvalCurrency || !activeMakingAmount || activeMakingAmount === '0') return undefined
    // An order being replaced gives up its claim for the new one, as the service counts it.
    const released =
      replacing && replacing.tokenIn.toLowerCase() === approvalCurrency.address.toLowerCase()
        ? parseRawAmount(replacing.amountIn)
        : 0n
    const committed = parseRawAmount(activeMakingAmount) - released
    if (committed <= 0n) return undefined
    // A malformed or out-of-range figure would throw inside the SDK, so it counts as nothing committed.
    try {
      return CurrencyAmount.fromRawAmount(approvalCurrency, committed.toString())
    } catch {
      return undefined
    }
  }, [approvalCurrency, activeMakingAmount, replacing])

  const hasEnoughAllowance = useCallback(
    (allowance: TokenAmount) => {
      if (!parsedApprovalAmount) return true
      try {
        const available = committedAmount ? allowance.subtract(committedAmount) : allowance
        return !available.lessThan(parsedApprovalAmount)
      } catch (error) {
        return false
      }
    },
    [parsedApprovalAmount, committedAmount],
  )

  const checkApprovalManually = useCheckAllowance({
    account,
    amount: parsedApprovalAmount,
    chainId,
    currency: approvalCurrency,
    spender: smartIntentAddress,
    isAllowanceEnough: hasEnoughAllowance,
  })

  const processingSteps = useMemo(() => {
    const steps: ProcessingOrderStep[] = []
    if (wrapAmount) steps.push('wrap')
    steps.push('approve')
    steps.push('create')
    return steps
  }, [wrapAmount])

  const buildPayload = useCallback(
    (maxFeesPercentage: number[]) => {
      if (!currencyIn || !currencyOut || !account) return undefined
      return buildStopMarketPayload({
        chainId,
        account,
        currencyIn,
        currencyOut,
        inputAmount,
        triggerPrice,
        slippage,
        expiredAt,
        maxFeesPercentage,
        maxGasPercentage: DEFAULT_MAX_GAS_PERCENTAGE,
      })
    },
    [account, chainId, currencyIn, currencyOut, inputAmount, triggerPrice, slippage, expiredAt],
  )

  /**
   * The protocol fee has to be known before signing, because the cap is signed into the intent and
   * the BE doc requires it to be at least the live fee. Throws when the service cannot estimate it.
   */
  const estimateLatestFee = useCallback(async (): Promise<StopMarketFee | undefined> => {
    const payload = buildPayload(DEFAULT_MAX_FEES_PERCENTAGE)
    if (!payload) return undefined
    return estimateFee(payload).unwrap()
  }, [buildPayload, estimateFee])

  const submit = useCallback(async () => {
    if (!account || !currencyIn || !currencyOut) return false

    // Re-estimated rather than taken from the review, and never signed without: a failure throws, so
    // the processing modal reports why instead of the order carrying a cap set against no fee at all.
    const latestFee = await estimateLatestFee()
    if (!latestFee) return false
    const protocolPercentage = latestFee.protocol?.percentage ?? 0
    // Keep the cap at or above the live fee, whichever is larger.
    const maxFeesPercentage = DEFAULT_MAX_FEES_PERCENTAGE.map(value => Math.max(value, protocolPercentage))

    const payload = buildPayload(maxFeesPercentage)
    if (!payload) return false

    const typedData = replacing
      ? await getReplaceSignMessage({ ...payload, orderId: replacing.id }).unwrap()
      : await getSignMessage(payload).unwrap()
    const rawSignature = await signTypedDataRaw({
      chainId,
      account: account as Address,
      typedData: stripEmptyEip712Salt(typedData),
    })
    const signature = formatSignature(rawSignature)

    if (replacing) await submitReplacement({ ...payload, orderId: replacing.id, signature }).unwrap()
    else await submitOrder({ ...payload, signature }).unwrap()

    tracking.trackOrderPlaced({
      currencyIn,
      currencyOut,
      chainId,
      inputAmount,
      amountUsd,
      triggerPrice,
      triggerPercent,
      slippage,
      expiredAt,
      replacesOrderId: replacing?.id,
    })

    const sellSymbol = currencyIn.symbol
    const receiveSymbol = currencyOut.symbol
    notify(
      {
        type: NotificationType.SUCCESS,
        title: replacing ? t`Order updated` : t`Stop Market order placed`,
        summary: t`Selling ${inputAmount} ${sellSymbol} when the price reaches ${triggerPrice} ${receiveSymbol}.`,
      },
      10000,
    )
    onResetForm?.()
    return true
  }, [
    account,
    chainId,
    currencyIn,
    currencyOut,
    inputAmount,
    amountUsd,
    triggerPrice,
    triggerPercent,
    slippage,
    expiredAt,
    buildPayload,
    estimateLatestFee,
    getSignMessage,
    submitOrder,
    replacing,
    getReplaceSignMessage,
    submitReplacement,
    notify,
    tracking,
    onResetForm,
  ])

  return {
    insufficientBalance,
    needsWrap: !!wrapAmount,
    processing: {
      chainId,
      approval,
      approveCallback,
      checkApprovalManually,
      onWrap,
      onFinalStep: submit,
      steps: processingSteps,
    },
  }
}
