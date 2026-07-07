import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { X } from 'react-feather'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import { HStack } from 'components/Stack'
import { NETWORKS_INFO } from 'constants/networks'

type SwitchChainModalProps = {
  /** The token the user picked that lives on a different chain than the connected one. */
  token: Currency | null
  onDismiss: () => void
  onConfirm: () => void
}

export const SwitchChainModal = ({ token, onDismiss, onConfirm }: SwitchChainModalProps) => {
  const network = token ? NETWORKS_INFO[token.chainId] : undefined

  return (
    <Modal isOpen={!!token} onDismiss={onDismiss} width="100%" maxWidth="420px">
      {token && network && (
        <div className="flex w-full flex-col gap-6 p-6">
          <HStack className="items-center justify-between">
            <span className="text-lg font-medium">
              <Trans>Switch Chain</Trans>
            </span>
            <X role="button" className="cursor-pointer text-text" onClick={onDismiss} />
          </HStack>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-base text-text">
            <Trans>Switch to</Trans>
            <HStack className="items-center gap-1 rounded-full bg-white-08 px-2 py-1">
              <img src={network.icon} alt={network.name} className="size-5 rounded-full" />
              <span className="font-medium">{network.name}</span>
            </HStack>
            <Trans>to swap</Trans>
            <HStack className="items-center gap-1.5">
              <HStack className="items-center gap-1 rounded-full bg-white-08 px-2 py-1">
                <CurrencyLogo currency={token} size="20px" />
                <span className="font-medium">{token.symbol}</span>
              </HStack>
              <span>?</span>
            </HStack>
          </div>

          <HStack className="justify-between gap-4">
            <ButtonOutlined onClick={onDismiss} data-testid="switch-chain-cancel">
              <Trans>Cancel</Trans>
            </ButtonOutlined>
            <ButtonPrimary onClick={onConfirm} data-testid="switch-chain-confirm">
              <Trans>Switch Chain</Trans>
            </ButtonPrimary>
          </HStack>
        </div>
      )}
    </Modal>
  )
}
