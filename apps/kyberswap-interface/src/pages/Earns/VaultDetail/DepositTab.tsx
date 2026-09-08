import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { VaultApiDetailItem } from 'services/vault'

import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { VaultRouteSummary } from 'pages/Earns/VaultDetail/ZapRouteStrip'
import { ActionBody } from 'pages/Earns/VaultDetail/styles'
import ConfirmDeposit from 'pages/Earns/components/VaultDeposit/ConfirmDeposit'
import DepositFields from 'pages/Earns/components/VaultDeposit/DepositFields'
import { ErrorNote, ModalWrapper, PrimaryButton } from 'pages/Earns/components/VaultDeposit/styles'
import { useDepositForm } from 'pages/Earns/components/VaultDeposit/useDepositForm'
import { useWalletModalToggle } from 'state/application/hooks'
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

  const form = useDepositForm({
    vault,
    pausePolling: isConfirming,
    onSubmitted: () => {
      setConfirming(false)
      onDeposited()
    },
  })

  // A same-asset deposit has nothing to show; anything else swaps on the way in.
  const routeSummary: VaultRouteSummary | null =
    !form.isVaultAsset && form.route && form.currency && form.sharesOutRaw
      ? {
          from: {
            amount: formatDisplayNumber(form.parsedAmount?.toExact() ?? '0', { significantDigits: 6 }),
            symbol: form.currency.symbol ?? '',
            usd: formatDisplayNumber(form.route.zapDetails.initialAmountUsd, {
              style: 'currency',
              significantDigits: 4,
            }),
            logo: form.currencyLogo,
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
    : t`Deposit ${currencySymbol}`

  const onAction = () => {
    if (!form.account) return toggleWalletModal()
    if (form.wrongChain && form.chainId) return changeNetwork(form.chainId)
    if (form.needsApproval) return form.approve()
    return setConfirming(true)
  }

  return (
    <ActionBody>
      <DepositFields vault={vault} form={form} />

      {form.routeError && form.hasAmount ? <ErrorNote>{form.routeError}</ErrorNote> : null}

      <PrimaryButton
        className="mt-auto w-full flex-none py-2.5"
        onClick={onAction}
        disabled={Boolean(form.account) && !form.wrongChain && !form.isReady && !form.needsApproval}
      >
        {form.isApproving ? <Loader size="16px" /> : null}
        {actionLabel}
      </PrimaryButton>

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
          />
        </ModalWrapper>
      </Modal>
    </ActionBody>
  )
}

export default DepositTab
