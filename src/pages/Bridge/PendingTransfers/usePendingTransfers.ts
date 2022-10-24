import { useState } from 'react'

import useGetBridgeTransfers from 'hooks/bridge/useGetBridgeTransfers'

import { ITEMS_PER_PAGE } from '../consts'

const usePendingTransfers = (addr: string) => {
  const [page, setPage] = useState(1)
  const { data, isValidating, error } = useGetBridgeTransfers({
    addr,
    page: 1,
    status: 0,
    pageSize: ITEMS_PER_PAGE * page,
  })

  const maxPage = data?.data?.pagination?.totalItems
    ? Math.floor((data.data.pagination.totalItems - 1) / ITEMS_PER_PAGE) + 1
    : 1
  const canSeeMore = page < maxPage

  const seeMore = () => {
    setPage(n => n + 1)
  }

  return {
    transfers: data ? data.data.transfers : [],
    isValidating,
    error,
    canSeeMore,
    seeMore,
  }
}

export default usePendingTransfers
