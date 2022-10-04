import { RouteComponentProps } from 'react-router-dom'

import { Container, PageWrapper } from 'components/swapv2/styleds'

import BridgeHistory from './BridgeHistory'
import SwapForm from './SwapForm'

export default function Bridge({ history }: RouteComponentProps) {
  return (
    <PageWrapper>
      <Container>
        <SwapForm />
        <BridgeHistory />
      </Container>
    </PageWrapper>
  )
}
