import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useCancelOrdersMutation,
  useCreateCancelOrderSignatureMutation,
  useGetEncodeDataMutation,
  useGetLOConfigQuery,
} from 'services/limitOrder'

import { formatAmountOrder, getPayloadTracking, isActiveStatus } from 'components/LimitOrder/helpers'
import { CancelOrderFunction, CancelOrderType, LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'
import { OrderNonces, subscribeCancellingOrders } from 'utils/firebase'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { formatSignature } from 'utils/transaction'
import { ErrorName } from 'utils/transactionError'
import useEstimateGasTxs from 'utils/useEstimateGasTxs'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

type GetEncodeLimitOrder = ReturnType<typeof useGetEncodeLimitOrder>
type EncodedCancelData = { encodedData: string; contractAddress: string }
type EncodeCancelParams = { orders: LimitOrder[]; isCancelAll: boolean | undefined }

type UseCancelOrderArgs = {
  chainId?: ChainId
  orders?: LimitOrder[]
  isCancelAll?: boolean
}

export type CancelOrderInfo = {
  onCancelOrder: CancelOrderFunction
  estimateGas: string
}

const EMPTY_ORDERS: LimitOrder[] = []
const EMPTY_CANCELLING_ORDERS = { orderIds: [], noncesByContract: {} } as {
  orderIds: number[]
  noncesByContract: OrderNonces
}

const mergeOrderIds = (...orderIdsList: number[][]) => Array.from(new Set(orderIdsList.flat()))

const getCancelOrderIdsFromTransaction = (transaction: TransactionDetails) => {
  const arbitrary = transaction.extraInfo?.arbitrary
  const orderIds = Array.isArray(arbitrary?.orderIds) ? arbitrary.orderIds : []
  return arbitrary?.order_id ? [arbitrary.order_id] : orderIds
}

const isTransactionPendingOrSuccessful = (transaction: TransactionDetails) =>
  !transaction.receipt || transaction.receipt.status === 1 || typeof transaction.receipt.status === 'undefined'

const useGetEncodeLimitOrder = () => {
  const { account } = useActiveWeb3React()
  const [getEncodeData] = useGetEncodeDataMutation()
  const cacheRef = useRef(new Map<string, Promise<EncodedCancelData[]>>())

  const getCacheKey = useCallback(
    ({ orders, isCancelAll }: EncodeCancelParams) => {
      const key = isCancelAll
        ? [...new Set(orders.map(order => order.contractAddress))].sort().join(',')
        : orders.map(order => order.id).join(',')
      return `${account}:${isCancelAll ? 'all' : 'orders'}:${key}`
    },
    [account],
  )

  return useCallback(
    async ({ orders, isCancelAll }: EncodeCancelParams) => {
      if (!account) throw new Error()

      const cacheKey = getCacheKey({ orders, isCancelAll })
      const cached = cacheRef.current.get(cacheKey)
      if (cached) return cached

      const request = (async () => {
        if (isCancelAll) {
          const contracts = [...new Set(orders.map(e => e.contractAddress).filter(Boolean))]
          const { encodedData } = await getEncodeData({ orderIds: [], isCancelAll }).unwrap()
          return contracts.map(contractAddress => ({ encodedData, contractAddress }))
        }

        const { encodedData } = await getEncodeData({
          orderIds: orders.map(e => e.id),
        }).unwrap()
        return [{ encodedData, contractAddress: orders[0]?.contractAddress ?? '' }]
      })()

      cacheRef.current.set(cacheKey, request)
      request.catch(() => cacheRef.current.delete(cacheKey))
      return request
    },
    [account, getCacheKey, getEncodeData],
  )
}

export const useCancellingOrders = (chainId: ChainId) => {
  const { account } = useActiveWeb3React()
  const transactions = useAllTransactions(true)

  const [cancellingOrders, setCancellingOrders] = useState(EMPTY_CANCELLING_ORDERS)
  const [localCancellingOrdersIds, setLocalCancellingOrdersIds] = useState<number[]>([])

  const { currentData } = useGetLOConfigQuery(chainId)

  const contract = currentData?.contract || ''

  const transactionOrderIds = useMemo(() => {
    const cancelTransactions = Object.values(transactions ?? {})
      .flat()
      .filter(
        (transaction): transaction is TransactionDetails =>
          !!transaction && transaction.chainId === chainId && transaction.type === TRANSACTION_TYPE.CANCEL_LIMIT_ORDER,
      )

    return {
      all: mergeOrderIds(...cancelTransactions.map(getCancelOrderIdsFromTransaction)),
      cancelling: mergeOrderIds(
        ...cancelTransactions.filter(isTransactionPendingOrSuccessful).map(getCancelOrderIdsFromTransaction),
      ),
    }
  }, [chainId, transactions])

  const setLocalCancellingOrders = useCallback((orderIds: number[]) => {
    setLocalCancellingOrdersIds(current => mergeOrderIds(current, orderIds))
  }, [])

  useEffect(() => {
    setLocalCancellingOrdersIds([])
  }, [account, chainId])

  useEffect(() => {
    if (!account) {
      setCancellingOrders(EMPTY_CANCELLING_ORDERS)
      return
    }

    const unsubscribe = subscribeCancellingOrders(account, chainId, data => {
      setCancellingOrders({
        orderIds: data?.orderIds ?? [],
        noncesByContract: data?.noncesByContract ?? {},
      })
    })
    return () => unsubscribe?.()
  }, [account, chainId])

  useEffect(() => {
    setLocalCancellingOrdersIds(current => current.filter(orderId => !transactionOrderIds.all.includes(orderId)))
  }, [transactionOrderIds.all])

  const mergedCancellingOrdersIds = useMemo(
    () => mergeOrderIds(cancellingOrders.orderIds, transactionOrderIds.cancelling, localCancellingOrdersIds),
    [cancellingOrders.orderIds, localCancellingOrdersIds, transactionOrderIds.cancelling],
  )

  const isOrderCancelling = useCallback(
    (order: LimitOrder | undefined) => {
      if (!order) return false
      const nonces = cancellingOrders.noncesByContract[contract] || []
      const { status, nonce, operatorSignatureExpiredAt, id } = order

      const isCancellingHardCancel =
        isActiveStatus(status) && (nonces?.includes?.(nonce) || mergedCancellingOrdersIds.includes(id))

      const isCancellingGaslessCancel =
        status === LimitOrderStatus.CANCELLING && (operatorSignatureExpiredAt || 0) * 1000 - Date.now() > 0

      return isCancellingHardCancel || isCancellingGaslessCancel
    },
    [cancellingOrders.noncesByContract, contract, mergedCancellingOrdersIds],
  )

  return useMemo(
    () => ({ setCancellingOrders: setLocalCancellingOrders, isOrderCancelling }),
    [setLocalCancellingOrders, isOrderCancelling],
  )
}

const useCancelOrderRequest = ({
  chainId,
  getEncodeData,
}: {
  chainId: ChainId
  getEncodeData: GetEncodeLimitOrder
}) => {
  const { account, walletKey } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()

  const [createCancelSignature] = useCreateCancelOrderSignatureMutation()
  const [cancelOrderRequest] = useCancelOrdersMutation()

  const addTransactionWithType = useTransactionAdder()
  const networkName = NETWORKS_INFO[chainId]?.name || ''

  const requestHardCancelOrder = useCallback(
    async (orders: LimitOrder[], isCancelAll: boolean) => {
      if (!account) return Promise.reject('Wrong input')
      const order = isCancelAll ? undefined : orders[0]

      const sendTransaction = async (encodedData: string, contract: string) => {
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
            desiredChainId: chainId,
            type: TRANSACTION_TYPE.CANCEL_LIMIT_ORDER,
            extraInfo: order
              ? {
                  tokenAddressIn: makerAsset,
                  tokenAddressOut: takerAsset,
                  tokenSymbolIn: makerAssetSymbol,
                  tokenSymbolOut: takerAssetSymbol,
                  tokenAmountIn: amountIn,
                  tokenAmountOut: amountOut,
                  arbitrary: getPayloadTracking(order, networkName),
                }
              : {
                  arbitrary: {
                    totalOrder: orders.length,
                    orderIds: orders
                      .filter(order => order.contractAddress.toLowerCase() === contract.toLowerCase())
                      .map(order => order.id),
                  },
                },
          })
        }
      }

      if (isCancelAll) {
        const data = await getEncodeData({ isCancelAll, orders })
        for (const item of data) {
          const { contractAddress, encodedData } = item
          await sendTransaction(encodedData, contractAddress)
        }
      } else {
        const data = await getEncodeData({ isCancelAll, orders: order ? [order] : [] })
        const { contractAddress, encodedData } = data[0] || {}
        await sendTransaction(encodedData, contractAddress ?? '')
      }
      return
    },
    [account, addTransactionWithType, chainId, getEncodeData, isSmartConnector, networkName, walletKey],
  )

  const requestGasLessCancelOrder = useCallback(
    async (orders: LimitOrder[]) => {
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

      return resp
    },
    [account, cancelOrderRequest, chainId, createCancelSignature],
  )

  const onCancelOrder: CancelOrderFunction = useCallback(
    async ({ orders, isCancelAll, cancelType }) => {
      const gaslessCancel = cancelType === CancelOrderType.GAS_LESS_CANCEL
      return gaslessCancel ? requestGasLessCancelOrder(orders) : requestHardCancelOrder(orders, isCancelAll)
    },
    [requestGasLessCancelOrder, requestHardCancelOrder],
  )

  return onCancelOrder
}

const useCancelOrderEstimate = ({
  orders,
  isCancelAll,
  getEncodeData,
}: {
  orders: LimitOrder[]
  isCancelAll: boolean
  getEncodeData: GetEncodeLimitOrder
}) => {
  const [estimateGas, setEstimateGas] = useState('')
  const estimateGasTx = useEstimateGasTxs()

  useEffect(() => {
    if (!orders.length) {
      setEstimateGas('')
      return
    }

    const controller = new AbortController()
    const signal = controller.signal
    const fetchEncode = async () => {
      try {
        const resp = await getEncodeData({ orders, isCancelAll })
        if (signal.aborted) return
        const data = await Promise.all(resp.map(estimateGasTx))
        if (signal.aborted) return
        const gas = data.reduce((rs, item) => rs + (item.gasInUsd || 0), 0)
        setEstimateGas(gas + '')
      } catch (error) {
        if (signal.aborted) return
        setEstimateGas('')
      }
    }

    const timeout = setTimeout(() => {
      if (signal.aborted) return
      fetchEncode()
    }, 100)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [getEncodeData, orders, estimateGasTx, isCancelAll])

  return estimateGas
}

export const useCancelOrder = ({
  chainId: customChainId,
  orders = EMPTY_ORDERS,
  isCancelAll = false,
}: UseCancelOrderArgs = {}): CancelOrderInfo => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId ?? walletChainId
  const getEncodeData = useGetEncodeLimitOrder()
  const estimateGas = useCancelOrderEstimate({ orders, isCancelAll, getEncodeData })
  const onCancelOrder = useCancelOrderRequest({
    chainId,
    getEncodeData,
  })

  return useMemo(
    () => ({
      estimateGas,
      onCancelOrder,
    }),
    [estimateGas, onCancelOrder],
  )
}
