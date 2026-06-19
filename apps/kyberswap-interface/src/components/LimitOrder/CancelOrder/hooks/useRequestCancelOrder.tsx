import { readContract } from '@wagmi/core'
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import {
  useCancelOrdersMutation,
  useCreateCancelOrderSignatureMutation,
  useGetEncodeDataMutation,
  useInsertCancellingOrderMutation,
} from 'services/limitOrder'

import { CancelStatus } from 'components/LimitOrder/CancelOrder/CancelOrderModal'
import { useCancellingOrders } from 'components/LimitOrder/CancelOrder/hooks/useCancellingOrders'
import { formatAmountOrder, getErrorMessage, getPayloadTracking } from 'components/LimitOrder/helpers'
import { CancelOrderFunction, CancelOrderType, LimitOrder } from 'components/LimitOrder/types'
import { wagmiConfig } from 'components/Web3Provider'
import { LIMIT_ORDER_ABI } from 'constants/abis'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { formatSignature } from 'utils/transaction'
import { ErrorName } from 'utils/transactionError'
import useEstimateGasTxs from 'utils/useEstimateGasTxs'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

type CancellingOrderPayload = { nonce: number } | { orderIds: number[] }

type UseRequestCancelOrderArgs = {
  orders: LimitOrder[]
  isCancelAll: boolean
  onRequestStart?: () => void
  onRequestSuccess?: () => void
  onRequestError?: (message: string) => void
}

type UseProcessCancelOrderArgs = {
  onSubmit: CancelOrderFunction
  onDismiss?: () => void
  isOpen: boolean
  getOrders: (v: boolean) => LimitOrder[]
  expiredTime: number
  setExpiredTime: Dispatch<SetStateAction<number>>
  setCancelStatus: Dispatch<SetStateAction<CancelStatus>>
}

type UseEstimateFeeArgs = {
  isCancelAll?: boolean
  orders: LimitOrder[]
}

const useGetEncodeLimitOrder = () => {
  const { account, chainId } = useActiveWeb3React()
  const [getEncodeData] = useGetEncodeDataMutation()

  return useCallback(
    async ({ orders, isCancelAll }: { orders: LimitOrder[]; isCancelAll: boolean | undefined }) => {
      if (!account) throw new Error()
      if (isCancelAll) {
        const contracts = [...new Set(orders.map(e => e.contractAddress))]
        const result = []
        for (const address of contracts) {
          const [{ encodedData }, nonce] = await Promise.all([
            getEncodeData({ orderIds: [], isCancelAll }).unwrap(),
            readContract(wagmiConfig, {
              address: address as Address,
              abi: LIMIT_ORDER_ABI,
              functionName: 'nonce',
              args: [account],
              chainId: chainId as number,
            }),
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
    [account, chainId, getEncodeData],
  )
}

export const useRequestCancelOrder = ({
  orders,
  isCancelAll,
  onRequestStart,
  onRequestSuccess,
  onRequestError,
}: UseRequestCancelOrderArgs) => {
  const { setCancellingOrders, cancellingOrdersIds } = useCancellingOrders()
  const { account, chainId, networkInfo, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const [insertCancellingOrder] = useInsertCancellingOrderMutation()
  const [createCancelSignature] = useCreateCancelOrderSignatureMutation()
  const [cancelOrderRequest] = useCancelOrdersMutation()
  const addTransactionWithType = useTransactionAdder()
  const getEncodeData = useGetEncodeLimitOrder()

  const requestHardCancelOrder = async (order: LimitOrder | undefined) => {
    if (!account) return Promise.reject('Wrong input')
    const newOrders = isCancelAll ? orders.map(e => e.id) : order?.id ? [order?.id] : []

    const sendTransaction = async (encodedData: string, contract: string, payload: CancellingOrderPayload) => {
      const response = await sendEVMTransaction({
        account,
        contractAddress: contract,
        encodedData,
        value: 0n,
        isSmartConnector,
        errorInfo: {
          name: ErrorName.LimitOrderError,
          wallet: walletKey,
        },
        chainId,
      })
      if (response?.hash) {
        await insertCancellingOrder({
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
          hash: response.hash,
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
            : { arbitrary: { totalOrder: orders.length } },
        })
      }
    }

    if (isCancelAll) {
      const data = await getEncodeData({ isCancelAll, orders })
      for (const item of data) {
        const { contractAddress, nonce, encodedData } = item
        await sendTransaction(encodedData, contractAddress, { nonce: Number(nonce as bigint) })
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
    if (!account) return Promise.reject('Wrong input')
    const orderIds = orders.map(e => e.id)
    const cancelPayload = { chainId: chainId.toString(), maker: account, orderIds }
    const messagePayload = await createCancelSignature(cancelPayload).unwrap()

    const rawSignature = await signTypedDataRaw({
      chainId: chainId,
      account: account as Address,
      typedData: messagePayload,
    })
    const signature = formatSignature(rawSignature)
    const resp = await cancelOrderRequest({ ...cancelPayload, signature }).unwrap()

    const operatorSignatureExpiredAt = resp?.orders?.[0]?.operatorSignatureExpiredAt
    operatorSignatureExpiredAt && setCancellingOrders(cancellingOrdersIds.concat(orderIds))
    return resp
  }

  const onCancelOrder = async ({ orders, cancelType }: { orders: LimitOrder[]; cancelType: CancelOrderType }) => {
    try {
      onRequestStart?.()
      const gaslessCancel = cancelType === CancelOrderType.GAS_LESS_CANCEL
      const resp = await (gaslessCancel ? requestGasLessCancelOrder(orders) : requestHardCancelOrder(orders?.[0]))
      onRequestSuccess?.()
      return resp
    } catch (error) {
      onRequestError?.(getErrorMessage(error))
      throw error // keep origin error
    }
  }

  return { onCancelOrder }
}

export const useProcessCancelOrder = ({
  isOpen,
  onDismiss,
  onSubmit,
  getOrders,
  expiredTime,
  setExpiredTime,
  setCancelStatus,
}: UseProcessCancelOrderArgs) => {
  const { chainId } = useActiveWeb3React()
  const controller = useRef(new AbortController())

  const onResetState = useCallback(() => {
    setExpiredTime(0)
    setCancelStatus(CancelStatus.WAITING)
  }, [setCancelStatus, setExpiredTime])

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
      const data = await onSubmit({ orders, cancelType: type })
      if (signal.aborted) return
      setCancelStatus(gasLessCancel ? CancelStatus.COUNTDOWN : CancelStatus.WAITING)
      const expired = data?.orders?.[0]?.operatorSignatureExpiredAt
      if (expired) {
        setExpiredTime(expired)
        if (expired * 1000 < Date.now()) {
          setCancelStatus(CancelStatus.CANCEL_DONE)
        }
      } else onDismiss?.()
    } catch (error) {
      if (signal.aborted) return
      setExpiredTime(0)
      setCancelStatus(expiredTime ? CancelStatus.COUNTDOWN : CancelStatus.WAITING)
    }
  }

  const onClickGaslessCancel = () => requestCancel(CancelOrderType.GAS_LESS_CANCEL)
  const onClickHardCancel = () => requestCancel(CancelOrderType.HARD_CANCEL)

  return { onClickGaslessCancel, onClickHardCancel }
}

export const useEstimateFee = ({ isCancelAll = false, orders }: UseEstimateFeeArgs) => {
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
