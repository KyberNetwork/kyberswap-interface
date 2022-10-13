import { Trans } from '@lingui/macro'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { PageWrapper } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'

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
  const theme = useTheme()
  return (
    <PageWrapper>
      <Disclaimer />
      <Content>
        <Container>
          <div>
            <Title>
              <Trans>Bridge</Trans>
            </Title>
            <Text fontSize={12} color={theme.subText} marginTop={'8px'}>
              <Trans>Easily transfer tokens from one chain to another</Trans>
            </Text>
          </div>
          <SwapForm />
        </Container>
        <BridgeHistory />
      </Content>
    </PageWrapper>
  )
}
