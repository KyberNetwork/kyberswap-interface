import { Trans, t } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

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
export default function DelegateConfirmModal({
  address,
  delegatedAccount,
  onAddressChange,
  delegateCallback,
}: {
  address: string
  delegatedAccount?: string
  onAddressChange: (address: string) => void
  delegateCallback: () => void
}) {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const isDelegated = !!delegatedAccount && delegatedAccount !== account
  const modalOpen = useModalOpen(ApplicationModal.DELEGATE_CONFIRM)
  const toggleModal = useToggleModal(ApplicationModal.DELEGATE_CONFIRM)

  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} minHeight={false} maxHeight={90} maxWidth={500}>
      <Wrapper>
        <AutoColumn gap="20px">
          <RowBetween>
            <Text fontSize={20}>{isDelegated ? <Trans>Undelegate</Trans> : <Trans>Delegate</Trans>}</Text>
            <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleModal}>
              <X onClick={toggleModal} size={20} color={theme.subText} />
            </Flex>
          </RowBetween>
          <Text fontSize={16} lineHeight="24px" color={theme.subText}>
            {isDelegated ? (
              <Trans>You are undelegating your voting power from this address</Trans>
            ) : (
              <Trans>
                You are delegating your voting power to this address. Your staked balance will remain the same. The
                delegated address will be responsible for the transaction fee
              </Trans>
            )}
          </Text>
          <AddressWrapper
            placeholder={t`Ethereum Address`}
            value={isDelegated ? delegatedAccount : address}
            onChange={e => onAddressChange(e.target.value)}
            disabled
          />
          <RowBetween gap="24px">
            <ButtonOutlined onClick={toggleModal}>
              <Text fontSize={14} lineHeight="20px">
                <Trans>Cancel</Trans>
              </Text>
            </ButtonOutlined>
            <ButtonPrimary onClick={delegateCallback}>
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
