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
  const feeBps = getFeeBps(order?.makerTokenFeePercent)
  const receiveAmountAfterFee = subtractFee(receiveAmount, feeBps)
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
  const insufficientBalance = (() => {
    if (!parsedPayAmount) return false
    if (!balance?.currency.equals(parsedPayAmount.currency)) return true
    if (!balance.lessThan(parsedPayAmount)) return false
    if (!isWrappedNativePay || !wrapAmountForOrder || !nativeBalance?.currency.equals(nativeCurrency)) return true
    return nativeBalance.lessThan(wrapAmountForOrder)
  })()
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

  const { execute: onWrap } = useWrapCallback(
    wrapAmountForOrder ? nativeCurrency : undefined,
    WETH[chainId],
    wrapAmountForOrder?.toExact(),
    true,
    chainId,
  )

  const [approval, approveCallback] = useApproveCallback(parsedPayAmount, contractAddress || undefined, true)

  const checkApprovalManually = async () => {
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
  }

  const markStepSuccess = (step: TakeOrderStep, txHash?: string) => {
    setProcessing(state => {
      if (!state.show || state.currentStep !== step) return state
      const completedSteps = state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step]
      const nextStep = state.steps[state.steps.indexOf(step) + 1]
      return { ...state, currentStep: nextStep, completedSteps, txHash: txHash || state.txHash }
    })
  }

  const markStepError = (step: TakeOrderStep) => {
    setProcessing(state => {
      if (!state.show || state.currentStep !== step) return state
      return { ...state, errorStep: step }
    })
  }

  const dismissProcessing = () => {
    setProcessing(DEFAULT_TAKE_ORDER_PROCESSING)
  }

  const waitForManualApproval = async () => {
    for (let attempt = 0; attempt < APPROVAL_CHECK_RETRY_COUNT; attempt++) {
      const approved = await checkApprovalManually()
      if (approved) return true
      await sleep(APPROVAL_CHECK_RETRY_DELAY)
    }
    return false
  }

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

  const runWrapStep = async () => {
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
  }

  const runApproveStep = async () => {
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
  }

  const runFillStep = async () => {
    try {
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
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_BOOK,
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
  }

  const runStep = (step: TakeOrderStep) => {
    if (step === 'wrap') {
      return runWrapStep()
    }

    if (step === 'approve') {
      return runApproveStep()
    }

    return runFillStep()
  }

  const runSequence = async (firstStep: TakeOrderStep, steps: TakeOrderStep[]) => {
    const startIndex = steps.indexOf(firstStep)
    if (startIndex < 0) return

    for (const step of steps.slice(startIndex)) {
      setProcessing(state => (state.show ? { ...state, currentStep: step, errorStep: undefined } : state))

      const isStepSuccess = await runStep(step)
      if (!isStepSuccess) return
    }
  }

  const buildProcessingSteps = (): TakeOrderStep[] => {
    const steps: TakeOrderStep[] = []
    if (wrapAmountForOrder) steps.push('wrap')
    steps.push('approve')
    steps.push('fill')
    return steps
  }

  const start = () => {
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
  }

  const retryStep = (step: TakeOrderStep) => {
    setProcessing(state => ({
      ...state,
      currentStep: step,
      errorStep: undefined,
    }))
    void runSequence(step, processing.steps)
  }

  const estimateTxGas = useCallback(async () => {
    if (!account || !order || !parsedPayAmount || !contractAddress) return null
    const fillBody = await buildFillOrderBody()
    const { encodedData } = await encodeFillOrder(fillBody).unwrap()
    return estimateGas({ contractAddress, encodedData })
  }, [account, buildFillOrderBody, contractAddress, encodeFillOrder, estimateGas, order, parsedPayAmount])

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
