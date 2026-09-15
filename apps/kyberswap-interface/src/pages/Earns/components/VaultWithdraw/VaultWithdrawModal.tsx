import { t } from '@lingui/macro'
import { useState } from 'react'
import { VaultApiDetailItem, useVaultDetailQuery, useVaultPositionDetailQuery } from 'services/vault'

import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { useProcessingState, useProcessingSteps } from 'components/ProcessingSteps/useProcessingSteps'
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
import VaultProcessingModal from 'pages/Earns/components/VaultProcessingModal'
import ConfirmWithdraw from 'pages/Earns/components/VaultWithdraw/ConfirmWithdraw'
import WithdrawFields from 'pages/Earns/components/VaultWithdraw/WithdrawFields'
import { useWithdrawForm } from 'pages/Earns/components/VaultWithdraw/useWithdrawForm'
import { VaultStep } from 'pages/Earns/components/vaultSteps'
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
    : t`Withdraw`

  const onAction = () => {
    if (!form.account) return toggleWalletModal()
    if (form.wrongChain && form.chainId) return changeNetwork(form.chainId)
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
    <>
      <ModalWrapper>
        {isConfirming ? (
          <ConfirmWithdraw
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

            <WithdrawFields vault={vault} form={form} />

            {blockingError ? <ErrorNote>{blockingError}</ErrorNote> : null}

            {form.chainId ? (
              <WithdrawRequestList
                chainId={form.chainId}
                requests={getOpenWithdrawRequests(position?.withdrawRequests)}
                shareSymbol={form.shareSymbol}
                shareDecimals={form.shareDecimals}
                onCancelled={() => {
                  // The list this modal renders comes from the position query, so that is what has
                  // to reload; the caller's own refresh is separate.
                  refetchPosition()
                  onWithdrawn?.()
                }}
              />
            ) : null}

            <ButtonGroup>
              <OutlinedButton onClick={onClose}>{t`Cancel`}</OutlinedButton>
              <PrimaryButton onClick={onAction} disabled={Boolean(form.account) && !form.wrongChain && !form.isReady}>
                {actionLabel}
              </PrimaryButton>
            </ButtonGroup>
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
