import { Trans } from '@lingui/macro'
import { useCallback } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useKyberDaoStakeActions } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

import { useSwitchToEthereum } from './SwitchToEthereumModal'

const Wrapper = styled.div`
  padding: 24px;
`
const AddressWrapper = styled.input`
  border-radius: 20px;
  border: none;
  outline: none;
  padding: 10px 12px;
  font-size: 14px;
  ${({ theme }) => css`
    background-color: ${theme.buttonBlack};
    color: ${theme.subText};
  `}
`
export default function DelegateConfirmModal() {
  const theme = useTheme()
  const modalOpen = useModalOpen(ApplicationModal.DELEGATE_CONFIRM)
  const toggleModal = useToggleModal(ApplicationModal.DELEGATE_CONFIRM)
  const { switchToEthereum } = useSwitchToEthereum()
  // const {delegate } = useKyberDaoStakeActions()

  const handleDelegateConfirm = useCallback(() => {
    switchToEthereum().then(() => {
      console.log(1)
    })
  }, [switchToEthereum])
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} minHeight={false} maxHeight={90} maxWidth={500}>
      <Wrapper>
        <AutoColumn gap="20px">
          <RowBetween>
            <Text fontSize={20}>
              <Trans>Delegate</Trans>
            </Text>
            <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleModal}>
              <X onClick={toggleModal} size={20} color={theme.subText} />
            </Flex>
          </RowBetween>
          <Text fontSize={14} lineHeight="20px">
            <Trans>
              You are delegating your voting power to this address. Your staked balance will remain the same. The
              delegated address will be responsible for the transaction fee
            </Trans>
          </Text>
          <AddressWrapper value="0x3aF230646b55eCAD9Ab95bFf6FA1b0FEA0Cfc873" />
          <RowBetween gap="24px">
            <ButtonOutlined>
              <Text fontSize={14} lineHeight="20px">
                <Trans>Cancel</Trans>
              </Text>
            </ButtonOutlined>
            <ButtonPrimary onClick={handleDelegateConfirm}>
              <Text fontSize={14} lineHeight="20px">
                <Trans>Confirm</Trans>
              </Text>
            </ButtonPrimary>
          </RowBetween>
        </AutoColumn>
      </Wrapper>
    </Modal>
  )
}
