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
import {
  addFee,
  getAvailablePayAmount,
  getFeeBps,
  getMaxAmountBeforeTakerFee,
  getReceiveAmount,
  hasPositiveAmount,
  isExceedsAvailableAmount,
  subtractFee,
} from 'components/LimitOrder/TakeOrder/utils'
import { useLimitOrderApproval } from 'components/LimitOrder/hooks/useLimitOrderApproval'
import { useLimitOrderWrapStep } from 'components/LimitOrder/hooks/useLimitOrderWrapStep'
import { LimitOrderTakeContext } from 'components/LimitOrder/types'
import { getErrorMessage } from 'components/LimitOrder/utils'
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

type UseTakeLimitOrderProps = {
  context: LimitOrderTakeContext
  fillAmount: string
}

export const useTakeLimitOrder = ({ context, fillAmount }: UseTakeLimitOrderProps) => {
  const { account, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const estimateGas = useEstimateGasTxs()
  const invalidateLimitOrderTags = useInvalidateTagLimitOrder()

  const order = context.order
  const payCurrency = context.payCurrency
  const receiveCurrency = context.receiveCurrency
  const chainId = order.chainId

  const { currentData: config } = useGetLOConfigQuery(chainId)
  const contractAddress = order.contractAddress || config?.contract || ''
  const [getOperatorSignature] = useLazyGetOperatorSignatureQuery()
  const [encodeFillOrder] = useEncodeFillOrderMutation()

  const maxPayAmount = useMemo(() => getAvailablePayAmount(context), [context])
  const parsedPayAmount = useMemo(() => tryParseAmount(fillAmount, payCurrency), [fillAmount, payCurrency])
  const feeBps = getFeeBps(order.makerTokenFeePercent)

  const receiveAmount = useMemo(
    () => getReceiveAmount({ payAmount: parsedPayAmount, context }),
    [context, parsedPayAmount],
  )
  const receiveAmountAfterFee = useMemo(
    () => (order.isTakerAssetFee ? receiveAmount : subtractFee(receiveAmount, feeBps)),
    [feeBps, order.isTakerAssetFee, receiveAmount],
  )
  const requiredPayAmount = useMemo(
    () => (order.isTakerAssetFee ? addFee(parsedPayAmount, feeBps) : parsedPayAmount),
    [feeBps, order.isTakerAssetFee, parsedPayAmount],
  )
  const thresholdAmount = receiveAmount?.quotient.toString() || '0'

  const balance = useCurrencyBalance(payCurrency, chainId)
  const maxBalancePayAmount = useMemo(
    () => (order.isTakerAssetFee ? getMaxAmountBeforeTakerFee(balance, feeBps) : balance),
    [balance, feeBps, order.isTakerAssetFee],
  )
  const defaultPayAmount = useMemo(() => {
    if (!maxPayAmount) return undefined
    if (!maxBalancePayAmount) return maxPayAmount
    if (JSBI.equal(maxBalancePayAmount.quotient, JSBI.BigInt(0))) return maxPayAmount

    return maxBalancePayAmount.lessThan(maxPayAmount) ? maxBalancePayAmount : maxPayAmount
  }, [maxBalancePayAmount, maxPayAmount])

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

  const canSubmit =
    !!account &&
    !!contractAddress &&
    hasPositiveAmount(parsedPayAmount) &&
    !isExceedsAvailableAmount(parsedPayAmount, maxPayAmount) &&
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
    if (!account || !parsedPayAmount) throw new Error('Wrong input')

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
  }, [account, getOperatorSignature, order, chainId, parsedPayAmount, thresholdAmount])

  const estimateTxGas = useCallback(async () => {
    if (!account || !order || !parsedPayAmount || !contractAddress) return null
    const fillBody = await buildFillOrderBody()
    const { encodedData } = await encodeFillOrder(fillBody).unwrap()
    return estimateGas({ contractAddress, encodedData })
  }, [account, buildFillOrderBody, contractAddress, encodeFillOrder, estimateGas, order, parsedPayAmount])

  const submitFillOrder = useCallback(async () => {
    if (!account || !parsedPayAmount || !contractAddress) {
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
      desiredChainId: chainId,
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

  return {
    amount: {
      maxPayAmount,
      maxBalancePayAmount,
      defaultPayAmount,
      parsedPayAmount,
      requiredPayAmount,
      receiveAmount,
      receiveAmountAfterFee,
      feeBps,
      balance,
      wrapAmount: wrapAmountForOrder,
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
