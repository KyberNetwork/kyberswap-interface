import { useState } from 'react'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { useActiveWeb3React } from 'hooks'
import { DEFAULT_PREPARED_ACTION_STATE } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { useWithdrawalPreview } from 'pages/CopyTrading/modals/WithdrawModal/useWithdrawalData'
import { validateWithdrawTokensPreview } from 'pages/CopyTrading/modals/WithdrawModal/utils'
import { getCopyRunOwnershipMessage, getWriteAvailabilityMessage } from 'pages/CopyTrading/modals/writeAction'

const CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_WITHDRAW_TOKENS']
export const useWithdrawTokens = ({ isOpen, copyRun }: { isOpen: boolean; copyRun: CopyRunListItem }) => {
  const { account } = useActiveWeb3React()
  const [prepareWithdrawal] = preparedActionApi.usePrepareWithdrawTokensMutation()
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
      generationId: copyRun.generationId,
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
  })
  return {
    state,
    flow,
    display,
    availabilityMessage,
    executionBlocked: !!availabilityMessage || !!display.error,
  }
}
