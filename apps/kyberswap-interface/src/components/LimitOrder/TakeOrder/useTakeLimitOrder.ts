import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useMemo } from 'react'
import {
  FillOrderBody,
  useEncodeFillOrderMutation,
  useGetLOConfigQuery,
  useLazyGetOperatorSignatureQuery,
} from 'services/limitOrder'

import { NotificationType } from 'components/Announcement/type'
import { ProcessingOrderStep } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import { getErrorMessage } from 'components/LimitOrder/helpers'
import { useLimitOrderApproval } from 'components/LimitOrder/hooks/useLimitOrderApproval'
import { useLimitOrderWrapStep } from 'components/LimitOrder/hooks/useLimitOrderWrapStep'
import { LimitOrderTakeContext } from 'components/LimitOrder/types'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useApproveCallback } from 'hooks/useApproveCallback'
import { useInvalidateTagLimitOrder } from 'hooks/useInvalidateTags'
import { useNotify } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import useEstimateGasTxs from 'utils/useEstimateGasTxs'

const safeDivide = (numerator: JSBI, denominator: JSBI) => {
  if (JSBI.equal(denominator, JSBI.BigInt(0))) return JSBI.BigInt(0)
  return JSBI.divide(numerator, denominator)
}

const BPS_BASE = JSBI.BigInt(10_000)

const ceilDivide = (numerator: JSBI, denominator: JSBI) => {
  if (JSBI.equal(denominator, JSBI.BigInt(0))) return JSBI.BigInt(0)
  return JSBI.divide(JSBI.add(numerator, JSBI.subtract(denominator, JSBI.BigInt(1))), denominator)
}

const getAvailablePayAmount = ({ order, payCurrency }: LimitOrderTakeContext) => {
  const totalPayRaw = JSBI.BigInt(order.takingAmount)
  const totalReceiveRaw = JSBI.BigInt(order.makingAmount)
  const availableReceiveRaw = JSBI.BigInt(order.availableMakingAmount)
  const availablePayRaw = safeDivide(JSBI.multiply(totalPayRaw, availableReceiveRaw), totalReceiveRaw)
  return CurrencyAmount.fromRawAmount(payCurrency, availablePayRaw)
}

const getReceiveAmount = ({
  payAmount,
  context,
}: {
  payAmount: CurrencyAmount<Currency> | undefined
  context: LimitOrderTakeContext
}) => {
  if (!payAmount) return undefined
  const { order, receiveCurrency } = context
  const receiveRaw = safeDivide(
    JSBI.multiply(payAmount.quotient, JSBI.BigInt(order.makingAmount)),
    JSBI.BigInt(order.takingAmount),
  )
  return CurrencyAmount.fromRawAmount(receiveCurrency, receiveRaw)
}

const getFeeBps = (feePercent?: string) => {
  const fee = Number(feePercent || 0)
  if (!Number.isFinite(fee) || fee <= 0) return 0
  return Math.min(Math.round(fee > 1 ? fee : fee * 100), 10_000)
}

const subtractFee = (amount: CurrencyAmount<Currency> | undefined, feeBps: number) => {
  if (!amount || feeBps <= 0) return amount
  const raw = JSBI.divide(JSBI.multiply(amount.quotient, JSBI.BigInt(10_000 - feeBps)), BPS_BASE)
  return CurrencyAmount.fromRawAmount(amount.currency, raw)
}

const addFee = (amount: CurrencyAmount<Currency> | undefined, feeBps: number) => {
  if (!amount || feeBps <= 0) return amount
  const raw = ceilDivide(JSBI.multiply(amount.quotient, JSBI.BigInt(10_000 + feeBps)), BPS_BASE)
  return CurrencyAmount.fromRawAmount(amount.currency, raw)
}

const getMaxAmountBeforeTakerFee = (amount: CurrencyAmount<Currency> | undefined, feeBps: number) => {
  if (!amount || feeBps <= 0) return amount
  const raw = safeDivide(JSBI.multiply(amount.quotient, BPS_BASE), JSBI.BigInt(10_000 + feeBps))
  return CurrencyAmount.fromRawAmount(amount.currency, raw)
}

export const useTakeLimitOrder = ({
  context,
  fillAmount,
}: {
  context: LimitOrderTakeContext | undefined
  fillAmount: string
}) => {
  const { account, chainId, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const estimateGas = useEstimateGasTxs()
  const invalidateLimitOrderTags = useInvalidateTagLimitOrder()

  const order = context?.order
  const payCurrency = context?.payCurrency
  const receiveCurrency = context?.receiveCurrency

  const { currentData: config } = useGetLOConfigQuery(chainId)
  const contractAddress = order?.contractAddress || config?.contract || ''
  const [getOperatorSignature] = useLazyGetOperatorSignatureQuery()
  const [encodeFillOrder] = useEncodeFillOrderMutation()

  const maxPayAmount = useMemo(() => (context ? getAvailablePayAmount(context) : undefined), [context])
  const parsedPayAmount = useMemo(() => tryParseAmount(fillAmount, payCurrency ?? undefined), [fillAmount, payCurrency])
  const receiveAmount = useMemo(
    () => (context ? getReceiveAmount({ payAmount: parsedPayAmount, context }) : undefined),
    [context, parsedPayAmount],
  )
  const feeBps = getFeeBps(order?.makerTokenFeePercent)
  const receiveAmountAfterFee = useMemo(
    () => (order?.isTakerAssetFee ? receiveAmount : subtractFee(receiveAmount, feeBps)),
    [feeBps, order?.isTakerAssetFee, receiveAmount],
  )
  const thresholdAmount = receiveAmount?.quotient.toString() || '0'

  const balance = useCurrencyBalance(payCurrency, chainId)
  const requiredPayAmount = useMemo(
    () => (order?.isTakerAssetFee ? addFee(parsedPayAmount, feeBps) : parsedPayAmount),
    [feeBps, order?.isTakerAssetFee, parsedPayAmount],
  )
  const maxBalancePayAmount = useMemo(
    () => (order?.isTakerAssetFee ? getMaxAmountBeforeTakerFee(balance, feeBps) : balance),
    [balance, feeBps, order?.isTakerAssetFee],
  )
  const {
    insufficientBalance,
    onWrap,
    wrapAmount: wrapAmountForOrder,
  } = useLimitOrderWrapStep({
    chainId,
    currency: payCurrency,
    amount: requiredPayAmount,
    balance,
  })
  const exceedsAvailableAmount = (() => {
    if (!parsedPayAmount || !maxPayAmount) return false
    return parsedPayAmount.greaterThan(maxPayAmount)
  })()

  const canSubmit =
    !!contractAddress &&
    !!parsedPayAmount &&
    JSBI.greaterThan(parsedPayAmount.quotient, JSBI.BigInt(0)) &&
    !exceedsAvailableAmount &&
    !insufficientBalance

  const [approval, approveCallback] = useApproveCallback({
    amount: requiredPayAmount,
    spender: contractAddress || undefined,
    forceApprove: true,
  })

  const checkApprovalManually = useLimitOrderApproval({
    account,
    amount: requiredPayAmount,
    chainId,
    currency: payCurrency,
    spender: contractAddress,
    passWhenInvalidInput: true,
  })

  const buildFillOrderBody = useCallback(async (): Promise<FillOrderBody> => {
    if (!account || !order || !parsedPayAmount) throw new Error('Wrong input')

    const operatorSignatures = await getOperatorSignature({ chainId, orderIds: [order.id] }).unwrap()
    const operatorSignature = operatorSignatures.find(item => item.id === order.id)
    if (!operatorSignature?.operatorSignature) throw new Error('Missing operator signature')

    return {
      orderId: order.id,
      takingAmount: parsedPayAmount.quotient.toString(),
      thresholdAmount,
      target: account,
      operatorSignature: operatorSignature.operatorSignature,
    }
  }, [account, chainId, getOperatorSignature, order, parsedPayAmount, thresholdAmount])

  const submitFillOrder = useCallback(async () => {
    if (!account || !order || !parsedPayAmount || !contractAddress || !payCurrency || !receiveCurrency) {
      throw new Error('Wrong input')
    }

    const fillBody = await buildFillOrderBody()
    const { encodedData } = await encodeFillOrder(fillBody).unwrap()
    const response = await sendEVMTransaction({
      account,
      contractAddress,
      encodedData,
      value: 0n,
      isSmartConnector,
      errorInfo: {
        name: ErrorName.LimitOrderError,
        wallet: walletKey,
      },
      chainId,
    })

    if (!response?.hash) throw new Error('Transaction was not submitted')

    addTransactionWithType({
      hash: response.hash,
      type: TRANSACTION_TYPE.FILL_LIMIT_ORDER,
      extraInfo: {
        tokenAddressIn: payCurrency.wrapped.address,
        tokenAddressOut: receiveCurrency.wrapped.address,
        tokenSymbolIn: payCurrency.symbol || '',
        tokenSymbolOut: receiveCurrency.symbol || '',
        tokenAmountIn: requiredPayAmount?.toExact() || parsedPayAmount.toExact(),
        tokenAmountOut: receiveAmountAfterFee?.toExact() || receiveAmount?.toExact() || '',
        arbitrary: {
          order_id: order.id,
          type: 'fill_limit_order',
        },
      },
    })
    invalidateLimitOrderTags([
      RTK_QUERY_TAGS.GET_LIMIT_ORDER_LIST,
      RTK_QUERY_TAGS.GET_LIMIT_ORDER_BOOK,
      RTK_QUERY_TAGS.GET_LIMIT_ORDER_INSUFFICIENT,
      RTK_QUERY_TAGS.GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT,
    ])
    return true
  }, [
    account,
    addTransactionWithType,
    buildFillOrderBody,
    chainId,
    contractAddress,
    encodeFillOrder,
    invalidateLimitOrderTags,
    isSmartConnector,
    order,
    parsedPayAmount,
    payCurrency,
    receiveAmount,
    receiveAmountAfterFee,
    receiveCurrency,
    requiredPayAmount,
    walletKey,
  ])

  const processingSteps = useMemo<ProcessingOrderStep[]>(() => {
    const steps: ProcessingOrderStep[] = []
    if (wrapAmountForOrder) steps.push('wrap')
    steps.push('approve')
    steps.push('fill')
    return steps
  }, [wrapAmountForOrder])

  const estimateTxGas = useCallback(async () => {
    if (!account || !order || !parsedPayAmount || !contractAddress) return null
    const fillBody = await buildFillOrderBody()
    const { encodedData } = await encodeFillOrder(fillBody).unwrap()
    return estimateGas({ contractAddress, encodedData })
  }, [account, buildFillOrderBody, contractAddress, encodeFillOrder, estimateGas, order, parsedPayAmount])

  return {
    amount: {
      maxPayAmount,
      maxBalancePayAmount,
      parsedPayAmount,
      requiredPayAmount,
      receiveAmount,
      receiveAmountAfterFee,
      feeBps,
      balance,
      wrapAmount: wrapAmountForOrder,
      exceedsAvailableAmount,
      insufficientBalance,
      canSubmit,
    },
    processing: {
      chainId,
      approval,
      approveCallback: () => approveCallback(requiredPayAmount),
      checkApprovalManually,
      steps: processingSteps,
      onWrap,
      finalStep: 'fill' as const,
      onFinalStep: submitFillOrder,
      onError: (error: unknown, step: ProcessingOrderStep) => {
        const title = step === 'wrap' ? t`Wrap Error` : step === 'approve' ? t`Approve Error` : t`Fill Order Error`
        notify({ type: NotificationType.ERROR, title, summary: getErrorMessage(error) })
      },
    },
    estimateTxGas,
  }
}
