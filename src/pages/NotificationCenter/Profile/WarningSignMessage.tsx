import KyberOauth2 from '@kybernetwork/oauth2'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Info } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { useSessionInfo, useSignedWalletInfo } from 'state/authen/hooks'
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
  const { signInEth } = useLogin()
  const { pendingAuthentication } = useSessionInfo()
  const { signedWallet } = useSignedWalletInfo()
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  if (
    pendingAuthentication ||
    KyberOauth2.getConnectedEthAccounts().includes(account?.toLowerCase() ?? '') ||
    account?.toLowerCase() === signedWallet?.toLowerCase()
  )
    return null
  return (
    <WarningWrapper>
      <Row style={{ gap: '12px' }}>
        <Info color={theme.subText} size={18} style={{ minWidth: '18px' }} />
        <Text fontSize={'12px'}>
          <Trans>
            You are not signed in with this wallet address. Click Sign-In to link your wallet to a profile. This will
            allow us to offer you a better experience. Read more <ExternalLink href="#">here ↗</ExternalLink>
          </Trans>
        </Text>
      </Row>
      <ButtonPrimary width={'110px'} height={'30px'} fontSize={'14px'} onClick={() => signInEth(account)}>
        <Trans>Sign-in</Trans>
      </ButtonPrimary>
    </WarningWrapper>
  )
}
export default WarningSignMessage
