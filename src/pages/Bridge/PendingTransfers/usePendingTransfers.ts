import { useEffect, useMemo, useState } from 'react'

import useGetBridgeTransfers, { BridgeTransfer, BridgeTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'

import { DEFAULT_LIMIT, DEFAULT_OFFSET, ITEMS_PER_PAGE } from '../consts'

const statusToGet = [BridgeTransferStatus.Confirming, BridgeTransferStatus.Swapping, BridgeTransferStatus.BigAmount]
const OFFSET = DEFAULT_OFFSET
const LIMIT = DEFAULT_LIMIT

const usePendingTransfers = (addr: string) => {
  const [numberOfVisibleTransfers, setNumberOfVisibleTransfers] = useState(ITEMS_PER_PAGE)
  const [allTransfers, setAllTransfers] = useState<BridgeTransfer[]>([])
  const { data, isValidating, error } = useGetBridgeTransfers({ addr, offset: OFFSET, limit: LIMIT })

  const canSeeMore = numberOfVisibleTransfers < allTransfers.length

  const seeMore = () => {
    setNumberOfVisibleTransfers(n => n + ITEMS_PER_PAGE)
  }

  useEffect(() => {
    if (!data?.info?.length) {
      return
    }

    const newTransfers = data.info
      // needs filter here because MultiChain can return any status
      .filter(transfer => statusToGet.includes(transfer.status))

    setAllTransfers(newTransfers)
  }, [data])

  const transfers = useMemo(() => {
    return allTransfers.slice(0, numberOfVisibleTransfers)
  }, [allTransfers, numberOfVisibleTransfers])

  return {
    transfers,
    isValidating,
    error,
    canSeeMore,
    seeMore,
  }
}

export default usePendingTransfers
