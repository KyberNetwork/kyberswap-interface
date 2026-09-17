import { readContract } from '@wagmi/core'
import { useEffect, useState } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import BORING_ON_CHAIN_QUEUE_ABI from 'constants/abis/earn/boringOnChainQueue.json'
import useDebounce from 'hooks/useDebounce'
import { Abi, Address } from 'utils/viem'

export interface WithdrawAssetConfig {
  allowWithdraws: boolean
  /** Seconds a solver must wait before it may fill the request. */
  secondsToMaturity: number
  /** Shortest deadline the queue accepts, and the one every request uses by default. */
  minimumSecondsToDeadline: number
  minDiscount: number
  maxDiscount: number
  minimumShares: bigint
}

type QueueTarget = {
  chainId: number
  queueAddress?: string
  assetOut?: string
  /** The reads only matter on the native-redemption path; skip them everywhere else. */
  enabled?: boolean
}

const readWithdrawAssetConfig = async ({
  chainId,
  queueAddress,
  assetOut,
}: QueueTarget): Promise<WithdrawAssetConfig | undefined> => {
  if (!queueAddress || !assetOut) return undefined

  const result = (await readContract(wagmiConfig, {
    address: queueAddress as Address,
    abi: BORING_ON_CHAIN_QUEUE_ABI as Abi,
    functionName: 'withdrawAssets',
    args: [assetOut as Address],
    chainId,
  })) as [boolean, number, number, number, number, bigint]

  return {
    allowWithdraws: result[0],
    secondsToMaturity: Number(result[1]),
    minimumSecondsToDeadline: Number(result[2]),
    minDiscount: Number(result[3]),
    maxDiscount: Number(result[4]),
    minimumShares: result[5],
  }
}

/**
 * Queue terms for one withdrawal asset. The queue — not the vault or the teller — decides which
 * assets can be withdrawn and on what schedule, so these reads gate the withdraw form.
 */
export const useWithdrawAssetConfig = ({ chainId, queueAddress, assetOut, enabled = true }: QueueTarget) => {
  const [config, setConfig] = useState<WithdrawAssetConfig | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!enabled || !queueAddress || !assetOut) {
      setConfig(undefined)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    readWithdrawAssetConfig({ chainId, queueAddress, assetOut })
      .then(next => {
        if (!cancelled) setConfig(next)
      })
      .catch(error => {
        if (!cancelled) setConfig(undefined)
        console.error('useWithdrawAssetConfig: failed to read queue terms', error)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [chainId, queueAddress, assetOut, enabled])

  return { config, isLoading }
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
