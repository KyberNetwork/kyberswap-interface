import { Trans, t } from '@lingui/macro'
import { RouteComponentProps } from 'react-router-dom'
import { Flex } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { PageWrapper } from 'components/swapv2/styleds'

import BridgeHistory from './BridgeTransfers'
import Disclaimer from './Disclaimer'
import SwapForm from './SwapForm'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`
const Content = styled.div`
  display: flex;
  justify-content: center;
  gap: 48px;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 24px;
    flex-direction: column;
  `}
`
const Title = styled.h1`
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
  font-size: 20px;
  margin: 0;
`
export default function Bridge({ history }: RouteComponentProps) {
  return (
    <PageWrapper>
      <Disclaimer />
      <Content>
        <Container>
          <Flex>
            <Title>
              <Trans>Bridge</Trans>
            </Title>
            <InfoHelper size={15} text={t`Easily transfer tokens from one chain to another`} />
          </Flex>
          <SwapForm />
        </Container>
        <BridgeHistory />
      </Content>
    </PageWrapper>
  )
}
