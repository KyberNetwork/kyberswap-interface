import { Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
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

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string,
  forceApprove = false,
  onApprovalError?: (error: { message: string; tokenSymbol?: string; tokenAddress?: string; spender?: string }) => void,
): [ApprovalState, (customAllowance?: CurrencyAmount<Currency>) => Promise<void>, TokenAmount | undefined] {
  const { account, chainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const token = amountToApprove?.currency.wrapped
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
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency.isNative) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // Handle farm approval.
    if (amountToApprove.quotient.toString() === maxUint256.toString()) {
      return currentAllowance.equalTo(JSBI.BigInt(0))
        ? pendingApproval
          ? ApprovalState.PENDING
          : ApprovalState.NOT_APPROVED
        : ApprovalState.APPROVED
    }

    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])
  const notify = useNotify()

  const addTransactionWithType = useTransactionAdder()

  const approve = useCallback(
    async (customAmount?: CurrencyAmount<Currency>): Promise<void> => {
      try {
        if (approvalState !== ApprovalState.NOT_APPROVED && !forceApprove) {
          console.error('approve was called unnecessarily')
          return
        }
        if (!token) {
          console.error('no token')
          return
        }

        if (!account) {
          console.error('no account')
          return
        }

        if (!amountToApprove) {
          console.error('missing amount to approve')
          return
        }

        if (!spender) {
          console.error('no spender')
          return
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
          try {
            response = await sendApprove(BigInt(amountToApprove.quotient.toString()))
          } catch {
            // Reset allowance to 0 (USDT-style non-compliant tokens require approving 0
            // before a new non-zero amount). Still surface the tx in the wallet history.
            response = await sendApprove(0n)
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
        }
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
      }
    },
    [
      account,
      approvalState,
      token,
      amountToApprove,
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
