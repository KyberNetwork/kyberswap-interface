import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { VaultApiDetailItem } from 'services/vault'

import Modal from 'components/Modal'
import { useProcessingState, useProcessingSteps } from 'components/ProcessingSteps/useProcessingSteps'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { VaultRouteSummary } from 'pages/Earns/VaultDetail/ZapRouteStrip'
import { ActionBody } from 'pages/Earns/VaultDetail/styles'
import ConfirmDeposit from 'pages/Earns/components/VaultDeposit/ConfirmDeposit'
import DepositFields from 'pages/Earns/components/VaultDeposit/DepositFields'
import { ErrorNote, ModalWrapper, PrimaryButton } from 'pages/Earns/components/VaultDeposit/styles'
import { useDepositForm } from 'pages/Earns/components/VaultDeposit/useDepositForm'
import VaultPriceImpactNote from 'pages/Earns/components/VaultPriceImpactNote'
import VaultProcessingModal from 'pages/Earns/components/VaultProcessingModal'
import { VaultStep } from 'pages/Earns/components/vaultSteps'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

const DepositTab = ({
  vault,
  onDeposited,
  onRouteChange,
}: {
  vault: VaultApiDetailItem
  onDeposited: () => void
  onRouteChange: (summary: VaultRouteSummary | null) => void
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
      onDeposited()
    },
  })

  /** Only the rows carrying an amount are being spent. */
  const spent = form.rows.filter(row => row.parsedAmount?.greaterThan(0))
  const isMultiToken = spent.length > 1

  // A same-asset deposit has nothing to show; anything else swaps on the way in.
  const routeSummary: VaultRouteSummary | null =
    !form.isVaultAsset && form.route && spent.length > 0 && form.sharesOutRaw
      ? {
          from: {
            // One token fills "amount symbol"; several are spelled out in the amount instead, since
            // the strip has a single slot for a symbol and a single logo.
            amount: isMultiToken
              ? spent
                  .map(row =>
                    `${formatDisplayNumber(row.parsedAmount?.toExact() ?? '0', { significantDigits: 6 })} ${
                      row.currency.symbol ?? ''
                    }`.trim(),
                  )
                  .join(' + ')
              : formatDisplayNumber(spent[0]?.parsedAmount?.toExact() ?? '0', { significantDigits: 6 }),
            symbol: isMultiToken ? '' : spent[0]?.currency.symbol ?? '',
            usd: formatDisplayNumber(form.route.zapDetails.initialAmountUsd, {
              style: 'currency',
              significantDigits: 4,
            }),
            logo: isMultiToken ? undefined : spent[0]?.logo,
          },
          to: {
            amount: formatDisplayNumber(formatUnits(form.sharesOutRaw, vault.shareToken?.decimals ?? 18), {
              significantDigits: 6,
            }),
            symbol: vault.shareToken?.symbol ?? '',
            usd: formatDisplayNumber(form.route.zapDetails.finalAmountUsd, {
              style: 'currency',
              significantDigits: 4,
            }),
            logo: vault.shareToken?.logo,
          },
        }
      : null

  useEffect(() => {
    onRouteChange(routeSummary)
    return () => onRouteChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routeSummary)])

  const chainName = vault.chain?.name ?? ''
  // A bad route still goes through: it is named and the button turned, not disabled — the vault
  // has no degen mode to switch the guard off with.
  const isImpactBad = form.priceImpactResult.isVeryHigh || form.priceImpactResult.isInvalid
  const singleSymbol = isMultiToken ? '' : spent[0]?.currency.symbol ?? ''

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
    : singleSymbol
    ? t`Deposit ${singleSymbol}`
    : t`Deposit`

  const onAction = () => {
    if (!form.account) return toggleWalletModal()
    if (form.wrongChain && form.chainId) return changeNetwork(form.chainId)
    return setConfirming(true)
  }

  return (
    <ActionBody>
      <DepositFields vault={vault} form={form} />

      {form.routeError && form.hasAmount ? <ErrorNote>{form.routeError}</ErrorNote> : null}

      {!form.routeError && form.hasAmount ? <VaultPriceImpactNote result={form.priceImpactResult} /> : null}

      <PrimaryButton
        className={cn('mt-auto w-full flex-none py-2.5', isImpactBad && form.isReady && 'bg-red text-white')}
        onClick={onAction}
        disabled={Boolean(form.account) && !form.wrongChain && !form.isReady}
      >
        {actionLabel}
      </PrimaryButton>

      <VaultProcessingModal
        processing={processing}
        chainId={form.chainId}
        approveSymbols={form.processing.approveSymbols}
        kind="deposit"
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
          <ConfirmDeposit
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

export default DepositTab
