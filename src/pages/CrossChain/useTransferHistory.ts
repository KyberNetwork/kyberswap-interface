import { useMemo, useState } from 'react'
import { useGetListCrossChainTxsQuery } from 'services/crossChain'

import { ITEMS_PER_PAGE } from 'pages/Bridge/consts'

export type CrossChainTransfer = {
  id: number
  userAddress: string
  srcChainId: string
  dstChainId: string
  srcTxHash: string
  dstTxHash: string
  srcTokenSymbol: string
  dstTokenSymbol: string
  srcTokenLogoUrl: string
  dstTokenLogoUrl: string
  srcAmount: string
  dstAmount: string
  status: number
  createdAt: number
  shouldCheckAxelarscan: boolean
}

const useTransferHistory = (account: string) => {
  const [page, setPage] = useState(1)

  const {
    data,
    error,
    isFetching: isValidating,
  } = useGetListCrossChainTxsQuery({ userAddress: account, page }, { skip: !account })

  const transfers = useMemo(() => {
    if (data) return data.data.transfers
    return []
  }, [data])

  const canGoPrevious = page !== 1
  const maxPage = data?.data?.pagination?.totalItems
    ? Math.floor((data.data.pagination.totalItems - 1) / ITEMS_PER_PAGE) + 1
    : 1
  const canGoNext = page < maxPage

  const onClickPrevious = () => {
    if (!canGoPrevious) {
      return
    }
    setPage(page - 1)
  }

  const onClickNext = () => {
    if (!canGoNext) {
      return
    }
    setPage(page + 1)
  }

  const range = useMemo(
    () => [ITEMS_PER_PAGE * (page - 1) + 1, ITEMS_PER_PAGE * (page - 1) + Math.min(ITEMS_PER_PAGE, transfers.length)],
    [page, transfers.length],
  )

  return {
    range,
    transfers,
    isValidating,
    error,
    canGoNext,
    canGoPrevious,
    onClickNext,
    onClickPrevious,
    isCompletelyEmpty: page === 1 && transfers.length === 0,
    isThisPageEmpty: transfers.length === 0,
  }
}
export type TransferHistoryResponse = ReturnType<typeof useTransferHistory>

export default useTransferHistory
