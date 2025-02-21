import { MaxUint256 } from '@ethersproject/constants'
import { Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { Interface } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useCallback, useMemo } from 'react'

import { NotificationType } from 'components/Announcement/type'
import ERC20_ABI from 'constants/abis/erc20.json'
import { useTokenAllowance } from 'data/Allowances'
import { useNotify } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { useHasPendingApproval, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { usePaymentToken } from 'state/user/hooks'
import { calculateGasMargin } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { friendlyError } from 'utils/errorMessage'
import { computeSlippageAdjustedAmounts } from 'utils/prices'
import { paymasterExecute } from 'utils/sendTransaction'

import { useActiveWeb3React } from './index'
import { useTokenSigningContract } from './useContract'

const ERC20Interface = new Interface(ERC20_ABI)

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
): [ApprovalState, (customAllowance?: CurrencyAmount<Currency>) => Promise<void>, TokenAmount | undefined] {
  const { account } = useActiveWeb3React()
  const token = amountToApprove?.currency.wrapped
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)
  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency.isNative) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // Handle farm approval.
    if (amountToApprove.quotient.toString() === MaxUint256.toString()) {
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

  const tokenContract = useTokenSigningContract(token?.address)
  const addTransactionWithType = useTransactionAdder()
  const [paymentToken] = usePaymentToken()

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

        if (!tokenContract) {
          console.error('tokenContract is null')
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

        let estimatedGas
        let approvedAmount
        try {
          if (customAmount instanceof CurrencyAmount) {
            estimatedGas = await tokenContract.estimateGas.approve(spender, customAmount)
            approvedAmount = customAmount
          } else {
            estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256)
            approvedAmount = MaxUint256
          }
        } catch (e) {
          try {
            estimatedGas = await tokenContract.estimateGas.approve(spender, amountToApprove.quotient.toString())
            approvedAmount = amountToApprove.quotient.toString()
          } catch {
            estimatedGas = await tokenContract.estimateGas.approve(spender, '0')
            return paymentToken?.address
              ? paymasterExecute(
                  paymentToken.address,
                  {
                    from: account,
                    to: token.address,
                    data: ERC20Interface.encodeFunctionData('approve', [spender, '0']),
                  },
                  calculateGasMargin(estimatedGas).toNumber(),
                )
              : tokenContract.approve(spender, '0', {
                  gasLimit: calculateGasMargin(estimatedGas),
                })
          }
        }

        const response = await (paymentToken?.address
          ? paymasterExecute(
              paymentToken.address,
              {
                from: account,
                to: token.address,
                data: ERC20Interface.encodeFunctionData('approve', [spender, approvedAmount]),
              },
              // increase x2 for approval only due to failed tx bcs of gasLimit
              // for more detail: https://team-kyber.slack.com/archives/C048KKJ4TPW/p1718600494715929?thread_ts=1718267233.557269&cid=C048KKJ4TPW
              estimatedGas.toNumber() * 2,
            )
          : tokenContract.approve(spender, approvedAmount, {
              gasLimit: calculateGasMargin(estimatedGas),
            }))
        addTransactionWithType({
          hash: response.hash,
          type: TRANSACTION_TYPE.APPROVE,
          extraInfo: {
            tokenSymbol: token.symbol ?? '',
            tokenAddress: token.address,
            contract: spender,
          },
        })
      } catch (error) {
        const message = friendlyError(error)
        console.error('Approve token error:', { message, error })
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
      tokenContract,
      amountToApprove,
      spender,
      addTransactionWithType,
      forceApprove,
      notify,
      paymentToken?.address,
    ],
  )

  return [approvalState, approve, currentAllowance]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTradeV2(
  trade?: Aggregator,
  allowedSlippage = 0,
): [ApprovalState, () => Promise<void>, TokenAmount | undefined] {
  const amountToApprove = useMemo(
    () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
    [trade, allowedSlippage],
  )

  return useApproveCallback(amountToApprove, trade?.routerAddress)
}
