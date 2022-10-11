import { useMemo, useState } from 'react'

import useGetBridgeTransfers, { BridgeTransfer } from 'hooks/bridge/useGetBridgeTransfers'

import { DEFAULT_LIMIT, ITEMS_PER_PAGE } from '../consts'

const EmptyArray: any[] = []

const useTransferHistory = (addr: string) => {
  const [offset, setOffset] = useState(0)
  const [cursor, setCursor] = useState(0)
  const { data, isValidating, error } = useGetBridgeTransfers({ addr, offset, limit: DEFAULT_LIMIT })
  const allTransfers = data?.info || (EmptyArray as BridgeTransfer[])

  const transfers = useMemo(() => {
    return allTransfers.slice(cursor, cursor + ITEMS_PER_PAGE)
  }, [allTransfers, cursor])

  const canGoPrevious = !(cursor === 0 && offset === 0)
  const canGoNext = !(allTransfers.length < DEFAULT_LIMIT && cursor + ITEMS_PER_PAGE >= allTransfers.length)

  const onClickPrevious = () => {
    if (!canGoPrevious) {
      return
    }

    if (cursor === 0) {
      // already check for offset === 0 in canGoPrevious
      // need to fetch the last 100 transfers
      setOffset(offset - DEFAULT_LIMIT)
      setCursor(DEFAULT_LIMIT - ITEMS_PER_PAGE)
      return
    }

    setCursor(cursor - ITEMS_PER_PAGE)
  }

  const onClickNext = () => {
    if (!canGoNext) {
      return
    }

    if (cursor === DEFAULT_LIMIT - ITEMS_PER_PAGE) {
      // need to fetch the next 100 transfers
      setOffset(offset + DEFAULT_LIMIT)
      setCursor(0)
      return
    }

    setCursor(cursor + ITEMS_PER_PAGE)
  }

  const range = [offset + cursor, offset + cursor + ITEMS_PER_PAGE - 1]

  return {
    range,
    transfers,
    isValidating,
    error,
    canGoNext,
    canGoPrevious,
    onClickNext,
    onClickPrevious,
  }
}

export default useTransferHistory
