import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback } from 'react'

import { ButtonPrimary } from 'components/Button'
import WarningIcon from 'components/Icons/WarningIcon'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { KyberDAOModalCloseButton } from 'pages/KyberDAO/common'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen, useModalOpenParams, useToggleModal } from 'state/application/hooks'

export const useSwitchToEthereum = () => {
  const { chainId } = useActiveWeb3React()
  const toggleSwitchEthereumModal = useToggleModal(ApplicationModal.SWITCH_TO_ETHEREUM)

  return {
    switchToEthereum: useCallback(
      (featureText: string) =>
        new Promise<void>((resolve, reject) => {
          if ([ChainId.GÖRLI, ChainId.MAINNET].includes(chainId)) {
            resolve()
            return
          }

          toggleSwitchEthereumModal({ featureText })
          reject()
        }),
      [chainId, toggleSwitchEthereumModal],
    ),
  }
}

export default function SwitchToEthereumModal() {
  const { chainId } = useActiveWeb3React()
  const modalOpen = useModalOpen(ApplicationModal.SWITCH_TO_ETHEREUM)
  const closeModal = useCloseModal(ApplicationModal.SWITCH_TO_ETHEREUM)
  const params = useModalOpenParams(ApplicationModal.SWITCH_TO_ETHEREUM)
  const { changeNetwork } = useChangeNetwork()

  const handleChangeToEthereum = useCallback(async () => {
    if (![ChainId.GÖRLI, ChainId.MAINNET].includes(chainId)) {
      await changeNetwork(ChainId.MAINNET)
      closeModal()
    }
  }, [changeNetwork, closeModal, chainId])
  return (
    <Modal isOpen={modalOpen} onDismiss={closeModal} minHeight={false} maxHeight={90} maxWidth={500}>
      <div className="p-6">
        <Stack className="gap-4">
          <HStack className="items-center justify-between gap-4">
            <HStack className="items-center gap-2 text-primary">
              <WarningIcon size="28px" />
              <span className="text-xl">
                <Trans>Switch Network</Trans>
              </span>
            </HStack>
            <KyberDAOModalCloseButton onClick={closeModal} />
          </HStack>
          <span className="text-sm">
            <Trans>
              {params?.featureText || t`This action`} is only available on Ethereum chain. Please switch network to
              continue.
            </Trans>
          </span>
          <ButtonPrimary onClick={handleChangeToEthereum}>
            <span className="text-base">
              <Trans>Switch to Ethereum Network</Trans>
            </span>
          </ButtonPrimary>
        </Stack>
      </div>
    </Modal>
  )
}
