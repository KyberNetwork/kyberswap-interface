import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useReadContract, useWaitForTransactionReceipt } from 'wagmi'

import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, ApprovalStatus, useApproveCallback } from 'hooks/useApproveCallback'
import { Chain } from 'pages/CrossChainSwap/adapters'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { useHasPendingApproval } from 'state/transactions/hooks'
import { isEvmChain } from 'utils'
import { Address, Hash, parseAbi } from 'utils/viem'

const ALLOWANCE_ABI = parseAbi(['function allowance(address owner, address spender) view returns (uint256)'])
const ALLOWANCE_SYNC_DELAYS = [0, 1_000, 1_000]
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getTransactionTokenAddress = (token: unknown) => {
  if (!token || typeof token !== 'object') return undefined
  const storedToken = token as { address?: string; wrapped?: { address?: string } }
  return storedToken.address ?? storedToken.wrapped?.address
}

type UseCrossChainApprovalParams = {
  amount: CurrencyAmount<Currency> | undefined
  fromChainId: Chain | undefined
  spender: string | undefined
}

/**
 * Keeps CrossChainSwap approval state synchronized with the on-chain allowance.
 *
 * `useApproveCallback` refreshes its allowance when an approval transaction changes state. However, an exact allowance
 * is also consumed by the source swap, which is stored in `crossChainSwap.transactions` instead of the shared EVM
 * transaction store. Therefore, the source swap does not update `pendingApproval` and can leave the cached allowance
 * stale after a completed transaction.
 *
 * This hook reuses the shared approval transaction flow, performs bounded allowance retries after approval and source
 * swap receipts, and revalidates once more before Review. The retries are transaction-triggered and never run on idle.
 */
export const useCrossChainApproval = ({ amount, fromChainId, spender }: UseCrossChainApprovalParams) => {
  const { account, chainId } = useActiveWeb3React()

  const isFromEvm = fromChainId !== undefined && isEvmChain(fromChainId)
  const tokenAddress = amount?.currency.isNative ? undefined : amount?.currency.wrapped.address
  const requiredAllowance = amount ? BigInt(amount.quotient.toString()) : undefined
  const canReadAllowance =
    isFromEvm &&
    chainId === fromChainId &&
    !!account &&
    !!amount &&
    !!tokenAddress &&
    !!spender &&
    spender !== ZERO_ADDRESS
  const allowanceScope = canReadAllowance ? `${chainId}:${account}:${tokenAddress}:${spender}`.toLowerCase() : undefined

  const {
    data: onChainAllowance,
    isError: isAllowanceError,
    refetch: refetchAllowance,
  } = useReadContract({
    address: tokenAddress as Address | undefined,
    abi: ALLOWANCE_ABI,
    functionName: 'allowance',
    args: account && spender ? [account as Address, spender as Address] : undefined,
    chainId: isFromEvm ? (fromChainId as ChainId) : undefined,
    query: { enabled: canReadAllowance },
  })

  const pendingApproval = useHasPendingApproval(tokenAddress, spender)
  const needsApproval =
    canReadAllowance &&
    requiredAllowance !== undefined &&
    onChainAllowance !== undefined &&
    requiredAllowance > onChainAllowance

  const [fallbackApprovalState, approveCallback] = useApproveCallback({
    amount,
    spender,
    forceApprove: needsApproval,
  })
  const approvalState =
    !canReadAllowance || isAllowanceError
      ? fallbackApprovalState
      : onChainAllowance === undefined
      ? ApprovalState.UNKNOWN
      : needsApproval
      ? ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED

  const [crossChainTransactions] = useCrossChainTransactions()
  const sourceTxHash = canReadAllowance
    ? crossChainTransactions.find(
        tx =>
          tx.sourceChain === fromChainId &&
          tx.sender?.toLowerCase() === account.toLowerCase() &&
          getTransactionTokenAddress(tx.sourceToken)?.toLowerCase() === tokenAddress.toLowerCase(),
      )?.sourceTxHash
    : undefined
  const { data: sourceTxReceipt } = useWaitForTransactionReceipt({
    hash: sourceTxHash as Hash | undefined,
    chainId: isFromEvm ? (fromChainId as ChainId) : undefined,
    query: { enabled: canReadAllowance && !!sourceTxHash },
  })

  const [approvalInProgressScope, setApprovalInProgressScope] = useState<string | undefined>(
    pendingApproval ? allowanceScope : undefined,
  )
  const [isRevalidatingAllowance, setIsRevalidatingAllowance] = useState(false)

  const previousPendingApproval = useRef(pendingApproval)
  const clearApprovalInProgress = useCallback(() => {
    setApprovalInProgressScope(currentScope => (currentScope === allowanceScope ? undefined : currentScope))
  }, [allowanceScope])

  const getLatestAllowance = useCallback(async () => {
    setIsRevalidatingAllowance(true)
    try {
      const { data, isError } = await refetchAllowance()
      return isError ? undefined : data
    } finally {
      setIsRevalidatingAllowance(false)
    }
  }, [refetchAllowance])

  const syncAllowance = useCallback(
    async (isSynced: (allowance: bigint) => boolean = () => false) => {
      for (const delay of ALLOWANCE_SYNC_DELAYS) {
        if (delay) await sleep(delay)

        const { data, isError } = await refetchAllowance()
        if (!isError && data !== undefined && isSynced(data)) return
      }
    },
    [refetchAllowance],
  )

  const approve = useCallback(async (): Promise<ApprovalStatus> => {
    if (!amount || !allowanceScope || requiredAllowance === undefined) return ApprovalStatus.SKIPPED

    const allowance = await getLatestAllowance()
    if (allowance === undefined || requiredAllowance <= allowance) return ApprovalStatus.SKIPPED

    setApprovalInProgressScope(allowanceScope)
    let status = ApprovalStatus.FAILED
    try {
      status = await approveCallback(amount)
      return status
    } finally {
      if (status !== ApprovalStatus.SUBMITTED) clearApprovalInProgress()
    }
  }, [allowanceScope, amount, approveCallback, clearApprovalInProgress, getLatestAllowance, requiredAllowance])

  // Keep Approving visible until the approval receipt has refreshed the allowance.
  useEffect(() => {
    const wasPendingApproval = previousPendingApproval.current
    previousPendingApproval.current = pendingApproval

    if (!allowanceScope) return
    if (pendingApproval) {
      setApprovalInProgressScope(allowanceScope)
      return
    }
    if (!wasPendingApproval || requiredAllowance === undefined) return

    void syncAllowance(allowance => allowance >= requiredAllowance).finally(clearApprovalInProgress)
  }, [allowanceScope, clearApprovalInProgress, pendingApproval, requiredAllowance, syncAllowance])

  // The source swap can consume an exact allowance without changing pendingApproval.
  useEffect(() => {
    if (!allowanceScope || !sourceTxHash || sourceTxReceipt?.transactionHash !== sourceTxHash) return
    void syncAllowance()
  }, [allowanceScope, sourceTxHash, sourceTxReceipt?.transactionHash, syncAllowance])

  // Clear the optimistic state if another trigger observed the updated allowance first.
  useEffect(() => {
    if (
      approvalInProgressScope === allowanceScope &&
      !pendingApproval &&
      onChainAllowance !== undefined &&
      !needsApproval
    ) {
      setApprovalInProgressScope(undefined)
    }
  }, [allowanceScope, approvalInProgressScope, needsApproval, onChainAllowance, pendingApproval])

  // Fail closed when the latest allowance cannot be read before Review.
  const revalidateAllowance = useCallback(async () => {
    if (!canReadAllowance || requiredAllowance === undefined) return true

    const allowance = await getLatestAllowance()
    return allowance !== undefined && requiredAllowance <= allowance
  }, [canReadAllowance, getLatestAllowance, requiredAllowance])

  return {
    approvalState,
    approve,
    isApproving:
      (!!allowanceScope && approvalInProgressScope === allowanceScope) ||
      pendingApproval ||
      fallbackApprovalState === ApprovalState.PENDING,
    isChecking: canReadAllowance && approvalState === ApprovalState.UNKNOWN,
    isRevalidating: isRevalidatingAllowance,
    revalidateAllowance,
  }
}
