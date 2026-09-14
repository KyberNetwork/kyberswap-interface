import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'

import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import PreparedActionModal, {
  PreparedActionFormActions,
  PreparedActionSuccessActions,
} from 'pages/CopyTrading/modals/PreparedActionModal'
import { useWalletModalToggle } from 'state/application/hooks'

import { type WithdrawalMode, WithdrawalOptions } from './WithdrawalOptions'
import { WithdrawQuoteReview, WithdrawTokensReview } from './components'
import { useWithdrawQuote } from './useWithdrawQuote'
import { useWithdrawTokens } from './useWithdrawTokens'
import { useWithdrawalInventory } from './useWithdrawalData'
import { getWithdrawalPrimaryAction } from './utils'

const WithdrawModal = ({
  isOpen,
  onDismiss,
  copyRun,
}: {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunListItem
}) => {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const navigate = useNavigate()
  const [mode, setMode] = useState<WithdrawalMode>('all')
  const wallet = useWithdrawalInventory(copyRun, isOpen)
  // Keep both flow states mounted when switching options.
  const quote = useWithdrawQuote({ isOpen, copyRun, wallet })
  const tokens = useWithdrawTokens({ isOpen, copyRun })
  const active = mode === 'all' ? tokens : quote
  const isPreparing = quote.state.isPreparing === true || tokens.state.isPreparing === true
  const onExpectedChain = chainId === copyRun.chainId
  const terminal = copyRun.status === 'closed' || copyRun.status === 'stopped'
  const primary = getWithdrawalPrimaryAction({
    accountConnected: !!account,
    onExpectedChain,
    isPreparing,
    executionBlocked: active.executionBlocked,
    availabilityMessage: active.availabilityMessage,
    previewError: mode === 'all' ? tokens.display.error : undefined,
  })

  const changeMode = (next: WithdrawalMode) => {
    if (isPreparing || next === mode) return
    quote.flow.reset()
    tokens.flow.reset()
    setMode(next)
  }
  const dismiss = () => {
    quote.flow.reset()
    tokens.flow.reset()
    onDismiss()
  }
  const prepare = () => {
    if (!account) return toggleWalletModal()
    if (!onExpectedChain) {
      void changeNetwork(copyRun.chainId as ChainId)
      return
    }
    if (primary.disabled) return
    void active.flow.prepare()
  }
  const viewCopies = () => {
    dismiss()
    navigate(APP_PATHS.COPY_TRADING + (terminal ? '/history' : '/my-copies'))
  }

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={active.state}
      title="Withdraw tokens"
      review={
        mode === 'all' ? (
          <WithdrawTokensReview preview={tokens.state.action?.withdrawTokens} chainId={copyRun.chainId} />
        ) : (
          <WithdrawQuoteReview
            preview={quote.state.action?.withdrawQuote}
            chainId={copyRun.chainId}
            isLoading={quote.state.isPreparing === true}
          />
        )
      }
      confirmLabel={mode === 'all' ? 'Withdraw & Stop Copying' : 'Withdraw'}
      onBack={active.flow.reset}
      onConfirm={() => void active.flow.confirm()}
      onRetry={() => void active.flow.retry()}
      successTitle="Withdrawal completed"
      successActions={
        <PreparedActionSuccessActions
          onClose={dismiss}
          onPrimaryAction={viewCopies}
          primaryLabel={terminal ? 'View History' : 'My Copies'}
        />
      }
      unavailableShowBackAction
      width={480}
    >
      <Stack className="gap-4">
        <WithdrawalOptions
          mode={mode}
          changeMode={changeMode}
          disabled={isPreparing}
          copyRun={copyRun}
          wallet={wallet}
          quote={quote}
          display={tokens.display}
        />
        <PreparedActionFormActions
          onCancel={dismiss}
          onPrimaryAction={prepare}
          primaryActionLabel={primary.label}
          primaryActionDisabled={primary.disabled}
          primaryActionTitle={primary.title}
          primaryActionLoading={isPreparing}
          cancelDisabled={isPreparing}
        />
      </Stack>
    </PreparedActionModal>
  )
}
export default WithdrawModal
