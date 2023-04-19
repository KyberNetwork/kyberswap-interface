import KyberOauth2 from '@kybernetwork/oauth2'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSessionInfo } from 'state/authen/hooks'
import { shortString } from 'utils/string'

const SignIn = () => {
  useLogin() // move this to kyber ai page
  const [{ isLogin, userInfo, anonymousUserInfo }] = useSessionInfo()
  const { account } = useActiveWeb3React()

  const qs = useParsedQueryString()
  if (!qs.showInfo) return null
  return (
    <Flex
      justifyContent={'center'}
      style={{ gap: '10px' }}
      alignItems="center"
      flexDirection="column"
      width="100%"
      margin={'20px'}
    >
      This is fake kyber api page.
      {isLogin ? (
        <>
          <Text>Your already logged in with wallet: {userInfo?.wallet_address}</Text>
          <ButtonPrimary width="100px" height="30px" onClick={() => KyberOauth2.logout()}>
            Sign out
          </ButtonPrimary>
        </>
      ) : (
        <>
          <Text>Anonymous user: {shortString(anonymousUserInfo?.username ?? '', 20)}</Text>
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
