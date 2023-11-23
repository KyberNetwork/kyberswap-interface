import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useCancelOrdersMutation,
  useCreateCancelOrderSignatureMutation,
  useGetEncodeDataMutation,
  useInsertCancellingOrderMutation,
} from 'services/limitOrder'

import { CancelStatus } from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import useCancellingOrders from 'components/swapv2/LimitOrder/useCancellingOrders'
import useSignOrder from 'components/swapv2/LimitOrder/useSignOrder'
import LIMIT_ORDER_ABI from 'constants/abis/limit_order.json'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { getReadingContract } from 'utils/getContract'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/sentry'
import { formatSignature } from 'utils/transaction'
import useEstimateGasTxs from 'utils/useEstimateGasTxs'

import { formatAmountOrder, getErrorMessage, getPayloadTracking } from '../helpers'
import { CancelOrderFunction, CancelOrderResponse, CancelOrderType, LimitOrder } from '../type'

const useGetEncodeLimitOrder = () => {
  const { account } = useActiveWeb3React()
  const [getEncodeData] = useGetEncodeDataMutation()
  const { readProvider } = useKyberSwapConfig()

  return useCallback(
    async ({ orders, isCancelAll }: { orders: LimitOrder[]; isCancelAll: boolean | undefined }) => {
      if (!readProvider) throw new Error()
      if (isCancelAll) {
        const contracts = [...new Set(orders.map(e => e.contractAddress))]
        const result = []
        for (const address of contracts) {
          const limitOrderContract = getReadingContract(address, LIMIT_ORDER_ABI, readProvider)
          const [{ encodedData }, nonce] = await Promise.all([
            getEncodeData({ orderIds: [], isCancelAll }).unwrap(),
            limitOrderContract?.nonce?.(account),
          ])
          result.push({ encodedData, nonce, contractAddress: address })
        }
        return result
      }
      // cancel single order
      const { encodedData } = await getEncodeData({
        orderIds: orders.map(e => e.id),
      }).unwrap()
      return [{ encodedData, contractAddress: orders[0]?.contractAddress, nonce: '' }]
    },
    [account, getEncodeData, readProvider],
  )
}

const useRequestCancelOrder = ({
  orders,
  isCancelAll,
  totalOrder,
}: {
  orders: LimitOrder[]
  isCancelAll: boolean
  totalOrder: number
}) => {
  const { setCancellingOrders, cancellingOrdersIds } = useCancellingOrders()
  const { account, chainId, networkInfo, walletKey } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)
  const [insertCancellingOrder] = useInsertCancellingOrderMutation()
  const [createCancelSignature] = useCreateCancelOrderSignatureMutation()
  const [cancelOrderRequest] = useCancelOrdersMutation()
  const addTransactionWithType = useTransactionAdder()
  const getEncodeData = useGetEncodeLimitOrder()

  const requestHardCancelOrder = async (order: LimitOrder | undefined) => {
    if (!library || !account) return Promise.reject('Wrong input')
    const newOrders = isCancelAll ? orders.map(e => e.id) : order?.id ? [order?.id] : []

    const sendTransaction = async (encodedData: string, contract: string, payload: any) => {
      const response = await sendEVMTransaction({
        account,
        library,
        contractAddress: contract,
        encodedData,
        value: BigNumber.from(0),
        sentryInfo: {
          name: ErrorName.LimitOrderError,
          wallet: walletKey,
        },
      })
      if (response?.hash) {
        insertCancellingOrder({
          maker: account,
          chainId: chainId.toString(),
          txHash: response.hash,
          contractAddress: contract ?? '',
          ...payload,
        }).unwrap()
      }

      if (response) {
        const {
          makerAssetDecimals,
          takerAssetDecimals,
          takerAssetSymbol,
          takingAmount,
          makingAmount,
          takerAsset,
          makerAssetSymbol,
          makerAsset,
        } = order || ({} as LimitOrder)
        const amountIn = order ? formatAmountOrder(makingAmount, makerAssetDecimals) : ''
        const amountOut = order ? formatAmountOrder(takingAmount, takerAssetDecimals) : ''
        addTransactionWithType({
          ...response,
          type: TRANSACTION_TYPE.CANCEL_LIMIT_ORDER,
          extraInfo: order
            ? {
                tokenAddressIn: makerAsset,
                tokenAddressOut: takerAsset,
                tokenSymbolIn: makerAssetSymbol,
                tokenSymbolOut: takerAssetSymbol,
                tokenAmountIn: amountIn,
                tokenAmountOut: amountOut,
                arbitrary: getPayloadTracking(order, networkInfo.name),
              }
            : { arbitrary: { totalOrder } },
        })
      }
    }

    if (isCancelAll) {
      const data = await getEncodeData({ isCancelAll, orders })
      for (const item of data) {
        const { contractAddress, nonce, encodedData } = item
        await sendTransaction(encodedData, contractAddress, { nonce: nonce.toNumber() })
      }
    } else {
      const data = await getEncodeData({ isCancelAll, orders: order ? [order] : [] })
      const { contractAddress, encodedData } = data[0] || {}
      await sendTransaction(encodedData, contractAddress ?? '', { orderIds: newOrders })
    }
    setCancellingOrders(cancellingOrdersIds.concat(newOrders))
    return
  }

  const requestGasLessCancelOrder = async (orders: LimitOrder[]) => {
    if (!library || !account) return Promise.reject('Wrong input')
    const orderIds = orders.map(e => e.id)
    const cancelPayload = { chainId: chainId.toString(), maker: account, orderIds }
    const messagePayload = await createCancelSignature(cancelPayload).unwrap()

    const rawSignature = await library.send('eth_signTypedData_v4', [account, JSON.stringify(messagePayload)])
    const signature = formatSignature(rawSignature)
    const resp = await cancelOrderRequest({ ...cancelPayload, signature }).unwrap()

    const operatorSignatureExpiredAt = resp?.orders?.[0]?.operatorSignatureExpiredAt
    operatorSignatureExpiredAt && setCancellingOrders(cancellingOrdersIds.concat(orderIds))
    return resp
  }

  const { removeOrderNeedCreated, pushOrderNeedCreated } = useLimitActionHandlers()
  const signOrder = useSignOrder(setFlowState)
  const { orderEditing } = useLimitState()

  const onCancelOrder = async ({
    orders,
    cancelType,
    isEdit,
  }: {
    orders: LimitOrder[]
    cancelType: CancelOrderType
    isEdit?: boolean
  }) => {
    try {
      setFlowState({
        ...TRANSACTION_STATE_DEFAULT,
        pendingText: t`Canceling your orders`,
        showConfirm: true,
        attemptingTxn: true,
      })
      if (orderEditing && isEdit) {
        // pre-sign order
        const { signature, salt } = await signOrder(orderEditing)
        pushOrderNeedCreated({ ...orderEditing, salt, signature })
      }
      const gaslessCancel = cancelType === CancelOrderType.GAS_LESS_CANCEL
      const resp = await (gaslessCancel ? requestGasLessCancelOrder(orders) : requestHardCancelOrder(orders?.[0]))
      setFlowState(state => ({ ...state, attemptingTxn: false, showConfirm: !!(isEdit && gaslessCancel) }))
      return resp
    } catch (error) {
      if (isEdit && orders[0]) removeOrderNeedCreated(orders[0].id)
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: getErrorMessage(error),
      }))
      throw error // keep origin error
    }
  }

  return { flowState, setFlowState, onCancelOrder }
}

export const useProcessCancelOrder = ({
  isOpen,
  onDismiss,
  onSubmit,
  getOrders,
  isEdit,
}: {
  onSubmit: CancelOrderFunction
  onDismiss: () => void
  isOpen: boolean
  getOrders: (v: boolean) => LimitOrder[]
  isEdit?: boolean
}) => {
  const { chainId } = useActiveWeb3React()
  const [expiredTime, setExpiredTime] = useState(0)
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>(CancelStatus.WAITING)
  const controller = useRef(new AbortController())

  const onResetState = useCallback(() => {
    setExpiredTime(0)
    setCancelStatus(CancelStatus.WAITING)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      onResetState()
    }
    return () => {
      controller?.current?.abort()
      controller.current = new AbortController()
    }
  }, [isOpen, onResetState])

  useEffect(() => {
    onResetState()
  }, [chainId, onResetState])

  const requestCancel = async (type: CancelOrderType) => {
    const signal = controller.current.signal
    const gasLessCancel = type === CancelOrderType.GAS_LESS_CANCEL
    const orders = getOrders(gasLessCancel)
    try {
      const data: CancelOrderResponse = await onSubmit({ orders, cancelType: type, isEdit })
      if (signal.aborted) return
      setCancelStatus(gasLessCancel ? CancelStatus.COUNTDOWN : CancelStatus.WAITING)
      const expired = data?.orders?.[0]?.operatorSignatureExpiredAt
      if (expired) {
        setExpiredTime(expired)
        if (expired * 1000 < Date.now()) {
          isEdit ? onDismiss() : setCancelStatus(CancelStatus.CANCEL_DONE)
        }
      } else onDismiss()
    } catch (error) {
      if (signal.aborted) return
      setExpiredTime(0)
      setCancelStatus(expiredTime ? CancelStatus.COUNTDOWN : CancelStatus.WAITING)
    }
  }

  const onClickGaslessCancel = () => requestCancel(CancelOrderType.GAS_LESS_CANCEL)
  const onClickHardCancel = () => requestCancel(CancelOrderType.HARD_CANCEL)

  return { onClickGaslessCancel, onClickHardCancel, expiredTime, cancelStatus, setCancelStatus }
}

export const useEstimateFee = ({ isCancelAll = false, orders }: { isCancelAll?: boolean; orders: LimitOrder[] }) => {
  const getEncodeData = useGetEncodeLimitOrder()
  const estimateGas = useEstimateGasTxs()
  const [gasFeeHardCancel, setGasFeeHardCancel] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    const fetchEncode = async () => {
      try {
        if (!orders.length) throw new Error()
        const resp = await getEncodeData({ orders, isCancelAll })
        if (signal.aborted) return
        const data = await Promise.all(resp.map(estimateGas))
        if (signal.aborted) return
        const gas = data.reduce((rs, item) => rs + (item.gasInUsd || 0), 0)
        setGasFeeHardCancel(gas + '')
      } catch (error) {
        if (signal.aborted) return
        setGasFeeHardCancel('')
      }
    }

    setTimeout(() => {
      if (signal.aborted) return
      fetchEncode()
    }, 100)

    return () => controller.abort()
  }, [getEncodeData, orders, estimateGas, isCancelAll])

  return gasFeeHardCancel
}

export default useRequestCancelOrder
