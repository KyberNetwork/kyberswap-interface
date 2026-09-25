import { t } from '@lingui/macro'
import { useState } from 'react'
import { VaultApiDetailItem, useVaultDetailQuery } from 'services/vault'

import Modal from 'components/Modal'
import { useProcessingState, useProcessingSteps } from 'components/ProcessingSteps/useProcessingSteps'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { VaultDegenPromptProvider, useVaultDegenPrompt } from 'pages/Earns/components/VaultDegenPrompt'
import ConfirmDeposit, { CloseButton } from 'pages/Earns/components/VaultDeposit/ConfirmDeposit'
import DepositFields from 'pages/Earns/components/VaultDeposit/DepositFields'
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
import { useDepositForm } from 'pages/Earns/components/VaultDeposit/useDepositForm'
import VaultFormSkeleton from 'pages/Earns/components/VaultFormSkeleton'
import VaultIdentityRow from 'pages/Earns/components/VaultIdentityRow'
import VaultPriceImpactNote, {
  getPriceImpactTone,
  isPriceImpactBad,
  priceImpactButtonClass,
} from 'pages/Earns/components/VaultPriceImpactNote'
import VaultProcessingModal from 'pages/Earns/components/VaultProcessingModal'
import VaultSettingsMenu from 'pages/Earns/components/VaultSettingsMenu'
import { VaultStep } from 'pages/Earns/components/vaultSteps'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'

export type VaultDepositTarget = { chainId: number; vaultId: string }

const DepositBody = ({
  vault,
  onClose,
  onDeposited,
}: {
  vault: VaultApiDetailItem
  onClose: () => void
  onDeposited?: () => void
}) => {
  const toggleWalletModal = useWalletModalToggle()
  const { ask: askForDegenMode } = useVaultDegenPrompt()
  const { changeNetwork } = useChangeNetwork()
  const [isConfirming, setConfirming] = useState(false)
  const [actionSummary, setActionSummary] = useState('')
  const processingState = useProcessingState<VaultStep>()

  const form = useDepositForm({
    vault,
    // The quote must not move while the sequence is running.
    pausePolling: isConfirming || processingState.state.show,
  })

  const processing = useProcessingSteps<VaultStep>({
    ...processingState,
    ...form.processing,
    // Taken before the run, since finishing it clears the form the amounts are read from.
    onStart: () => {
      setActionSummary(form.amountSummary)
      setConfirming(false)
    },
    onComplete: () => {
      form.resetAmount()
      onDeposited?.()
    },
  })

  // A bad route is named and the button turned rather than disabled: what stands between it and a
  // signature is Degen Mode, which the button points at.
  const impactTone = getPriceImpactTone(form.priceImpactResult)
  const isImpactBad = isPriceImpactBad(form.priceImpactResult)

  const actionLabel = form.actionBlocker ?? (isImpactBad ? t`Deposit Anyway` : t`Deposit`)

  const onAction = () => {
    if (!form.account) return toggleWalletModal()
    if (form.wrongChain && form.chainId) return changeNetwork(form.chainId)
    // A route the form judges bad waits on Degen Mode; the button points at the setting instead of
    // signing, the way the zap flows do.
    if (form.needsDegenMode) return askForDegenMode()
    return setConfirming(true)
  }

  return (
    <>
      <ModalWrapper>
        {isConfirming ? (
          <ConfirmDeposit
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
                <ModalTitle>{t`Deposit`}</ModalTitle>
                <div className="relative flex items-center gap-2">
                  <VaultSettingsMenu />
                  <CloseButton onClose={onClose} />
                </div>
              </ModalTitleRow>
            </ModalHeader>

            <VaultIdentityRow vault={vault} />

            <DepositFields vault={vault} form={form} />

            {form.routeError && form.hasAmount ? <ErrorNote>{form.routeError}</ErrorNote> : null}

            {!form.routeError && form.hasAmount ? (
              <VaultPriceImpactNote result={form.priceImpactResult} isDegenMode={form.isDegenMode} />
            ) : null}

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
          </>
        )}
      </ModalWrapper>

      <VaultProcessingModal
        processing={processing}
        chainId={form.chainId}
        approveSymbols={form.processing.approveSymbols}
        kind="deposit"
        actionSummary={actionSummary}
        errorMessage={form.submitError}
        onClose={onClose}
      />
    </>
  )
}

/** Deposit flow opened from a vault card, where the vault detail is not already loaded. */
const VaultDepositModal = ({
  target,
  onClose,
  onDeposited,
}: {
  target: VaultDepositTarget | null
  onClose: () => void
  onDeposited?: () => void
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
        <VaultDegenPromptProvider>
          <DepositBody vault={vault} onClose={onClose} onDeposited={onDeposited} />
        </VaultDegenPromptProvider>
      ) : (
        <ModalWrapper>
          <VaultFormSkeleton kind="deposit" onClose={onClose} />
        </ModalWrapper>
      )}
    </Modal>
  )
}

export default VaultDepositModal
