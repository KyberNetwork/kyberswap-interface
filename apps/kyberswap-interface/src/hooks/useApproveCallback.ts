import { Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useAllTransactions, useHasPendingApproval, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionDetails, TransactionExtraInfo1Token } from 'state/transactions/type'
import { friendlyError } from 'utils/errorMessage'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import { Address, encodeFunctionData, maxUint256 } from 'utils/viem'
import { didUserReject } from 'utils/walletError'

export enum ApprovalState {
  UNKNOWN = 'UNKNOWN',
  NOT_APPROVED = 'NOT_APPROVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

export enum ApprovalStatus {
  SUBMITTED = 'submitted',
  REJECTED = 'rejected',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

type ApprovalError = {
  message: string
  tokenSymbol?: string
  tokenAddress?: string
  spender?: string
}

type UseApproveCallbackArgs = {
  amount?: CurrencyAmount<Currency>
  spender?: string
  forceApprove?: boolean
  onApprovalError?: (error: ApprovalError) => void
}

// Keeps the approval state in sync with allowance and exposes the wallet action to grant approval.
export function useApproveCallback({
  amount,
  spender,
  forceApprove = false,
  onApprovalError,
}: UseApproveCallbackArgs): [
  ApprovalState,
  (customAllowance?: CurrencyAmount<Currency>) => Promise<ApprovalStatus>,
  TokenAmount | undefined,
] {
  const { account, chainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const transactions = useAllTransactions()

  // Identify the allowance being read independently of the requested amount.
  const token = amount?.currency.wrapped
  const isNative = amount?.currency.isNative
  const requiredAllowance = amount?.quotient.toString()
  const allowanceScope =
    token && account && spender && chainId
      ? `${chainId}:${account}:${token.address}:${spender}`.toLowerCase()
      : undefined

  // Observe approval transactions for this token and spender.
  const pendingApproval = useHasPendingApproval(token?.address, spender)

  // Track the receipt itself: a fast approval can confirm before React observes the pending state.
  // useAllTransactions scopes these transactions to the connected account and chain.
  const latestApproval = useMemo(() => {
    return Object.values(transactions ?? {})
      .flat()
      .filter((tx): tx is TransactionDetails => {
        const info = tx?.extraInfo as TransactionExtraInfo1Token | undefined
        return (
          tx?.type === TRANSACTION_TYPE.APPROVE &&
          info?.tokenAddress?.toLowerCase() === token?.address.toLowerCase() &&
          info?.contract?.toLowerCase() === spender?.toLowerCase()
        )
      })
      .sort((a, b) => b.addedTime - a.addedTime)[0]
  }, [spender, token?.address, transactions])

  const approvalReceiptHash = latestApproval?.receipt ? latestApproval.hash : undefined
  const approvalSucceeded = latestApproval?.receipt?.status === 1

  // Synchronize allowance after a successful receipt; keep cached values tied to their scope.
  const [allowanceResult, setAllowance] = useState<{ scope: string; amount: TokenAmount }>()
  const [syncingScope, setSyncingScope] = useState<string>()
  const handledApproval = useRef({ scope: allowanceScope, receipt: approvalReceiptHash, amount: requiredAllowance })

  useEffect(() => {
    // Cleanup cancels the previous polling when input changes. Mark that receipt as handled
    // so the new amount gets a single read without restarting its retry window.
    // Historical receipts on mount or a scope change also only trigger a single read.
    if (handledApproval.current.scope !== allowanceScope || handledApproval.current.amount !== requiredAllowance) {
      handledApproval.current = { scope: allowanceScope, receipt: approvalReceiptHash, amount: requiredAllowance }
    }
    const shouldSyncAfterApproval = approvalSucceeded && handledApproval.current.receipt !== approvalReceiptHash
    setSyncingScope(shouldSyncAfterApproval ? allowanceScope : undefined)

    if (!token || !account || !spender || !chainId || !allowanceScope || isNative || requiredAllowance === undefined)
      return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    // Receipt and allowance reads can reach RPC nodes at different heads. After a successful
    // approval, keep the CTA pending and retry up to five times, three seconds apart.
    // Idle forms and reverted approvals only read once.
    let retriesRemaining = shouldSyncAfterApproval ? 5 : 0

    const refreshAllowance = async () => {
      let sufficient = false

      try {
        const allowance = (await readContract(wagmiConfig, {
          address: token.address as Address,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [account, spender],
          chainId: chainId as number,
        })) as bigint
        if (cancelled) return
        setAllowance({ scope: allowanceScope, amount: TokenAmount.fromRawAmount(token, allowance.toString()) })
        sufficient =
          requiredAllowance === maxUint256.toString() ? allowance > 0n : allowance >= BigInt(requiredAllowance)
      } catch (error) {
        if (cancelled) return
        console.warn('Failed to refresh token allowance', error)
      }

      if (!sufficient && retriesRemaining-- > 0) {
        timer = setTimeout(refreshAllowance, 3_000)
      } else {
        setSyncingScope(undefined)
        handledApproval.current = { scope: allowanceScope, receipt: approvalReceiptHash, amount: requiredAllowance }
      }
    }

    void refreshAllowance()
    return () => {
      // Stop retries and ignore in-flight responses when the amount or scope changes, or on unmount.
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    account,
    allowanceScope,
    approvalReceiptHash,
    approvalSucceeded,
    chainId,
    isNative,
    pendingApproval,
    requiredAllowance,
    spender,
    token,
  ])

  // Derive the CTA state only from allowance and synchronization for the current scope.
  const currentAllowance = allowanceResult?.scope === allowanceScope ? allowanceResult?.amount : undefined
  const isSyncingAllowance = !!allowanceScope && syncingScope === allowanceScope
  const approvalState: ApprovalState = useMemo(() => {
    if (!amount || !spender) return ApprovalState.UNKNOWN
    if (amount.currency.isNative) return ApprovalState.APPROVED
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // Farm approvals use maxUint256 as a sentinel and accept any non-zero allowance.
    const hasEnoughAllowance =
      amount.quotient.toString() === maxUint256.toString()
        ? !currentAllowance.equalTo(JSBI.BigInt(0))
        : !currentAllowance.lessThan(amount)
    if (hasEnoughAllowance) return ApprovalState.APPROVED

    return pendingApproval || isSyncingAllowance ? ApprovalState.PENDING : ApprovalState.NOT_APPROVED
  }, [amount, currentAllowance, isSyncingAllowance, pendingApproval, spender])

  // Submit approval through the wallet and register its hash for receipt tracking.
  const approve = useCallback(
    async (customAmount?: CurrencyAmount<Currency>): Promise<ApprovalStatus> => {
      try {
        if (approvalState !== ApprovalState.NOT_APPROVED && !forceApprove) {
          console.error('approve was called unnecessarily')
          return ApprovalStatus.SKIPPED
        }
        if (!token) {
          console.error('no token')
          return ApprovalStatus.SKIPPED
        }

        if (!account) {
          console.error('no account')
          return ApprovalStatus.SKIPPED
        }

        if (!amount) {
          console.error('missing amount to approve')
          return ApprovalStatus.SKIPPED
        }

        if (!spender) {
          console.error('no spender')
          return ApprovalStatus.SKIPPED
        }

        const buildApproveData = (amount: bigint) =>
          encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spender, amount],
          })

        const sendApprove = (amount: bigint) =>
          sendEVMTransaction({
            account,
            contractAddress: token.address,
            encodedData: buildApproveData(amount),
            value: 0n,
            errorInfo: { name: ErrorName.SwapError, wallet: undefined },
            isSmartConnector,
            chainId,
          })

        let response
        try {
          const initialAmount =
            customAmount instanceof CurrencyAmount ? BigInt(customAmount.quotient.toString()) : maxUint256
          response = await sendApprove(initialAmount)
        } catch (e) {
          // Abort the retry chain on user rejection — otherwise the wallet would
          // re-prompt with the exact-amount fallback (and again with the USDT
          // zero-reset), surfacing as 2-3 consecutive popups for one click.
          if (didUserReject(e)) {
            return ApprovalStatus.REJECTED
          }
          try {
            response = await sendApprove(BigInt(amount.quotient.toString()))
          } catch (e2) {
            if (didUserReject(e2)) {
              return ApprovalStatus.REJECTED
            }
            // Last-ditch fallback: reset allowance to 0 (USDT-style tokens reject
            // approve() when the current allowance is non-zero). The user will need
            // to retrigger approve to the desired amount — don't surface this as a
            // successful "Approve" in the wallet history, since the allowance is now
            // 0 and the caller's flow has not been granted.
            try {
              await sendApprove(0n)
            } catch (e3) {
              if (didUserReject(e3)) {
                return ApprovalStatus.REJECTED
              }
              throw e3
            }
            return ApprovalStatus.FAILED
          }
        }

        if (response?.hash) {
          addTransactionWithType({
            hash: response.hash,
            type: TRANSACTION_TYPE.APPROVE,
            extraInfo: {
              tokenSymbol: token.symbol ?? '',
              tokenAddress: token.address,
              contract: spender,
            },
          })
          return ApprovalStatus.SUBMITTED
        }
        return ApprovalStatus.FAILED
      } catch (error) {
        const message = friendlyError(error)
        console.error('Approve token error:', { message, error })
        onApprovalError?.({
          message,
          tokenSymbol: token?.symbol,
          tokenAddress: token?.address,
          spender,
        })
        notify(
          {
            title: t`Approve Error`,
            summary: message,
            type: NotificationType.ERROR,
          },
          8000,
        )
        return ApprovalStatus.FAILED
      }
    },
    [
      account,
      approvalState,
      token,
      amount,
      spender,
      addTransactionWithType,
      forceApprove,
      notify,
      onApprovalError,
      isSmartConnector,
      chainId,
    ],
  )

  return [approvalState, approve, currentAllowance]
}
