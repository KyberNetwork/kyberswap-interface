import { t } from '@lingui/macro'
import { useState } from 'react'
import { VaultApiDetailItem, useVaultDetailQuery, useVaultPositionDetailQuery } from 'services/vault'

import Modal from 'components/Modal'
import { useProcessingState, useProcessingSteps } from 'components/ProcessingSteps/useProcessingSteps'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import WithdrawRequestsPanel from 'pages/Earns/VaultDetail/WithdrawRequestsPanel'
import { CloseButton } from 'pages/Earns/components/VaultDeposit/ConfirmDeposit'
import {
  ButtonGroup,
  ErrorNote,
  ModalHeader,
  ModalTitle,
  ModalTitleRow,
  ModalWrapper,
  OutlinedButton,
  PrimaryButton,
} from 'pages/Earns/components/VaultDeposit/styles'
import VaultFormSkeleton from 'pages/Earns/components/VaultFormSkeleton'
import VaultIdentityRow from 'pages/Earns/components/VaultIdentityRow'
import VaultPriceImpactNote, {
  getPriceImpactTone,
  isPriceImpactBad,
  priceImpactButtonClass,
} from 'pages/Earns/components/VaultPriceImpactNote'
import VaultProcessingModal from 'pages/Earns/components/VaultProcessingModal'
import ConfirmWithdraw from 'pages/Earns/components/VaultWithdraw/ConfirmWithdraw'
import WithdrawFields from 'pages/Earns/components/VaultWithdraw/WithdrawFields'
import { useWithdrawForm } from 'pages/Earns/components/VaultWithdraw/useWithdrawForm'
import { VaultStep } from 'pages/Earns/components/vaultSteps'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'

export type VaultWithdrawTarget = { chainId: number; vaultId: string }

const WithdrawBody = ({
  vault,
  onClose,
  onWithdrawn,
}: {
  vault: VaultApiDetailItem
  onClose: () => void
  onWithdrawn?: () => void
}) => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useChangeNetwork()
  const [isConfirming, setConfirming] = useState(false)
  const processingState = useProcessingState<VaultStep>()

  const { data: position, refetch: refetchPosition } = useVaultPositionDetailQuery(
    { chainId: vault.chain?.id, userAddress: (account || '').toLowerCase(), vaultId: vault.vaultId },
    { skip: !account || !vault.chain?.id },
  )

  const form = useWithdrawForm({
    vault,
    position,
    // The quote must not move while the sequence is running.
    pausePolling: isConfirming || processingState.state.show,
  })

  const processing = useProcessingSteps<VaultStep>({
    ...processingState,
    ...form.processing,
    onStart: () => setConfirming(false),
    onComplete: () => {
      form.resetAmount()
      onWithdrawn?.()
    },
  })

  // A bad route still goes through: it is named and the button turned, not disabled — the vault
  // has no degen mode to switch the guard off with.
  const impactTone = getPriceImpactTone(form.priceImpactResult)
  const isImpactBad = isPriceImpactBad(form.priceImpactResult)

  const actionLabel = form.actionBlocker ?? (isImpactBad ? t`Withdraw Anyway` : t`Withdraw`)

  const onAction = () => {
    if (!form.account) return toggleWalletModal()
    if (form.wrongChain && form.chainId) return changeNetwork(form.chainId)
    return setConfirming(true)
  }

  const blockingError = form.blockingError

  return (
    <>
      <ModalWrapper>
        {isConfirming ? (
          <ConfirmWithdraw
            vault={vault}
            form={form}
            onBack={() => setConfirming(false)}
            onClose={onClose}
            onSubmit={processing.start}
          />
        ) : (
          <>
            <ModalHeader>
              <ModalTitleRow>
                <ModalTitle>{t`Withdraw`}</ModalTitle>
                <CloseButton onClose={onClose} />
              </ModalTitleRow>
            </ModalHeader>

            <VaultIdentityRow vault={vault} />

            <WithdrawFields vault={vault} form={form} />

            {blockingError ? <ErrorNote>{blockingError}</ErrorNote> : null}

            {!blockingError ? <VaultPriceImpactNote result={form.priceImpactResult} /> : null}

            <ButtonGroup>
              <OutlinedButton onClick={onClose}>{t`Cancel`}</OutlinedButton>
              <PrimaryButton
                className={cn(form.isReady && priceImpactButtonClass(impactTone))}
                onClick={onAction}
                disabled={Boolean(form.account) && !form.wrongChain && !form.isReady}
              >
                {actionLabel}
              </PrimaryButton>
            </ButtonGroup>

            <WithdrawRequestsPanel
              vault={vault}
              onChanged={() => {
                refetchPosition()
                onWithdrawn?.()
              }}
            />
          </>
        )}
      </ModalWrapper>

      <VaultProcessingModal
        processing={processing}
        chainId={form.chainId}
        tokenSymbol={form.shareSymbol}
        kind={form.isNative ? 'request' : 'withdraw'}
        errorMessage={form.submitError}
        onClose={onClose}
      />
    </>
  )
}

/** Withdraw flow opened from a vault card, where the vault detail is not already loaded. */
const VaultWithdrawModal = ({
  target,
  onClose,
  onWithdrawn,
}: {
  target: VaultWithdrawTarget | null
  onClose: () => void
  onWithdrawn?: () => void
}) => {
  // `currentData`, not `data`: the latter holds whatever vault this hook last resolved, so
  // reopening on another one would render the previous vault's tokens until the new read lands.
  const { currentData: vault } = useVaultDetailQuery(
    { chainId: target?.chainId as number, vaultId: target?.vaultId as string },
    { skip: !target },
  )

  return (
    <Modal isOpen={Boolean(target)} onDismiss={onClose} maxWidth={480} width="480px" bgColor="transparent">
      {vault ? (
        <WithdrawBody vault={vault} onClose={onClose} onWithdrawn={onWithdrawn} />
      ) : (
        <ModalWrapper>
          <VaultFormSkeleton kind="withdraw" onClose={onClose} />
        </ModalWrapper>
      )}
    </Modal>
  )
}

export default VaultWithdrawModal
export { WithdrawBody }
