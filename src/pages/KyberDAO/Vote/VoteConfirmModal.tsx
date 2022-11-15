import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { AutoRow, RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

const Wrapper = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`
const TextWrapper = styled(Text)`
  & b {
    font-weight: 500;
    color: ${({ theme }) => theme.text};
  }
`
export default function VoteConfirmModal({ option }: { option?: string }) {
  const theme = useTheme()
  const modalOpen = useModalOpen(ApplicationModal.KYBER_DAO_VOTE)
  const toggleModal = useToggleModal(ApplicationModal.KYBER_DAO_VOTE)
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal}>
      <Wrapper>
        <RowBetween>
          <AutoRow gap="2px">
            <Text fontSize={20}>
              <Trans>Vote</Trans>
            </Text>
          </AutoRow>
          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleModal}>
            <X onClick={toggleModal} size={20} color={theme.subText} />
          </Flex>
        </RowBetween>
        <TextWrapper fontSize={16} lineHeight="24px" color={theme.subText}>
          You are voting for <b>{option}</b> on <b>KIP:20 KNC Ecosystem Fund Allocation</b> with your voing power
        </TextWrapper>
        <ButtonPrimary>Vote</ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}
