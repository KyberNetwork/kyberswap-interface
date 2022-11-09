import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

const Wrapper = styled(AutoColumn)`
  padding: 20px;
  gap: 20px;
`

const AddressWrapper = styled.div`
  font-size: 14px;
  line-height: 20px;
  border-radius: 12px;
  padding: 12px;
  ${({ theme }) => css`
    background-color: ${theme.buttonBlack};
    color: ${theme.subText};
  `}
`

export default function ApproveKNCModal({
  approvalState,
  approveCallback,
}: {
  approvalState: ApprovalState
  approveCallback: () => Promise<void>
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const modalOpen = useModalOpen(ApplicationModal.APPROVE_KNC)
  const toggleModal = useToggleModal(ApplicationModal.APPROVE_KNC)
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal}>
      <Wrapper>
        <Text fontSize={20}>
          <Trans>Approve Token</Trans>
        </Text>
        <Text lineHeight="24px" color={theme.subText}>
          <Trans>You need to grant permission to KyberDAO smart contract to interact with KNC in your wallet.</Trans>
        </Text>
        <AddressWrapper>
          <Trans>Your wallet address: {account}</Trans>
        </AddressWrapper>
        <RowBetween gap="20px">
          <ButtonOutlined onClick={toggleModal}>
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary onClick={approveCallback} disabled={approvalState === ApprovalState.PENDING}>
            {approvalState === ApprovalState.PENDING ? <Trans>Approving KNC</Trans> : <Trans>Approve</Trans>}
          </ButtonPrimary>
        </RowBetween>
      </Wrapper>
    </Modal>
  )
}
