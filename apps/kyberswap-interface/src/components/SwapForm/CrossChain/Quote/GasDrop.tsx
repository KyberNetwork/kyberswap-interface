import { Trans, t } from '@lingui/macro'
import { useState } from 'react'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { useGasDropValue } from 'pages/Swap/crossChain/hooks/useGasDropValue'
import { getChainName } from 'pages/Swap/crossChain/utils'
import { CloseIcon } from 'theme'
import { Chain, GasDropQuote } from 'types/crossChain'
import { formatDisplayNumber } from 'utils/numbers'

type GasDropOptionProps = {
  chain: Chain
  provider?: string
  outputSymbol?: string
  gasDrop?: GasDropQuote
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export const GasDropOption = ({ chain, provider, outputSymbol, gasDrop, enabled, onChange }: GasDropOptionProps) => {
  const { amountUsd, symbol } = useGasDropValue(gasDrop, chain)
  const usd = amountUsd != null ? formatDisplayNumber(amountUsd, { style: 'currency', fractionDigits: 2 }) : '--'

  return enabled ? (
    <HStack className="min-h-6 items-center gap-1 text-sm text-subText">
      <span className="font-medium">
        <Trans>
          + Adding {usd} of {symbol}
        </Trans>
      </span>
      <CloseIcon
        className="size-3.5 min-w-3.5 text-subText hover:text-text"
        aria-label={t`Remove Gas Drop`}
        role="button"
        tabIndex={0}
        onClick={() => onChange(false)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onChange(false)
          }
        }}
      />
    </HStack>
  ) : (
    <AddGasButton
      key={provider}
      chain={chain}
      provider={provider}
      symbol={symbol}
      outputSymbol={outputSymbol}
      onAddGas={() => onChange(true)}
    />
  )
}

type AddGasButtonProps = {
  chain: Chain
  provider?: string
  symbol?: string
  outputSymbol?: string
  onAddGas: () => void
}

// Confirmation belongs to the current provider; changing it resets only this pending action.
const AddGasButton = ({ chain, provider, symbol, outputSymbol, onAddGas }: AddGasButtonProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const chainName = getChainName(chain)

  const handleAddGas = () => {
    if (provider && provider !== 'KyberCross') {
      setShowConfirmation(true)
      return
    }
    onAddGas()
  }

  const handleConfirm = () => {
    if (!showConfirmation) return
    setShowConfirmation(false)
    onAddGas()
  }

  return (
    <>
      <HStack className="w-fit">
        <MouseoverTooltip
          text={
            <Stack className="gap-2">
              <div>
                <Trans>
                  Sends a small amount of {symbol} to your wallet on {chainName}, so you can pay gas right after the
                  swap.
                </Trans>
              </div>
              <div>
                <Trans>Only KyberCross routes support Gas Drop. Turning it on shows KyberCross routes only.</Trans>
              </div>
              <div>
                <Trans>
                  Part of your output is used for gas, so the amount you receive in {outputSymbol} will be lower.
                </Trans>
              </div>
            </Stack>
          }
        >
          <button
            type="button"
            className="w-fit rounded-lg bg-primary-20 px-2 py-1 text-xs font-medium text-primary hover:bg-primary-30"
            onClick={handleAddGas}
          >
            <Trans>+ Gas</Trans>
          </button>
        </MouseoverTooltip>
      </HStack>
      {showConfirmation && provider && (
        <SwitchGasDropRouteModal
          provider={provider}
          onDismiss={() => setShowConfirmation(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}

const SwitchGasDropRouteModal = ({
  provider,
  onDismiss,
  onConfirm,
}: {
  provider: string
  onDismiss: () => void
  onConfirm: () => void
}) => (
  <Modal isOpen onDismiss={onDismiss} width="100%" maxWidth="456px">
    <Stack className="w-full gap-6 p-6">
      <HStack className="items-center justify-between">
        <span className="text-xl font-medium">
          <Trans>Switch Route</Trans>
        </span>
        <CloseIcon
          aria-label={t`Close`}
          role="button"
          tabIndex={0}
          onClick={onDismiss}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onDismiss()
            }
          }}
        />
      </HStack>
      <span className="text-sm leading-relaxed text-subText">
        <Trans>
          Gas Drop is only available on KyberCross. Your route will change from{' '}
          <span className="font-medium text-text">{provider}</span> to{' '}
          <span className="font-medium text-text">KyberCross</span>.
        </Trans>
      </span>
      <HStack className="gap-4">
        <ButtonOutlined onClick={onDismiss}>
          <Trans>Cancel</Trans>
        </ButtonOutlined>
        <ButtonPrimary onClick={onConfirm}>
          <Trans>Switch &amp; Add Gas</Trans>
        </ButtonPrimary>
      </HStack>
    </Stack>
  </Modal>
)
