import { Currency, CurrencyAmount, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'
import {
  useCreateStopLossOrderMutation,
  useEstimateStopLossFeeMutation,
  useGetStopLossConfigQuery,
  useGetStopLossOrdersQuery,
  useGetStopLossSignMessageMutation,
} from 'services/stopLoss'

import { NotificationType } from 'components/Announcement/type'
import { ProcessingOrderStep } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import { useLimitOrderApproval } from 'components/LimitOrder/hooks/useLimitOrderApproval'
import { useLimitOrderWrapStep } from 'components/LimitOrder/hooks/useLimitOrderWrapStep'
import { DEFAULT_MAX_FEES_PERCENTAGE, DEFAULT_MAX_GAS_PERCENTAGE } from 'components/StopLoss/constants'
import { useStopLossTracking } from 'components/StopLoss/hooks/useStopLossTracking'
import { StopLossFee, StopLossOrder, StopLossOrderStatus } from 'components/StopLoss/types'
import { buildStopLossPayload, stripEmptyEip712Salt } from 'components/StopLoss/utils'
import { useActiveWeb3React } from 'hooks'
import { useApproveCallback } from 'hooks/useApproveCallback'
import { useNotify } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { formatSignature } from 'utils/transaction'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

const EMPTY_OPEN_ORDERS: StopLossOrder[] = []

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount: string
  triggerPrice: string
  slippage: number
  expiredAt: number
  onResetForm?: () => void
}

export const useCreateStopLossOrder = ({
  currencyIn,
  currencyOut,
  inputAmount,
  triggerPrice,
  slippage,
  expiredAt,
  onResetForm,
}: Props) => {
  const { account, chainId } = useActiveWeb3React()
  const notify = useNotify()
  const tracking = useStopLossTracking()

  const [fee, setFee] = useState<StopLossFee | undefined>()

  const [estimateFee] = useEstimateStopLossFeeMutation()
  const [getSignMessage] = useGetStopLossSignMessageMutation()
  const [submitOrder] = useCreateStopLossOrderMutation()

  // Open orders and the limit-order commitment both eat into the same ERC-20 approval.
  const { data: openOrdersData } = useGetStopLossOrdersQuery(
    { userWallet: account || '', chainIds: [chainId], status: StopLossOrderStatus.OPEN, page: 1, pageSize: 100 },
    { skip: !account },
  )
  const openOrders = openOrdersData?.orders ?? EMPTY_OPEN_ORDERS
  const { data: activeLimitOrderAmount } = useGetTotalActiveMakingAmountQuery(
    { chainId, makerAsset: currencyIn?.wrapped.address, account },
    { skip: !currencyIn || !account },
  )

  const { data: config } = useGetStopLossConfigQuery(chainId)
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
   * Existing open orders on the same token already lay claim to part of the allowance, and both order
   * types draw on the same approval. Ignoring that lets a second order skip approval and leaves the two
   * competing for an allowance only one can spend.
   */
  const committedAmount = useMemo(() => {
    if (!approvalCurrency) return undefined
    const openSameToken = openOrders.filter(
      order => order.tokenIn.toLowerCase() === approvalCurrency.address.toLowerCase(),
    )
    const total = openSameToken.reduce((sum, order) => sum + BigInt(order.amountIn), 0n)
    const limitOrderTotal = activeLimitOrderAmount ? BigInt(activeLimitOrderAmount) : 0n
    const combined = total + limitOrderTotal
    return combined > 0n ? CurrencyAmount.fromRawAmount(approvalCurrency, combined.toString()) : undefined
  }, [approvalCurrency, openOrders, activeLimitOrderAmount])

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

  const checkApprovalManually = useLimitOrderApproval({
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
      return buildStopLossPayload({
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
   * the BE doc requires it to be at least the live fee.
   */
  const refreshFee = useCallback(async () => {
    const payload = buildPayload(DEFAULT_MAX_FEES_PERCENTAGE)
    if (!payload) return undefined
    try {
      const result = await estimateFee(payload).unwrap()
      setFee(result)
      return result
    } catch (error) {
      setFee(undefined)
      return undefined
    }
  }, [buildPayload, estimateFee])

  const submit = useCallback(async () => {
    if (!account || !currencyIn || !currencyOut) return false

    const latestFee = (await refreshFee()) ?? fee
    const protocolPercentage = latestFee?.protocol?.percentage ?? 0
    // Keep the cap at or above the live fee, whichever is larger.
    const maxFeesPercentage = DEFAULT_MAX_FEES_PERCENTAGE.map(value => Math.max(value, protocolPercentage))

    const payload = buildPayload(maxFeesPercentage)
    if (!payload) return false

    const typedData = await getSignMessage(payload).unwrap()
    const rawSignature = await signTypedDataRaw({
      chainId,
      account: account as Address,
      typedData: stripEmptyEip712Salt(typedData),
    })

    await submitOrder({ ...payload, signature: formatSignature(rawSignature) }).unwrap()

    tracking.trackOrderPlaced({
      currencyIn,
      currencyOut,
      chainId,
      inputAmount,
      triggerPrice,
      slippage,
      expiredAt,
    })

    const sellSymbol = currencyIn.symbol
    const receiveSymbol = currencyOut.symbol
    notify(
      {
        type: NotificationType.SUCCESS,
        title: t`Stop-loss order placed`,
        summary: t`Selling ${inputAmount} ${sellSymbol} when the price drops to ${triggerPrice} ${receiveSymbol}.`,
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
    fee,
    inputAmount,
    triggerPrice,
    slippage,
    expiredAt,
    buildPayload,
    refreshFee,
    getSignMessage,
    submitOrder,
    notify,
    tracking,
    onResetForm,
  ])

  return {
    fee,
    refreshFee,
    insufficientBalance,
    needsWrap: !!wrapAmount,
    processing: {
      chainId,
      approval,
      approveCallback,
      checkApprovalManually,
      onWrap,
      finalStep: 'create' as const,
      onFinalStep: submit,
      steps: processingSteps,
    },
  }
}
