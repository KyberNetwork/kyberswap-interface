import KyberOauth2 from '@kybernetwork/oauth2'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import LocalLoader from 'components/LocalLoader'
import Row from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { shortString } from 'utils/string'

const SignIn = () => {
  const [{ isLogin, userInfo, anonymousUserInfo, processing }] = useSessionInfo()
  const { account } = useActiveWeb3React()
  const navigate = useNavigate()
  if (processing) return <LocalLoader />
  return (
    <Flex
      justifyContent={'center'}
      style={{ gap: '10px', maxWidth: '100vw' }}
      alignItems="center"
      flexDirection="column"
      width="100%"
      margin={'20px'}
    >
      This is fake kyber ai landing page.
      {isLogin ? (
        <>
          <Text textAlign={'center'}>Your already logged in with wallet: {userInfo?.wallet_address}</Text>
          <Row gap="10px" justify="center">
            <ButtonPrimary width="100px" height="30px" onClick={() => KyberOauth2.logout()}>
              Sign out
            </ButtonPrimary>
            <ButtonPrimary width="120px" height="30px" onClick={() => navigate(APP_PATHS.KYBERAI_RANKINGS)}>
              Try KyberAI
            </ButtonPrimary>
          </Row>
        </>
      ) : (
        <>
          <Text>
            Anonymous user: {shortString(anonymousUserInfo?.username ?? '', 20)}. If you want to try kyber AI, please
            connect wallet and sign in
          </Text>
          {account && (
            <ButtonPrimary width="100px" height="30px" onClick={() => KyberOauth2.authenticate()}>
              Sign in
            </ButtonPrimary>
          )}
        </>
      )}
    </Flex>
  )
}
export default SignIn
