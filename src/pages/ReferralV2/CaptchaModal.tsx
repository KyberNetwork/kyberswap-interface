import Modal from 'components/Modal'
import React from 'react'
import SliderCaptcha from 'components/SliderCaptcha'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { CloseIcon } from 'theme/components'
import { Trans } from '@lingui/macro'
const Wrapper = styled.div`
  padding: 24px;
  background-color: ${({ theme }) => theme.tableHeader};
`
const StyledModal = styled(Modal)`
  &[data-reach-dialog-content] {
    width: 100vw;
  }
`
export default function CaptchaModal({
  isOpen,
  onDismiss,
  onSuccess,
}: {
  isOpen: boolean
  onDismiss: () => void
  onSuccess: () => void
}) {
  return (
    <StyledModal isOpen={isOpen} onDismiss={onDismiss} maxWidth={'max-content'} mobileMode={false}>
      <Wrapper>
        <Flex width="100%" justifyContent={'space-between'} height="40px" fontSize="20px">
          <Text>
            <Trans>Security Verification</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </Flex>
        <SliderCaptcha onSuccess={onSuccess} onDismiss={onDismiss} />
      </Wrapper>
    </StyledModal>
  )
}
