import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback } from 'react'
import { X } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import WarningIcon from 'components/Icons/WarningIcon'
import Modal from 'components/Modal'
import { AutoRow, RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen, useModalOpenParams, useToggleModal } from 'state/application/hooks'

export const useSwitchToEthereum = () => {
  const { chainId } = useActiveWeb3React()
  const toggleSwitchEthereumModal = useToggleModal(ApplicationModal.SWITCH_TO_ETHEREUM)

  return {
    switchToEthereum: useCallback(
      (featureText: string) =>
        new Promise(async (resolve: any, reject: any) => {
          if ([ChainId.GÖRLI, ChainId.MAINNET].includes(chainId)) {
            resolve()
          } else {
            reject()
            toggleSwitchEthereumModal({ featureText })
          }
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
        <AutoColumn className="gap-5">
          <RowBetween>
            <AutoRow className="gap-0.5 text-primary">
              <WarningIcon size="28px" />
              <span className="text-xl">
                <Trans>Switch Network</Trans>
              </span>
            </AutoRow>
            <div role="button" onClick={closeModal} className="flex cursor-pointer">
              <X onClick={closeModal} size={20} className="text-subText" />
            </div>
          </RowBetween>
          <span className="text-sm leading-5">
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
        </AutoColumn>
      </div>
    </Modal>
  )
}
