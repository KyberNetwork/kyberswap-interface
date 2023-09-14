import styled from 'styled-components'

import backgroundImage from 'assets/images/truesight-v2/landing-page/background-gradient.png'
import Loader from 'components/Loader'
import { useIsDarkMode } from 'state/user/hooks'

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

export const Col = styled.div`
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
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 16px;
    line-height: 20px;
  `};
`

export const KyberLogo = () => {
  const iseDark = useIsDarkMode()
  return (
    <img src={iseDark ? '/logo-dark.svg' : '/logo.svg'} alt="loading-icon" style={{ width: 230, maxWidth: '90vw' }} />
  )
}

export function PageContainer({ msg }: { msg: string }) {
  return (
    <Container>
      <Col>
        <KyberLogo />
        <TextDesc style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Loader size="20px" /> {msg}
        </TextDesc>
      </Col>
    </Container>
  )
}
