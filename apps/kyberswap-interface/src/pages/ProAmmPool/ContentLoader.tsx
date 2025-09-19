import { rgba } from 'polished'
import { Flex } from 'rebass'
import styled, { keyframes } from 'styled-components'

import Divider from 'components/Divider'

const shine = keyframes`
  to {
    background-position-x: -200%;
  }
`

const StyledPositionCard = styled.div`
  border: none;
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 28px 20px 16px;
  display: flex;
  gap: 1rem;
  flex-direction: column;
`

export const Loading = styled.div`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.buttonGray} 8%,
    ${({ theme }) => rgba(theme.buttonGray, 0.6)} 18%,
    ${({ theme }) => theme.buttonGray} 33%
  );
  border-radius: 20px;
  background-size: 200% 100%;
  animation: ${shine} 1.5s linear infinite;
`

const Title = styled(Loading)`
  height: 41px;
`

const Tab = styled(Loading)`
  height: 28px;
  border-radius: 999px;
`

function ContentLoader() {
  return (
    <StyledPositionCard>
      <Title />
      <Tab />
      <Loading style={{ height: '185px' }} />
      <Loading style={{ height: '160px' }} />

      <Flex>
        <Loading style={{ height: '36px', flex: 1, borderRadius: '999px' }} />
        <Loading style={{ height: '36px', flex: 1, marginLeft: '1rem', borderRadius: '999px' }} />
      </Flex>

      <Divider />

      <Loading style={{ height: '15px', width: '80px', borderRadius: '999px' }} />
    </StyledPositionCard>
  )
}

export default ContentLoader
