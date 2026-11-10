import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGetLOConfigQuery } from 'services/limitOrder'

import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import { isActiveStatus } from 'components/LimitOrder/utils'
import { LIMIT_ORDER_ABI } from 'constants/abis'
import { useActiveWeb3React } from 'hooks'
import { useReadingContract } from 'hooks/useContract'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useAllTransactions } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'

const mergeOrderIds = (...orderIdsList: number[][]) => Array.from(new Set(orderIdsList.flat()))

const getCancelOrderIdsFromTransaction = (transaction: TransactionDetails) => {
  const arbitrary = transaction.extraInfo?.arbitrary
  const orderIds = Array.isArray(arbitrary?.orderIds) ? arbitrary.orderIds : []
  return arbitrary?.orderId ? [arbitrary.orderId] : orderIds
}

/**
 * Whether a cancel-all has already voided the order on chain: it raises the maker's nonce on the contract, and
 * every order signed with a lower nonce stops being fillable. The order list reports such an order as active
 * until the cancel is indexed.
 */
export const isCancelledByNonce = (
  order: Pick<LimitOrder, 'status' | 'nonce' | 'contractAddress'>,
  contract: string,
  makerNonce: bigint | undefined,
) =>
  makerNonce !== undefined &&
  !!contract &&
  isActiveStatus(order.status) &&
  order.contractAddress?.toLowerCase() === contract.toLowerCase() &&
  BigInt(order.nonce) < makerNonce

const isTransactionPendingOrSuccessful = (transaction: TransactionDetails) =>
  !transaction.receipt || transaction.receipt.status === 1 || typeof transaction.receipt.status === 'undefined'

export const useCancellingOrders = ({ chainId }: { chainId: ChainId }) => {
  const { account } = useActiveWeb3React()
  const transactions = useAllTransactions(true)

  const [localCancellingOrdersIds, setLocalCancellingOrdersIds] = useState<number[]>([])

  const { currentData } = useGetLOConfigQuery(chainId)

  const contract = currentData?.contract || ''
  const loContract = useReadingContract(contract, LIMIT_ORDER_ABI, chainId)
  const makerNonce = useSingleCallResult(loContract, 'nonce', [account ?? undefined]).result?.[0] as bigint | undefined

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
    setLocalCancellingOrdersIds(current => current.filter(orderId => !transactionOrderIds.all.includes(orderId)))
  }, [transactionOrderIds.all])

  const mergedCancellingOrdersIds = useMemo(
    () => mergeOrderIds(transactionOrderIds.cancelling, localCancellingOrdersIds),
    [localCancellingOrdersIds, transactionOrderIds.cancelling],
  )

  const isOrderCancelling = useCallback(
    (order: LimitOrder | undefined) => {
      if (!order) return false
      const { status, operatorSignatureExpiredAt, id } = order

      const isCancellingHardCancel =
        (isActiveStatus(status) && mergedCancellingOrdersIds.includes(id)) ||
        isCancelledByNonce(order, contract, makerNonce)

      const isCancellingGaslessCancel =
        status === LimitOrderStatus.CANCELLING && (operatorSignatureExpiredAt || 0) * 1000 - Date.now() > 0

      return isCancellingHardCancel || isCancellingGaslessCancel
    },
    [contract, makerNonce, mergedCancellingOrdersIds],
  )

  return useMemo(
    () => ({ setCancellingOrders: setLocalCancellingOrders, isOrderCancelling }),
    [setLocalCancellingOrders, isOrderCancelling],
  )
}
