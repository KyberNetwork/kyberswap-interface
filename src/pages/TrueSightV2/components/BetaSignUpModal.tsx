import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import React from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Divider from 'components/Divider'
import Icon from 'components/Icons/Icon'
import Modal from 'components/Modal'
import Row from 'components/Row'

const Wrapper = styled(Row)`
  position: relative;
  width: 800px;
  height: 504px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
`

const ContentWrapper = styled(Column)`
  flex: 1;
  padding: 20px;
`
const AnimateBackground = styled(Column)`
  flex: 1;
`

const BetaTag = styled.span`
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  padding: 3px 4px;
  color: ${({ theme }) => theme.subText};
`

const BetaSignUpModal = () => {
  return (
    <Modal isOpen={true}>
      <Wrapper>
        <ContentWrapper>
          <Text>
            <Trans>
              Welcome to <Icon id="truesight-v2" /> KyberAI <BetaTag>beta</BetaTag>
            </Trans>
          </Text>
          <Text>
            <Trans>
              KyberAI is a powerful trading tool that leverages machine learning algorithms and on-chain / off-chain
              data to provide users with valuable insights into a tokens performance.
            </Trans>
          </Text>
          <Text>
            <Trans>
              Whether you&apos;re looking to identify tokens to trade, or spot alpha on a specific token, KyberAI has it
              all! You can use KyberAI to make more informed trading decisions i.e. ape smart.
            </Trans>
          </Text>
          <Divider />
          <Text>
            We&apos;re launching our KyberAI Beta early access program! For now, only a select group of people have
            access to KyberAI so we can collect feedback and monitor performance. Please input your email address in the
            field below and follow the instruction
          </Text>
          <ButtonPrimary>
            <Trans>Verify</Trans>
          </ButtonPrimary>
        </ContentWrapper>
        <AnimateBackground></AnimateBackground>
      </Wrapper>
    </Modal>
  )
}

export default React.memo(BetaSignUpModal)
