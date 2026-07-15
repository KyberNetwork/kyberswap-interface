import { Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
import { didUserReject } from 'constants/connectors/utils'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useHasPendingApproval, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { friendlyError } from 'utils/errorMessage'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import { Address, encodeFunctionData, maxUint256 } from 'utils/viem'

export enum ApprovalState {
  UNKNOWN = 'UNKNOWN',
  NOT_APPROVED = 'NOT_APPROVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

type ApprovalError = {
  message: string
  tokenSymbol?: string
  tokenAddress?: string
  spender?: string
}

export enum ApprovalStatus {
  SUBMITTED = 'submitted',
  REJECTED = 'rejected',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

type UseApproveCallbackArgs = {
  amount?: CurrencyAmount<Currency>
  spender?: string
  forceApprove?: boolean
  onApprovalError?: (error: ApprovalError) => void
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
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
  const token = amount?.currency.wrapped
  const pendingApproval = useHasPendingApproval(token?.address, spender)

  const [currentAllowance, setAllowance] = useState<TokenAmount | undefined>(undefined)
  const getAllowance = useCallback(async () => {
    if (!token || !account || !spender || !chainId) return
    const res = (await readContract(wagmiConfig, {
      address: token.address as Address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, spender],
      chainId: chainId as number,
    })) as bigint
    setAllowance(TokenAmount.fromRawAmount(token, res.toString()))
  }, [account, spender, token, chainId])

  useEffect(() => {
    getAllowance()
  }, [getAllowance, pendingApproval])

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amount || !spender) return ApprovalState.UNKNOWN
    if (amount.currency.isNative) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // Handle farm approval.
    if (amount.quotient.toString() === maxUint256.toString()) {
      return currentAllowance.equalTo(JSBI.BigInt(0))
        ? pendingApproval
          ? ApprovalState.PENDING
          : ApprovalState.NOT_APPROVED
        : ApprovalState.APPROVED
    }

    return currentAllowance.lessThan(amount)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amount, currentAllowance, pendingApproval, spender])
  const notify = useNotify()

  const addTransactionWithType = useTransactionAdder()

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
