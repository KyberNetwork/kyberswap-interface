import { t } from '@lingui/macro'
import { useState } from 'react'
import { VaultApiDetailItem, useVaultDetailQuery, useVaultPositionDetailQuery } from 'services/vault'

import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import WithdrawRequestList from 'pages/Earns/VaultDetail/WithdrawRequestList'
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
import ConfirmWithdraw from 'pages/Earns/components/VaultWithdraw/ConfirmWithdraw'
import WithdrawFields from 'pages/Earns/components/VaultWithdraw/WithdrawFields'
import { useWithdrawForm } from 'pages/Earns/components/VaultWithdraw/useWithdrawForm'
import { getOpenWithdrawRequests } from 'pages/Earns/utils/vault'
import { useWalletModalToggle } from 'state/application/hooks'

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

  const { data: position, refetch: refetchPosition } = useVaultPositionDetailQuery(
    { chainId: vault.chain?.id, userAddress: (account || '').toLowerCase(), vaultId: vault.vaultId },
    { skip: !account || !vault.chain?.id },
  )

  const form = useWithdrawForm({
    vault,
    position,
    pausePolling: isConfirming,
    onSubmitted: () => {
      onWithdrawn?.()
      onClose()
    },
  })

  if (isConfirming) {
    return (
      <ModalWrapper>
        <ConfirmWithdraw form={form} onBack={() => setConfirming(false)} onClose={onClose} />
      </ModalWrapper>
    )
  }

  const chainName = vault.chain?.name ?? ''
  const shareSymbol = form.shareSymbol
  const nativeAssetSymbol = form.nativeAsset?.symbol ?? ''

  const actionLabel = !form.account
    ? t`Connect Wallet`
    : form.wrongChain
    ? t`Switch to ${chainName}`
    : !form.shares
    ? t`Enter an amount`
    : form.insufficientShares
    ? t`Insufficient ${shareSymbol} balance`
    : form.belowMinimum
    ? t`Amount below the queue minimum`
    : form.needsApproval || form.isApproving
    ? t`Approve ${shareSymbol}`
    : t`Withdraw`

  const onAction = () => {
    if (!form.account) return toggleWalletModal()
    if (form.wrongChain && form.chainId) return changeNetwork(form.chainId)
    if (form.needsApproval) return form.approve()
    return setConfirming(true)
  }

  const blockingError = form.missingQueue
    ? t`Withdrawals are unavailable for this vault right now.`
    : form.noWithdrawableAsset
    ? t`No asset can be withdrawn from this vault right now.`
    : form.assetUnavailable
    ? t`${nativeAssetSymbol} cannot be withdrawn from this vault.`
    : form.zapRouteError && !form.isNative && form.shares
    ? form.zapRouteError
    : undefined

  return (
    <ModalWrapper>
      <ModalHeader>
        <ModalTitleRow>
          <ModalTitle>{t`Withdraw`}</ModalTitle>
          <CloseButton onClose={onClose} />
        </ModalTitleRow>
      </ModalHeader>

      <WithdrawFields vault={vault} form={form} />

      {blockingError ? <ErrorNote>{blockingError}</ErrorNote> : null}

      {form.chainId ? (
        <WithdrawRequestList
          chainId={form.chainId}
          requests={getOpenWithdrawRequests(position?.withdrawRequests)}
          shareSymbol={form.shareSymbol}
          shareDecimals={form.shareDecimals}
          onCancelled={() => {
            // The list this modal renders comes from the position query, so that is what has to
            // reload; the caller's own refresh is separate.
            refetchPosition()
            onWithdrawn?.()
          }}
        />
      ) : null}

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
  const { data: vault } = useVaultDetailQuery(
    { chainId: target?.chainId as number, vaultId: target?.vaultId as string },
    { skip: !target },
  )

  return (
    <Modal isOpen={Boolean(target)} onDismiss={onClose} maxWidth={480} width="480px" bgColor="transparent">
      {vault ? (
        <WithdrawBody vault={vault} onClose={onClose} onWithdrawn={onWithdrawn} />
      ) : (
        <ModalWrapper className="items-center justify-center py-10">
          <Loader size="24px" />
        </ModalWrapper>
      )}
    </Modal>
  )
}

export default VaultWithdrawModal
export { WithdrawBody }
