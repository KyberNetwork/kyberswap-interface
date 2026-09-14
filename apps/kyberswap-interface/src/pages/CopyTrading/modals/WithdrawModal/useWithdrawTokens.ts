import { useState } from 'react'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { useActiveWeb3React } from 'hooks'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import {
  hasWithdrawalBalanceConverged,
  pollCopyTradingProjection,
} from 'pages/CopyTrading/modals/PreparedActionModal/postReceipt'
import { DEFAULT_PREPARED_ACTION_STATE } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { getCopyRunOwnershipMessage, getWriteAvailabilityMessage } from 'pages/CopyTrading/modals/writeAction'

import { useWithdrawalPreview } from './useWithdrawalData'
import { validateWithdrawTokensPreview } from './utils'

const CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_WITHDRAW_TOKENS']
export const useWithdrawTokens = ({ isOpen, copyRun }: { isOpen: boolean; copyRun: CopyRunListItem }) => {
  const { account } = useActiveWeb3React()
  const refresh = useRefreshCopyTrading()
  const [prepareWithdrawal] = preparedActionApi.usePrepareWithdrawTokensMutation()
  const [getInventory] = copyAccountApi.useLazyGetCopyAccountWalletInventoryQuery()
  const [state, setState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const ownershipMessage = getCopyRunOwnershipMessage(copyRun.ownerAddress, account)
  const availabilityMessage = getWriteAvailabilityMessage(copyRun.withdrawTokensAvailability, ownershipMessage)
  const display = useWithdrawalPreview(copyRun, account, isOpen && !availabilityMessage)
  const flow = usePreparedAction({
    state,
    setState,
    expected: {
      account: account || '',
      chainId: copyRun.chainId,
      copyAccount: copyRun.copyAccount,
      callKinds: CALL_KINDS,
      preview: 'withdrawTokens',
    },
    prepare: async () => {
      if (!account) throw new Error('Connect your wallet first.')
      if (ownershipMessage) throw new Error(ownershipMessage)
      const response = await prepareWithdrawal({
        ownerAddress: account.toLowerCase(),
        copyRunId: copyRun.copyRunId,
        selection: 'WITHDRAW_TOKEN_SELECTION_ALL_INDEXED_TOKENS',
      }).unwrap()
      if (response.data.status === 'PREPARED_ACTION_STATUS_READY') {
        const error = validateWithdrawTokensPreview(response.data.withdrawTokens, account)
        if (error) throw new Error(error)
      }
      return response.data
    },
    afterReceipt: async (action, _hash, block) => {
      await pollCopyTradingProjection({
        errorMessage:
          'Your withdrawal is confirmed, but wallet balances are still syncing. Refresh status to try again.',
        fetch: () => getInventory({ chainId: copyRun.chainId, copyAccount: copyRun.copyAccount }).unwrap(),
        isConverged: inventory =>
          hasWithdrawalBalanceConverged(
            inventory,
            block,
            action.withdrawTokens?.quoteToken?.address,
            action.withdrawTokens?.tokens,
          ),
      })
      refresh()
    },
    onComplete: refresh,
  })
  return {
    state,
    flow,
    display,
    availabilityMessage,
    executionBlocked: !!availabilityMessage || !!display.error,
  }
}
