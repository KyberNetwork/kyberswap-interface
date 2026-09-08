import { t } from '@lingui/macro'
import { useState } from 'react'
import { VaultApiDetailItem, useVaultDetailQuery } from 'services/vault'

import Loader from 'components/Loader'
import Modal from 'components/Modal'
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
import { useWalletModalToggle } from 'state/application/hooks'

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

  const form = useDepositForm({
    vault,
    pausePolling: isConfirming,
    onSubmitted: () => {
      onDeposited?.()
      onClose()
    },
  })

  if (isConfirming) {
    return (
      <ModalWrapper>
        <ConfirmDeposit vault={vault} form={form} onBack={() => setConfirming(false)} onClose={onClose} />
      </ModalWrapper>
    )
  }

  const chainName = vault.chain?.name ?? ''
  const currencySymbol = form.currency?.symbol ?? ''

  const actionLabel = !form.account
    ? t`Connect Wallet`
    : form.wrongChain
    ? t`Switch to ${chainName}`
    : !form.hasAmount
    ? t`Enter an amount`
    : form.insufficientBalance
    ? t`Insufficient ${currencySymbol} balance`
    : form.isRouteLoading && !form.route
    ? t`Finding best route`
    : form.needsApproval || form.isApproving
    ? t`Approve ${currencySymbol}`
    : t`Deposit`

  const onAction = () => {
    if (!form.account) return toggleWalletModal()
    if (form.wrongChain && form.chainId) return changeNetwork(form.chainId)
    if (form.needsApproval) return form.approve()
    return setConfirming(true)
  }

  return (
    <ModalWrapper>
      <ModalHeader>
        <ModalTitleRow>
          <ModalTitle>{t`Deposit`}</ModalTitle>
          <CloseButton onClose={onClose} />
        </ModalTitleRow>
      </ModalHeader>

      <DepositFields vault={vault} form={form} />

      {form.routeError && form.hasAmount ? <ErrorNote>{form.routeError}</ErrorNote> : null}

      <ButtonGroup>
        <OutlinedButton onClick={onClose}>{t`Cancel`}</OutlinedButton>
        <PrimaryButton
          onClick={onAction}
          disabled={Boolean(form.account) && !form.wrongChain && !form.isReady && !form.needsApproval}
        >
          {form.isApproving ? <Loader size="16px" /> : null}
          {actionLabel}
        </PrimaryButton>
      </ButtonGroup>
    </ModalWrapper>
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
        <ModalWrapper className="items-center justify-center py-10">
          <Loader size="24px" />
        </ModalWrapper>
      )}
    </Modal>
  )
}

export default VaultDepositModal
