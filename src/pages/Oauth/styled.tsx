import { ReactNode } from 'react'
import styled from 'styled-components'

import Loader from 'components/Loader'

import backgroundImage from './background-gradient.png'

export const Container = styled.div`
  flex: 1;
  justify-content: center;
  padding: 20px 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-image: url(${backgroundImage});
  background-size: 100%;
  background-repeat: repeat-y;
`

export const Content = styled.div`
  gap: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 16px;
  `};
`
export const TextDesc = styled.div`
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme }) => theme.subText};
  text-align: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 16px;
    line-height: 20px;
  `};
`

export const KyberLogo = () => {
  return <img src={'/logo-dark.svg'} alt="loading-icon" style={{ width: 230, maxWidth: '90vw' }} />
}

export function PageContainer({ msg }: { msg: ReactNode }) {
  return (
    <Container>
      <Content>
        <KyberLogo />
        <TextDesc style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Loader size="20px" /> {msg}
        </TextDesc>
      </Content>
    </Container>
  )
}
