import { t } from '@lingui/macro'
import { useState } from 'react'
import { VaultApiDetailItem, useVaultDetailQuery } from 'services/vault'

import Modal from 'components/Modal'
import { useProcessingState, useProcessingSteps } from 'components/ProcessingSteps/useProcessingSteps'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
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
import VaultPriceImpactNote from 'pages/Earns/components/VaultPriceImpactNote'
import VaultProcessingModal from 'pages/Earns/components/VaultProcessingModal'
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
  const { changeNetwork } = useChangeNetwork()
  const [isConfirming, setConfirming] = useState(false)
  const processingState = useProcessingState<VaultStep>()

  const form = useDepositForm({
    vault,
    // The quote must not move while the sequence is running.
    pausePolling: isConfirming || processingState.state.show,
  })

  const processing = useProcessingSteps<VaultStep>({
    ...processingState,
    ...form.processing,
    onStart: () => setConfirming(false),
    onComplete: () => {
      form.resetAmount()
      onDeposited?.()
    },
  })

  const chainName = vault.chain?.name ?? ''
  // A bad route still goes through: it is named and the button turned, not disabled — the vault
  // has no degen mode to switch the guard off with.
  const isImpactBad = form.priceImpactResult.isVeryHigh || form.priceImpactResult.isInvalid

  const actionLabel = !form.account
    ? t`Connect Wallet`
    : form.wrongChain
    ? t`Switch to ${chainName}`
    : !form.hasAmount
    ? t`Enter an amount`
    : form.insufficientBalance
    ? t`Insufficient balance`
    : form.isRouteLoading && !form.route
    ? t`Finding best route`
    : form.routeError
    ? t`No route found`
    : isImpactBad
    ? t`Deposit Anyway`
    : t`Deposit`

  const onAction = () => {
    if (!form.account) return toggleWalletModal()
    if (form.wrongChain && form.chainId) return changeNetwork(form.chainId)
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
                <CloseButton onClose={onClose} />
              </ModalTitleRow>
            </ModalHeader>

            <VaultIdentityRow vault={vault} />

            <DepositFields vault={vault} form={form} />

            {form.routeError && form.hasAmount ? <ErrorNote>{form.routeError}</ErrorNote> : null}

            {!form.routeError && form.hasAmount ? <VaultPriceImpactNote result={form.priceImpactResult} /> : null}

            <ButtonGroup>
              <OutlinedButton onClick={onClose}>{t`Cancel`}</OutlinedButton>
              <PrimaryButton
                className={cn(isImpactBad && form.isReady && 'bg-red text-white')}
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
  const { data: vault } = useVaultDetailQuery(
    { chainId: target?.chainId as number, vaultId: target?.vaultId as string },
    { skip: !target },
  )

  return (
    <Modal isOpen={Boolean(target)} onDismiss={onClose} maxWidth={480} width="480px" bgColor="transparent">
      {vault ? (
        <DepositBody vault={vault} onClose={onClose} onDeposited={onDeposited} />
      ) : (
        <ModalWrapper>
          <VaultFormSkeleton kind="deposit" onClose={onClose} />
        </ModalWrapper>
      )}
    </Modal>
  )
}

export default VaultDepositModal
