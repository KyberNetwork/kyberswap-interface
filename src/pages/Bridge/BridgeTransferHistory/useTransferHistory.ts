import { useMemo, useState } from 'react'

import useGetBridgeTransfers from 'hooks/bridge/useGetBridgeTransfers'

import { ITEMS_PER_PAGE } from '../consts'

const useTransferHistory = (addr: string) => {
  const [page, setPage] = useState(1)
  const { data, isValidating, error } = useGetBridgeTransfers({ addr, page, pageSize: ITEMS_PER_PAGE })

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

  const range = [ITEMS_PER_PAGE * (page - 1) + 1, Math.min(ITEMS_PER_PAGE * page)]

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
  }
}

export default useTransferHistory
