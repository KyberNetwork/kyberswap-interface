import { rgba } from 'polished'
import { Info } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Row from 'components/Row'
import { useSignInETH } from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { useSessionInfo } from 'state/authen/hooks'
import { ExternalLink } from 'theme'

const WarningWrapper = styled.div`
  border-radius: 24px;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 14px;
`
const WarningSignMessage = () => {
  const { signInEth } = useSignInETH()
  const { pendingAuthentication } = useSessionInfo()
  const theme = useTheme()
  if (pendingAuthentication) return null
  return (
    <WarningWrapper>
      <Row style={{ gap: '12px' }}>
        <Info color={theme.subText} size={40} />
        <Text fontSize={'12px'}>
          You are not signed in with this wallet address. Click Sign-In to link your wallet to a profile. This will
          allow us to offer you a better experience. Read more <ExternalLink href="#">here ↗</ExternalLink>
        </Text>
      </Row>
      <ButtonPrimary width={'130px'} height={'36px'} fontSize={'14px'} onClick={signInEth}>
        Sign-in
      </ButtonPrimary>
    </WarningWrapper>
  )
}
export default WarningSignMessage
