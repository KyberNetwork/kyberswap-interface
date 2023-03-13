import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import styled from 'styled-components'

import MailIcon from 'components/Icons/MailIcon'
import CreateAlert from 'pages/NotificationCenter/CreateAlert'

const PageWrapper = styled.div`
  padding: 32px 50px;
  width: 100%;
  max-width: 1300px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
  `}
`
const Wrapper = styled.div`
  display: flex;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 24px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    border: none;
  `}
`

const Title = styled.h2`
  margin-left: 12px;
  font-size: 24px;
  font-weight: 500;
`

const LeftColumn = styled.div`
  background-color: ${({ theme }) => theme.tabActive};
  border-radius: 24px 0px 0px 24px;
  width: 280px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`
const RightColumn = styled.div`
  background-color: ${({ theme }) => theme.background};
  flex: 1;
  border-radius: 0px 24px 24px 0px;
  padding: 24px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 24px 0px;
    border-radius: 0px;
  `}
`

function NotificationCenter() {
  return (
    <PageWrapper>
      <Flex alignItems="center">
        <MailIcon />
        <Title>
          <Trans>Notification Center</Trans>
        </Title>
      </Flex>
      <Wrapper>
        <LeftColumn></LeftColumn>
        <RightColumn>
          <CreateAlert />
        </RightColumn>
      </Wrapper>
    </PageWrapper>
  )
}

export default NotificationCenter
