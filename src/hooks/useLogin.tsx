import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { useCallback, useEffect, useRef } from 'react'
import { useConnectWalletToProfileMutation, useGetOrCreateProfileQuery } from 'services/identity'

import { ENV_KEY, OAUTH_CLIENT_ID } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { useIsConnectedWallet } from 'hooks/useSyncNetworkParamWithStore'
import { updateProcessingLogin, updateProfile } from 'state/authen/actions'
import { useSessionInfo } from 'state/authen/hooks'
import { UserProfile } from 'state/authen/reducer'
import { useAppDispatch } from 'state/hooks'

KyberOauth2.initialize({
  clientId: OAUTH_CLIENT_ID,
  redirectUri: `${window.location.protocol}//${window.location.host}${'/kyberai'}`, // todo
  mode: ENV_KEY,
})

/**
 * this hook should be call at 1 place
 * @returns
 */
const useLogin = () => {
  const { account } = useActiveWeb3React()
  const isConnectedWallet = useIsConnectedWallet()
  const dispatch = useAppDispatch()

  const requestingSession = useRef<string>() // which wallet/mode requesting
  const [{ anonymousUserInfo, isLogin }, saveSession] = useSessionInfo()

  const setLoading = useCallback(
    (value: boolean) => {
      dispatch(updateProcessingLogin(value))
    },
    [dispatch],
  )

  const setProfile = useCallback(
    (value: UserProfile) => {
      dispatch(updateProfile(value))
    },
    [dispatch],
  )

  const signInAnonymous = useCallback(async () => {
    if (anonymousUserInfo || requestingSession.current === LoginMethod.ANONYMOUS) return
    try {
      requestingSession.current = LoginMethod.ANONYMOUS
      saveSession({ loginMethod: LoginMethod.ETH, userInfo: undefined }) // reset
      const session = await KyberOauth2.loginAnonymous()
      saveSession(session)
    } catch (error) {
      console.log('sign in anonymous err', error)
      saveSession({ loginMethod: LoginMethod.ANONYMOUS, userInfo: undefined })
    } finally {
      setLoading(false)
    }
  }, [anonymousUserInfo, saveSession, setLoading])

  const signIn = useCallback(
    async (walletAddress: string | undefined) => {
      try {
        if (!walletAddress) {
          throw new Error('Not found address.')
        }
        if (requestingSession.current !== walletAddress) {
          requestingSession.current = walletAddress
          const session = await KyberOauth2.getSession({ method: LoginMethod.ETH, walletAddress })
          saveSession(session)
          setLoading(false)
        }
      } catch (error) {
        console.log('get session:', error.message)
        signInAnonymous()
      }
    },
    [saveSession, setLoading, signInAnonymous],
  )

  useEffect(() => {
    isConnectedWallet().then(wallet => {
      console.log('checking', wallet, account)
      if (wallet === null) return // pending
      signIn(typeof wallet === 'string' ? wallet : undefined)
    })
  }, [account, signIn, isConnectedWallet])

  const { data: profileInfo } = useGetOrCreateProfileQuery({ referralProgramId: 1 }, { skip: !isLogin })
  const [connectWalletToProfile] = useConnectWalletToProfileMutation()

  console.log({ profileInfo })

  useEffect(() => {
    if (profileInfo && account) {
      // if(profileInfo not contain acc )connectWalletToProfile({account})
      // else save profile setProfile(profileInfo)
    }
  }, [profileInfo, account, connectWalletToProfile, setProfile])
}
export default useLogin
