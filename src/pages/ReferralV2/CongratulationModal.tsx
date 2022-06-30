import Modal from 'components/Modal'
import React from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { CloseIcon } from 'theme/components'
import { Trans } from '@lingui/macro'
import kncReward1 from 'assets/images/knc-reward1.png'
import kncReward2 from 'assets/images/knc-reward2.png'
import KNClogo from 'assets/images/KNC-logo.png'
import { ButtonPrimary } from 'components/Button'
const Wrapper = styled.div`
  padding: 24px;
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  img {
    max-width: 100%;
    height: auto;
  }
`

export default function CongratulationModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} width="422px">
      <Wrapper>
        <Flex width="100%" justifyContent="space-between" height="40px" fontSize="20px">
          <Text>
            <Trans>Congratulation!</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </Flex>
        <Flex flexDirection="column" alignItems="center">
          <img src={kncReward1} />
          <img src={kncReward2} />
        </Flex>
        <Flex alignItems="center" paddingTop="20px" paddingBottom="20px">
          <Trans>
            You had earned <img src={KNClogo} style={{ margin: '0 6px' }} /> 1 KNC
          </Trans>
        </Flex>
        <ButtonPrimary onClick={onDismiss}>Confirm</ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}
