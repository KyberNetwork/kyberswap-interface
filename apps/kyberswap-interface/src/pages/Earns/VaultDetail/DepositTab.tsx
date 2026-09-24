import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
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
import { toRouteSwaps, toRouteTokenMap } from 'pages/Earns/utils/vaultRoute'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { getNativeTokenLogo, getTokenLogoURL } from 'utils/tokenLogo'
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

  // Every token the route can name: what is being spent, and the shares it buys. A native row is
  // registered under both spellings, since the route may echo it back either way.
  const routeTokens = toRouteTokenMap([
    ...spent.flatMap(row => {
      // A row picked from the selector carries its logo; the opening pick is an SDK currency, so
      // its mark is derived the way CurrencyLogo would.
      const logo =
        row.logo ??
        (row.currency.isNative
          ? getNativeTokenLogo(row.currency.chainId)
          : getTokenLogoURL(row.currency.wrapped.address, row.currency.chainId))
      const info = { symbol: row.currency.symbol, decimals: row.currency.decimals, logo }
      return row.currency.isNative
        ? [
            { ...info, address: NATIVE_TOKEN_ADDRESS },
            { ...info, address: row.currency.wrapped.address },
          ]
        : [{ ...info, address: row.currency.wrapped.address }]
    }),
    vault.shareToken,
  ])
  const swaps = toRouteSwaps(form.route, routeTokens)

  // A same-asset deposit has nothing to show; anything else swaps on the way in.
  const routeSummary: VaultRouteSummary | null =
    !form.isVaultAsset && form.route && swaps.length > 0 && form.sharesOutRaw
      ? {
          // The amounts the route itself quotes, rather than what the form was typed with.
          from: swaps.map(swap => swap.from),
          fromUsd: formatDisplayNumber(form.route.zapDetails.initialAmountUsd, {
            style: 'currency',
            significantDigits: 4,
          }),
          to: {
            amount: formatDisplayNumber(formatUnits(form.sharesOutRaw, vault.shareToken?.decimals ?? 18), {
              significantDigits: 6,
            }),
            symbol: vault.shareToken?.symbol ?? '',
            logo: vault.shareToken?.logo,
          },
          toUsd: formatDisplayNumber(form.route.zapDetails.finalAmountUsd, {
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

  // A bad route still goes through: it is named and the button turned, not disabled — the vault
  // has no degen mode to switch the guard off with.
  const isImpactBad = form.priceImpactResult.isVeryHigh || form.priceImpactResult.isInvalid
  // The button names the token only when there is one to name.
  const singleSymbol = spent.length > 1 ? '' : spent[0]?.currency.symbol ?? ''

  const actionLabel =
    form.actionBlocker ?? (isImpactBad ? t`Deposit Anyway` : singleSymbol ? t`Deposit ${singleSymbol}` : t`Deposit`)

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
