import { useCallback } from 'react'
import { useActiveWeb3 } from './useWeb3Provider'
import { useApprovals } from '@kyber/hooks/use-approval'

export enum APPROVAL_STATE {
  UNKNOWN = 'unknown',
  PENDING = 'pending',
  APPROVED = 'approved',
  NOT_APPROVED = 'not_approved',
}
function useApproval(amountToApproveString: string, token: string, spender: string) {
  const { connectedAccount, rpcUrl, onSubmitTx } = useActiveWeb3()
  const { approvalStates, approve, loading } = useApprovals(
    [amountToApproveString],
    [token],
    connectedAccount.address || '',
    spender,
    rpcUrl,
    onSubmitTx,
  )

  return {
    loading,
    approvalState: approvalStates[token],
    approve: useCallback(
      (amount?: bigint) => {
        approve(token, amount)
      },
      [approve, token],
    ),
  }
}

export default useApproval
