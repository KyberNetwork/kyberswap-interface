import { Trans } from '@lingui/macro'
import React from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import WarningIcon from 'components/Icons/WarningIcon'
import Modal from 'components/Modal'
import { AutoRow, RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

const Wrapper = styled.div`
  padding: 24px;
`
export default function SwitchToEthereumModal() {
  const theme = useTheme()
  const modalOpen = useModalOpen(ApplicationModal.SWITCH_TO_ETHEREUM)
  const toggleModal = useToggleModal(ApplicationModal.SWITCH_TO_ETHEREUM)
  const handleChangeToEthereum = () => {
    console.log('change')
  }
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} minHeight={false} maxHeight={90} maxWidth={500}>
      <Wrapper>
        <AutoColumn gap="20px">
          <RowBetween>
            <AutoRow gap="4px" color={theme.primary}>
              <WarningIcon size="28px" />
              <Text fontSize={20}>
                <Trans>Switch Network</Trans>
              </Text>
            </AutoRow>
            <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleModal}>
              <X onClick={toggleModal} size={20} color={theme.subText} />
            </Flex>
          </RowBetween>
          <Text fontSize={14} lineHeight="20px">
            <Trans>Staking KNC is only available on Ethereum chain. Please switch network to continue.</Trans>
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
