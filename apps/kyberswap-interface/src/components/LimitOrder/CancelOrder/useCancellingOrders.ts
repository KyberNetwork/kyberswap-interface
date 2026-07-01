import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGetLOConfigQuery } from 'services/limitOrder'

import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import { isActiveStatus } from 'components/LimitOrder/utils'
import { useActiveWeb3React } from 'hooks'
import { useAllTransactions } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'
import { OrderNonces, subscribeCancellingOrders } from 'utils/firebase'

type CancellingOrders = {
  orderIds: number[]
  noncesByContract: OrderNonces
}

const EMPTY_CANCELLING_ORDERS: CancellingOrders = { orderIds: [], noncesByContract: {} }

const mergeOrderIds = (...orderIdsList: number[][]) => Array.from(new Set(orderIdsList.flat()))

const getCancelOrderIdsFromTransaction = (transaction: TransactionDetails) => {
  const arbitrary = transaction.extraInfo?.arbitrary
  const orderIds = Array.isArray(arbitrary?.orderIds) ? arbitrary.orderIds : []
  return arbitrary?.orderId ? [arbitrary.orderId] : orderIds
}

const isTransactionPendingOrSuccessful = (transaction: TransactionDetails) =>
  !transaction.receipt || transaction.receipt.status === 1 || typeof transaction.receipt.status === 'undefined'

export const useCancellingOrders = ({ chainId }: { chainId: ChainId }) => {
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
