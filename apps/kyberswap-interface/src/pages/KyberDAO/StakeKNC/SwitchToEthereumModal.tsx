import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import WarningIcon from 'components/Icons/WarningIcon'
import Modal from 'components/Modal'
import { AutoRow, RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen, useModalOpenParams, useToggleModal } from 'state/application/hooks'

const Wrapper = styled.div`
  padding: 24px;
`

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

  const theme = useTheme()
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
      <Wrapper>
        <AutoColumn gap="20px">
          <RowBetween>
            <AutoRow gap="2px" color={theme.primary}>
              <WarningIcon size="28px" />
              <Text fontSize={20}>
                <Trans>Switch Network</Trans>
              </Text>
            </AutoRow>
            <Flex sx={{ cursor: 'pointer' }} role="button" onClick={closeModal}>
              <X onClick={closeModal} size={20} color={theme.subText} />
            </Flex>
          </RowBetween>
          <Text fontSize={14} lineHeight="20px">
            <Trans>
              {params?.featureText || t`This action`} is only available on Ethereum chain. Please switch network to
              continue.
            </Trans>
          </Text>
          <ButtonPrimary onClick={handleChangeToEthereum}>
            <Text fontSize={16}>
              <Trans>Switch to Ethereum Network</Trans>
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </Wrapper>
    </Modal>
  )
}
