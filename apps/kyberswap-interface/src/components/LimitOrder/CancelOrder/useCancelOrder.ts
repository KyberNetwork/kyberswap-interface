import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useCancelOrdersMutation,
  useCreateCancelOrderSignatureMutation,
  useGetEncodeDataMutation,
} from 'services/limitOrder'

import { formatAmountOrder, getPayloadTracking } from 'components/LimitOrder/helpers'
import { CancelOrderFunction, CancelOrderType, LimitOrder } from 'components/LimitOrder/types'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { formatSignature } from 'utils/transaction'
import { ErrorName } from 'utils/transactionError'
import useEstimateGasTxs from 'utils/useEstimateGasTxs'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

type GetEncodeLimitOrder = ReturnType<typeof useGetEncodeLimitOrder>
type EncodedCancelData = { encodedData: string; contractAddress: string }
type EncodeCancelParams = { orders: LimitOrder[]; isCancelAll: boolean | undefined }

const EMPTY_ORDERS: LimitOrder[] = []

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
          const contracts = [...new Set(orders.map(order => order.contractAddress).filter(Boolean))]
          const { encodedData } = await getEncodeData({ orderIds: [], isCancelAll }).unwrap()
          return contracts.map(contractAddress => ({ encodedData, contractAddress }))
        }

        const { encodedData } = await getEncodeData({
          orderIds: orders.map(order => order.id),
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

type UseCancelOrderRequestProps = {
  chainId: ChainId
  getEncodeData: GetEncodeLimitOrder
}

const useCancelOrderRequest = ({ chainId, getEncodeData }: UseCancelOrderRequestProps) => {
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

type UseCancelOrderEstimateProps = {
  orders: LimitOrder[]
  isCancelAll: boolean
  getEncodeData: GetEncodeLimitOrder
}

const useCancelOrderEstimate = ({ orders, isCancelAll, getEncodeData }: UseCancelOrderEstimateProps) => {
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

type UseCancelOrderProps = {
  chainId?: ChainId
  orders?: LimitOrder[]
  isCancelAll?: boolean
}

export type CancelOrderInfo = {
  onCancelOrder: CancelOrderFunction
  estimateGas: string
}

export const useCancelOrder = ({
  chainId: customChainId,
  orders = EMPTY_ORDERS,
  isCancelAll = false,
}: UseCancelOrderProps): CancelOrderInfo => {
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
