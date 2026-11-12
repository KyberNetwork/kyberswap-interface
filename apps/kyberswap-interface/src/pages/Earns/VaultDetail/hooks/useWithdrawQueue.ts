import { readContract } from '@wagmi/core'
import { useEffect, useState } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import BORING_ON_CHAIN_QUEUE_ABI from 'constants/abis/earn/boringOnChainQueue.json'
import useDebounce from 'hooks/useDebounce'
import { Abi, Address, erc4626Abi } from 'utils/viem'

type PreviewTarget = {
  chainId: number
  /** The queue that prices a queued redemption, with the asset it pays and the discount offered. */
  queueAddress?: string
  assetOut?: string
  discount?: number
  /** Set for a vault that redeems on its own contract; it is then the one quoting, not a queue. */
  redeemVaultAddress?: string
  /** The read only matters on the native-redemption path; skip it everywhere else. */
  enabled?: boolean
}

/** How long a failed quote waits before it is read again. */
const QUOTE_RETRY_MS = 4_000

/**
 * Assets the user will receive for `shares`, quoted by whichever contract pays them out.
 *
 * A queue locks its figure into the request at creation time, so that is the amount that arrives. A
 * vault that redeems on the spot quotes its current rate and settles at the rate of the block the
 * redemption lands in.
 *
 * A quote belongs to the amount it was read for: it is dropped the moment the amount or the target
 * changes, so nothing on screen prices a different number of shares. A read that fails is repeated
 * until it answers, and `hasFailed` stays set meanwhile.
 */
export const useWithdrawPreview = ({
  chainId,
  queueAddress,
  assetOut,
  discount,
  redeemVaultAddress,
  shares,
  enabled = true,
}: PreviewTarget & { shares?: bigint }) => {
  const [amountOut, setAmountOut] = useState<bigint | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)

  // One quote per pause in typing rather than one per keystroke.
  const debouncedShares = useDebounce(shares, 400)
  const isDebouncing = shares !== debouncedShares

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    setAmountOut(undefined)
    setHasFailed(false)

    const hasQueueTerms = Boolean(queueAddress && assetOut) && discount !== undefined
    if (!enabled || !debouncedShares || debouncedShares <= 0n || (!redeemVaultAddress && !hasQueueTerms)) {
      setIsLoading(false)
      return
    }

    const readQuote = () =>
      redeemVaultAddress
        ? readContract(wagmiConfig, {
            address: redeemVaultAddress as Address,
            abi: erc4626Abi,
            functionName: 'previewRedeem',
            args: [debouncedShares],
            chainId,
          })
        : readContract(wagmiConfig, {
            address: queueAddress as Address,
            abi: BORING_ON_CHAIN_QUEUE_ABI as Abi,
            functionName: 'previewAssetsOut',
            args: [assetOut as Address, debouncedShares, discount],
            chainId,
          })

    const load = () => {
      setIsLoading(true)
      readQuote()
        .then(result => {
          if (cancelled) return
          setAmountOut(result as bigint)
          setHasFailed(false)
          setIsLoading(false)
        })
        .catch(error => {
          if (cancelled) return
          console.error('useWithdrawPreview: failed to quote the withdrawal', error)
          setHasFailed(true)
          setIsLoading(false)
          retryTimer = setTimeout(load, QUOTE_RETRY_MS)
        })
    }
    load()

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
    }
  }, [chainId, queueAddress, assetOut, redeemVaultAddress, debouncedShares, discount, enabled])

  // While the amount is settling the quote on screen belongs to a previous one.
  return {
    amountOut: isDebouncing ? undefined : amountOut,
    isLoading: isLoading || isDebouncing,
    hasFailed: hasFailed && !isDebouncing,
  }
}
