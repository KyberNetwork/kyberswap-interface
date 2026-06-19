import { Currency, CurrencyAmount, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { readContract, waitForTransactionReceipt } from '@wagmi/core'
import JSBI from 'jsbi'
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'
import {
  FillOrderBody,
  useEncodeFillOrderMutation,
  useGetLOConfigQuery,
  useLazyGetOperatorSignatureQuery,
} from 'services/limitOrder'

import { NotificationType } from 'components/Announcement/type'
import { getErrorMessage } from 'components/LimitOrder/helpers'
import { LimitOrderTakeContext } from 'components/LimitOrder/types'
import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
import { RTK_QUERY_TAGS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useInvalidateTagLimitOrder } from 'hooks/useInvalidateTags'
import useWrapCallback from 'hooks/useWrapCallback'
import { useNotify } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import useEstimateGasTxs from 'utils/useEstimateGasTxs'
import { Address } from 'utils/viem'

export type TakeOrderStep = 'wrap' | 'approve' | 'fill'
export type TakeOrderStepStatus = 'idle' | 'active' | 'success' | 'error'

export type TakeOrderProcessingState = {
  show: boolean
  steps: TakeOrderStep[]
  currentStep?: TakeOrderStep
  errorStep?: TakeOrderStep
  completedSteps: TakeOrderStep[]
  txHash?: string
}

export const DEFAULT_TAKE_ORDER_PROCESSING: TakeOrderProcessingState = {
  show: false,
  steps: [],
  completedSteps: [],
}

const APPROVAL_CHECK_RETRY_COUNT = 8
const APPROVAL_CHECK_RETRY_DELAY = 2_000
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const safeDivide = (numerator: JSBI, denominator: JSBI) => {
  if (JSBI.equal(denominator, JSBI.BigInt(0))) return JSBI.BigInt(0)
  return JSBI.divide(numerator, denominator)
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
  const raw = JSBI.divide(JSBI.multiply(amount.quotient, JSBI.BigInt(10_000 - feeBps)), JSBI.BigInt(10_000))
  return CurrencyAmount.fromRawAmount(amount.currency, raw)
}

export const useTakeLimitOrder = ({
  context,
  fillAmount,
  processing,
  setProcessing,
}: {
  context: LimitOrderTakeContext | undefined
  fillAmount: string
  processing: TakeOrderProcessingState
  setProcessing: Dispatch<SetStateAction<TakeOrderProcessingState>>
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
  const feeBps = useMemo(() => getFeeBps(order?.makerTokenFeePercent), [order?.makerTokenFeePercent])
  const receiveAmountAfterFee = useMemo(() => subtractFee(receiveAmount, feeBps), [feeBps, receiveAmount])
  const thresholdAmount = receiveAmount?.quotient.toString() || '0'
  const balance = useCurrencyBalance(payCurrency, chainId)
  const nativeCurrency = NativeCurrencies[chainId]
  const nativeBalance = useCurrencyBalance(nativeCurrency, chainId)
  const isWrappedNativePay = !!payCurrency?.equals(WETH[chainId])
  const wrapAmountForOrder = useMemo(() => {
    if (!payCurrency || !isWrappedNativePay || !parsedPayAmount || !balance?.currency.equals(payCurrency)) {
      return undefined
    }
    if (!balance.lessThan(parsedPayAmount)) return undefined
    return CurrencyAmount.fromRawAmount(nativeCurrency, JSBI.subtract(parsedPayAmount.quotient, balance.quotient))
  }, [balance, isWrappedNativePay, nativeCurrency, parsedPayAmount, payCurrency])
  const insufficientBalance = useMemo(() => {
    if (!parsedPayAmount) return false
    if (!balance?.currency.equals(parsedPayAmount.currency)) return true
    if (!balance.lessThan(parsedPayAmount)) return false
    if (!isWrappedNativePay || !wrapAmountForOrder || !nativeBalance?.currency.equals(nativeCurrency)) return true
    return nativeBalance.lessThan(wrapAmountForOrder)
  }, [balance, isWrappedNativePay, nativeBalance, nativeCurrency, parsedPayAmount, wrapAmountForOrder])
  const exceedsAvailableAmount = useMemo(() => {
    if (!parsedPayAmount || !maxPayAmount) return false
    return parsedPayAmount.greaterThan(maxPayAmount)
  }, [maxPayAmount, parsedPayAmount])

  const canSubmit =
    !!contractAddress &&
    !!parsedPayAmount &&
    JSBI.greaterThan(parsedPayAmount.quotient, JSBI.BigInt(0)) &&
    !exceedsAvailableAmount &&
    !insufficientBalance

  const { execute: onWrap } = useWrapCallback(
    wrapAmountForOrder ? nativeCurrency : undefined,
    WETH[chainId],
    wrapAmountForOrder?.toExact(),
    true,
    chainId,
  )

  const [approval, approveCallback] = useApproveCallback(parsedPayAmount, contractAddress || undefined, true)

  const checkApprovalManually = useCallback(async () => {
    if (!payCurrency || payCurrency.isNative || !account || !contractAddress || !parsedPayAmount) return true

    const allowance = (await readContract(wagmiConfig, {
      address: payCurrency.wrapped.address as Address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, contractAddress],
      chainId: chainId as number,
    })) as bigint

    const allowanceAmount = TokenAmount.fromRawAmount(payCurrency.wrapped, allowance.toString())
    return allowanceAmount.greaterThan(parsedPayAmount) || allowanceAmount.equalTo(parsedPayAmount)
  }, [account, chainId, contractAddress, parsedPayAmount, payCurrency])

  const markStepSuccess = useCallback(
    (step: TakeOrderStep, txHash?: string) => {
      setProcessing(state => {
        if (!state.show || state.currentStep !== step) return state
        const completedSteps = state.completedSteps.includes(step)
          ? state.completedSteps
          : [...state.completedSteps, step]
        const nextStep = state.steps[state.steps.indexOf(step) + 1]
        return { ...state, currentStep: nextStep, completedSteps, txHash: txHash || state.txHash }
      })
    },
    [setProcessing],
  )

  const markStepError = useCallback(
    (step: TakeOrderStep) => {
      setProcessing(state => {
        if (!state.show || state.currentStep !== step) return state
        return { ...state, errorStep: step }
      })
    },
    [setProcessing],
  )

  const dismissProcessing = useCallback(() => {
    setProcessing(DEFAULT_TAKE_ORDER_PROCESSING)
  }, [setProcessing])

  const waitForManualApproval = useCallback(async () => {
    for (let attempt = 0; attempt < APPROVAL_CHECK_RETRY_COUNT; attempt++) {
      const approved = await checkApprovalManually()
      if (approved) return true
      await sleep(APPROVAL_CHECK_RETRY_DELAY)
    }
    return false
  }, [checkApprovalManually])

  const runWrapStep = useCallback(() => {
    return (async () => {
      try {
        const hash = await onWrap?.()
        if (!hash) {
          markStepError('wrap')
          return false
        }
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          chainId: chainId as (typeof wagmiConfig)['chains'][number]['id'],
          hash: hash as `0x${string}`,
        })
        if (receipt.status === 'reverted') {
          markStepError('wrap')
          return false
        }
        markStepSuccess('wrap')
        return true
      } catch (error) {
        notify({ type: NotificationType.ERROR, title: t`Wrap Error`, summary: getErrorMessage(error) })
        markStepError('wrap')
        return false
      }
    })()
  }, [chainId, markStepError, markStepSuccess, notify, onWrap])

  const runApproveStep = useCallback(() => {
    return (async () => {
      try {
        if (await checkApprovalManually()) {
          markStepSuccess('approve')
          return true
        }
        if (approval !== ApprovalState.PENDING) {
          await approveCallback(parsedPayAmount)
        }
        const approved = await waitForManualApproval()
        if (approved) {
          markStepSuccess('approve')
          return true
        }
        markStepError('approve')
        return false
      } catch (error) {
        notify({ type: NotificationType.ERROR, title: t`Approve Error`, summary: getErrorMessage(error) })
        markStepError('approve')
        return false
      }
    })()
  }, [
    approveCallback,
    approval,
    checkApprovalManually,
    markStepError,
    markStepSuccess,
    notify,
    parsedPayAmount,
    waitForManualApproval,
  ])

  const runFillStep = useCallback(() => {
    return (async () => {
      try {
        if (!account || !order || !parsedPayAmount || !contractAddress || !payCurrency || !receiveCurrency) {
          throw new Error('Wrong input')
        }

        const operatorSignatures = await getOperatorSignature({ chainId, orderIds: [order.id] }).unwrap()
        const operatorSignature = operatorSignatures.find(item => item.id === order.id)
        if (!operatorSignature?.operatorSignature) throw new Error('Missing operator signature')

        const fillBody: FillOrderBody = {
          orderId: order.id,
          takingAmount: parsedPayAmount.quotient.toString(),
          thresholdAmount,
          target: account,
          operatorSignature: operatorSignature.operatorSignature,
        }
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
          type: TRANSACTION_TYPE.SWAP,
          extraInfo: {
            tokenAddressIn: payCurrency.wrapped.address,
            tokenAddressOut: receiveCurrency.wrapped.address,
            tokenSymbolIn: payCurrency.symbol || '',
            tokenSymbolOut: receiveCurrency.symbol || '',
            tokenAmountIn: parsedPayAmount.toExact(),
            tokenAmountOut: receiveAmountAfterFee?.toExact() || receiveAmount?.toExact() || '',
            arbitrary: {
              order_id: order.id,
              type: 'fill_limit_order',
            },
          },
        })
        invalidateLimitOrderTags([
          RTK_QUERY_TAGS.GET_LIMIT_ORDER_LIST,
          RTK_QUERY_TAGS.GET_LIMIT_ORDER_INSUFFICIENT,
          RTK_QUERY_TAGS.GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT,
        ])
        markStepSuccess('fill', response.hash)
        return true
      } catch (error) {
        notify({ type: NotificationType.ERROR, title: t`Fill Order Error`, summary: getErrorMessage(error) })
        markStepError('fill')
        return false
      }
    })()
  }, [
    account,
    addTransactionWithType,
    chainId,
    contractAddress,
    encodeFillOrder,
    getOperatorSignature,
    invalidateLimitOrderTags,
    isSmartConnector,
    markStepError,
    markStepSuccess,
    notify,
    order,
    parsedPayAmount,
    payCurrency,
    receiveAmount,
    receiveAmountAfterFee,
    receiveCurrency,
    thresholdAmount,
    walletKey,
  ])

  const runStep = useCallback(
    (step: TakeOrderStep) => {
      if (step === 'wrap') {
        return runWrapStep()
      }

      if (step === 'approve') {
        return runApproveStep()
      }

      return runFillStep()
    },
    [runApproveStep, runFillStep, runWrapStep],
  )

  const runSequence = useCallback(
    async (firstStep: TakeOrderStep, steps: TakeOrderStep[]) => {
      const startIndex = steps.indexOf(firstStep)
      if (startIndex < 0) return

      for (const step of steps.slice(startIndex)) {
        setProcessing(state => (state.show ? { ...state, currentStep: step, errorStep: undefined } : state))

        const isStepSuccess = await runStep(step)
        if (!isStepSuccess) return
      }
    },
    [runStep, setProcessing],
  )

  const buildProcessingSteps = useCallback((): TakeOrderStep[] => {
    const steps: TakeOrderStep[] = []
    if (wrapAmountForOrder) steps.push('wrap')
    steps.push('approve')
    steps.push('fill')
    return steps
  }, [wrapAmountForOrder])

  const start = useCallback(() => {
    if (!contractAddress || !parsedPayAmount || insufficientBalance || exceedsAvailableAmount) return

    const steps = buildProcessingSteps()
    const firstStep = steps[0]
    if (!firstStep) return

    setProcessing({
      show: true,
      steps,
      currentStep: firstStep,
      completedSteps: [],
    })
    void runSequence(firstStep, steps)
  }, [
    buildProcessingSteps,
    contractAddress,
    exceedsAvailableAmount,
    insufficientBalance,
    parsedPayAmount,
    runSequence,
    setProcessing,
  ])

  const retryStep = useCallback(
    (step: TakeOrderStep) => {
      if (processing.errorStep !== step) return

      setProcessing(state => ({
        ...state,
        currentStep: step,
        errorStep: undefined,
      }))
      void runSequence(step, processing.steps)
    },
    [processing.errorStep, processing.steps, runSequence, setProcessing],
  )

  const estimateTxGas = useCallback(async () => {
    if (!account || !order || !parsedPayAmount || !contractAddress) return null
    const operatorSignatures = await getOperatorSignature({ chainId, orderIds: [order.id] }).unwrap()
    const operatorSignature = operatorSignatures.find(item => item.id === order.id)
    if (!operatorSignature?.operatorSignature) return null
    const { encodedData } = await encodeFillOrder({
      orderId: order.id,
      takingAmount: parsedPayAmount.quotient.toString(),
      thresholdAmount,
      target: account,
      operatorSignature: operatorSignature.operatorSignature,
    }).unwrap()
    return estimateGas({ contractAddress, encodedData })
  }, [
    account,
    chainId,
    contractAddress,
    encodeFillOrder,
    estimateGas,
    getOperatorSignature,
    order,
    parsedPayAmount,
    thresholdAmount,
  ])

  return {
    amount: {
      maxPayAmount,
      parsedPayAmount,
      receiveAmount,
      receiveAmountAfterFee,
      feeBps,
      balance,
      exceedsAvailableAmount,
      insufficientBalance,
      canSubmit,
    },
    processing: {
      state: processing,
      start,
      dismiss: dismissProcessing,
      retryStep,
    },
    estimateTxGas,
  }
}
