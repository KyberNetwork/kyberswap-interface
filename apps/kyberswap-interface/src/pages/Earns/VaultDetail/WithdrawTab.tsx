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
import { toRouteSwaps, toRouteTokenMap } from 'pages/Earns/utils/vaultRoute'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'
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

  // A bad route still goes through: it is named and the button turned, not disabled — the vault
  // has no degen mode to switch the guard off with.
  const impactTone = getPriceImpactTone(form.priceImpactResult)
  const isImpactBad = isPriceImpactBad(form.priceImpactResult)

  // Only the any-token route swaps; a native redemption goes straight to the queue.
  // The shares going in, and the token the route sells them into.
  const routeTokens = toRouteTokenMap([
    {
      address: vault.shareToken?.address,
      symbol: form.shareSymbol,
      decimals: form.shareDecimals,
      logo: vault.shareToken?.logo,
    },
    form.swapToken,
  ])
  const swaps = toRouteSwaps(form.zapRoute, routeTokens)

  const routeSummary: VaultRouteSummary | null =
    !form.isNative && form.zapRoute && form.swapToken && form.zapAmountOutRaw && swaps.length > 0
      ? {
          leading: { label: vault.provider?.name ?? '', logo: vault.provider?.logo },
          from: swaps.map(swap => swap.from),
          fromUsd: formatDisplayNumber(form.zapRoute.zapDetails.initialAmountUsd, {
            style: 'currency',
            significantDigits: 4,
          }),
          to: {
            amount: formatDisplayNumber(formatUnits(form.zapAmountOutRaw, form.swapToken.decimals), {
              significantDigits: 6,
            }),
            symbol: form.swapToken.symbol,
            logo: form.swapToken.logo,
          },
          toUsd: formatDisplayNumber(form.zapRoute.zapDetails.finalAmountUsd, {
            style: 'currency',
            significantDigits: 4,
          }),
        }
      : null

  useEffect(() => {
    onRouteChange(routeSummary)
    return () => onRouteChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routeSummary)])

  const actionLabel = form.actionBlocker ?? (isImpactBad ? t`Withdraw Anyway` : t`Withdraw`)

  const onAction = () => {
    if (!form.account) return toggleWalletModal()
    if (form.wrongChain && form.chainId) return changeNetwork(form.chainId)
    return setConfirming(true)
  }

  const blockingError = form.blockingError

  return (
    <ActionBody>
      <WithdrawFields vault={vault} form={form} />

      {blockingError ? <ErrorNote>{blockingError}</ErrorNote> : null}

      {!blockingError ? <VaultPriceImpactNote result={form.priceImpactResult} /> : null}

      <PrimaryButton
        className={cn('mt-auto w-full flex-none py-2.5', form.isReady && priceImpactButtonClass(impactTone))}
        onClick={onAction}
        disabled={Boolean(form.account) && !form.wrongChain && !form.isReady}
      >
        {actionLabel}
      </PrimaryButton>

      {form.chainId ? (
        <WithdrawRequestList
          chainId={form.chainId}
          requests={form.withdrawRequests}
          assets={form.supportedAssets}
          shareSymbol={form.shareSymbol}
          shareDecimals={form.shareDecimals}
          onCancelled={() => {
            // The rows come from the requests query, not the position; only reloading the latter
            // would leave the cancelled row on screen with its button live until the next poll.
            form.refetchRequests()
            onRequested()
          }}
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
            vault={vault}
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
