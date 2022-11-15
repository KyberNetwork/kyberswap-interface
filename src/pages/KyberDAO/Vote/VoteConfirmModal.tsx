import { Text } from 'rebass'
import styled from 'styled-components'

import Modal from 'components/Modal'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

const Wrapper = styled.div`
  padding: 16px;
`
export default function VoteConfirmModal({ option }: { option?: string }) {
  const modalOpen = useModalOpen(ApplicationModal.KYBER_DAO_VOTE)
  const toggleModal = useToggleModal(ApplicationModal.KYBER_DAO_VOTE)
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal}>
      <Wrapper>
        <Text>
          You are voting for <b>{option}</b> on <b>KIP:20 KNC Ecosystem Fund Allocation</b> with your voing power
        </Text>
      </Wrapper>
    </Modal>
  )
}
