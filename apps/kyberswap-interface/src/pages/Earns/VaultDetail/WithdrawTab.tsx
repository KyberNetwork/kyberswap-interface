import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { VaultApiDetailItem, VaultPositionItem } from 'services/vault'

import Modal from 'components/Modal'
import { useProcessingState, useProcessingSteps } from 'components/ProcessingSteps/useProcessingSteps'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import WithdrawRequestList from 'pages/Earns/VaultDetail/WithdrawRequestList'
import { VaultRouteSummary } from 'pages/Earns/VaultDetail/ZapRouteStrip'
import { ActionBody } from 'pages/Earns/VaultDetail/styles'
import { ErrorNote, ModalWrapper, PrimaryButton } from 'pages/Earns/components/VaultDeposit/styles'
import VaultProcessingModal from 'pages/Earns/components/VaultProcessingModal'
import ConfirmWithdraw from 'pages/Earns/components/VaultWithdraw/ConfirmWithdraw'
import WithdrawFields from 'pages/Earns/components/VaultWithdraw/WithdrawFields'
import { useWithdrawForm } from 'pages/Earns/components/VaultWithdraw/useWithdrawForm'
import { VaultStep } from 'pages/Earns/components/vaultSteps'
import { getOpenWithdrawRequests } from 'pages/Earns/utils/vault'
import { useWalletModalToggle } from 'state/application/hooks'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

const WithdrawTab = ({
  vault,
  position,
  onRequested,
  onRouteChange,
}: {
  vault: VaultApiDetailItem
  position?: VaultPositionItem
  onRequested: () => void
  onRouteChange: (summary: VaultRouteSummary | null) => void
}) => {
  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useChangeNetwork()
  const [isConfirming, setConfirming] = useState(false)
  const processingState = useProcessingState<VaultStep>()

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
      onRequested()
    },
  })

  const chainName = vault.chain?.name ?? ''
  const shareSymbol = form.shareSymbol
  const nativeAssetSymbol = form.nativeAsset?.symbol ?? ''
  const openRequests = getOpenWithdrawRequests(position?.withdrawRequests)

  // Only the any-token route swaps; a native redemption goes straight to the queue.
  const routeSummary: VaultRouteSummary | null =
    !form.isNative && form.zapRoute && form.swapToken && form.zapAmountOutRaw && form.shares
      ? {
          leading: { label: vault.provider?.name ?? '', logo: vault.provider?.logo },
          from: {
            amount: formatDisplayNumber(formatUnits(form.shares, form.shareDecimals), { significantDigits: 6 }),
            symbol: form.shareSymbol,
            usd: formatDisplayNumber(form.zapRoute.zapDetails.initialAmountUsd, {
              style: 'currency',
              significantDigits: 4,
            }),
            logo: vault.shareToken?.logo,
          },
          to: {
            amount: formatDisplayNumber(formatUnits(form.zapAmountOutRaw, form.swapToken.decimals), {
              significantDigits: 6,
            }),
            symbol: form.swapToken.symbol,
            usd: formatDisplayNumber(form.zapRoute.zapDetails.finalAmountUsd, {
              style: 'currency',
              significantDigits: 4,
            }),
            logo: form.swapToken.logo,
          },
        }
      : null

  useEffect(() => {
    onRouteChange(routeSummary)
    return () => onRouteChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routeSummary)])

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
    <ActionBody>
      <WithdrawFields vault={vault} form={form} />

      {blockingError ? <ErrorNote>{blockingError}</ErrorNote> : null}

      <PrimaryButton
        className="mt-auto w-full flex-none py-2.5"
        onClick={onAction}
        disabled={Boolean(form.account) && !form.wrongChain && !form.isReady}
      >
        {actionLabel}
      </PrimaryButton>

      {form.chainId ? (
        <WithdrawRequestList
          chainId={form.chainId}
          requests={openRequests}
          shareSymbol={form.shareSymbol}
          shareDecimals={form.shareDecimals}
          onCancelled={onRequested}
        />
      ) : null}

      <VaultProcessingModal
        processing={processing}
        chainId={form.chainId}
        tokenSymbol={form.shareSymbol}
        kind={form.isNative ? 'request' : 'withdraw'}
        errorMessage={form.submitError}
      />

      <Modal
        isOpen={isConfirming}
        onDismiss={() => setConfirming(false)}
        maxWidth={480}
        width="480px"
        bgColor="transparent"
      >
        <ModalWrapper>
          <ConfirmWithdraw
            form={form}
            onBack={() => setConfirming(false)}
            onClose={() => setConfirming(false)}
            onSubmit={processing.start}
          />
        </ModalWrapper>
      </Modal>
    </ActionBody>
  )
}

export default WithdrawTab
