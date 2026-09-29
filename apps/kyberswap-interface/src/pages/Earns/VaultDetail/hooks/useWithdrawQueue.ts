import { readContract } from '@wagmi/core'
import { useEffect, useState } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import BORING_ON_CHAIN_QUEUE_ABI from 'constants/abis/earn/boringOnChainQueue.json'
import useDebounce from 'hooks/useDebounce'
import { Abi, Address } from 'utils/viem'

type QueueTarget = {
  chainId: number
  queueAddress?: string
  assetOut?: string
  /** The read only matters on the native-redemption path; skip it everywhere else. */
  enabled?: boolean
}

/**
 * Assets the user will receive for `shares`, quoted by the queue itself. The amount is locked into
 * the request at creation time, so this is the figure the user is agreeing to.
 */
export const useWithdrawPreview = ({
  chainId,
  queueAddress,
  assetOut,
  shares,
  discount,
  enabled = true,
}: QueueTarget & { shares?: bigint; discount?: number }) => {
  const [amountOut, setAmountOut] = useState<bigint | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  // One quote per pause in typing rather than one per keystroke.
  const debouncedShares = useDebounce(shares, 400)
  const isDebouncing = shares !== debouncedShares

  useEffect(() => {
    let cancelled = false
    if (!enabled || !queueAddress || !assetOut || !debouncedShares || debouncedShares <= 0n || discount === undefined) {
      setAmountOut(undefined)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    readContract(wagmiConfig, {
      address: queueAddress as Address,
      abi: BORING_ON_CHAIN_QUEUE_ABI as Abi,
      functionName: 'previewAssetsOut',
      args: [assetOut as Address, debouncedShares, discount],
      chainId,
    })
      .then(result => {
        if (!cancelled) setAmountOut(result as bigint)
      })
      .catch(error => {
        if (!cancelled) setAmountOut(undefined)
        console.error('useWithdrawPreview: failed to quote the withdrawal', error)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [chainId, queueAddress, assetOut, debouncedShares, discount, enabled])

  // While the amount is settling the quote on screen belongs to a previous one.
  return { amountOut: isDebouncing ? undefined : amountOut, isLoading: isLoading || isDebouncing }
}
