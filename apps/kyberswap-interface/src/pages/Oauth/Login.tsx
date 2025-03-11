import KyberOauth2, { LoginFlow, LoginMethod } from '@kyberswap/oauth2'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'

import Loader from 'components/Loader'
import { didUserReject } from 'constants/connectors/utils'
import { ENV_KEY } from 'constants/env'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { initializeOauthKyberSwap } from 'hooks/useLogin'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { Container, Content, KyberLogo, TextDesc } from 'pages/Oauth/styled'
import getShortenAddress from 'utils/getShortenAddress'
import { queryStringToObject } from 'utils/string'
import { formatSignature } from 'utils/transaction'

import AuthForm from './AuthForm'
import { canAutoSignInEth, createSignMessage, extractAutoLoginMethod, getSupportLoginMethods } from './helpers'

export const getIamErrorMsg = (error: any) => {
  const data = error?.response?.data
  const isExpired = data?.error?.id === 'self_service_flow_expired'
  if (isExpired) return t`Time to sign-in is Expired, please go back and try again.`

  const message = data?.ui?.messages?.[0]
  if (message?.id === 4000001) return t`Verification code is wrong or expired. Please try again.`
  return message?.text || data?.error?.reason || data?.error?.message || error?.message || error + ''
}

export type FlowStatus = {
  processingSignIn: boolean
  flowReady: boolean
  csrf: string
  autoLoginMethod: LoginMethod | undefined // not waiting for click btn
}

const getCsrfToken = (loginFlow: LoginFlow | undefined) =>
  loginFlow?.ui?.nodes?.find(e => e.attributes.name === 'csrf_token')?.attributes?.value ?? ''

export function Login() {
  const { account, chainId } = useActiveWeb3React()
  const { library: provider } = useWeb3React()

  const [authFormConfig, setAuthFormConfig] = useState<LoginFlow>()
  const [error, setError] = useState('')
  const [flowStatus, setFlowStatus] = useState<FlowStatus>({
    flowReady: false,
    autoLoginMethod: undefined,
    processingSignIn: false,
    csrf: '',
  })

  const { wallet_address } = useParsedQueryString<{ wallet_address: string }>()

  const loginMethods = getSupportLoginMethods(authFormConfig)
  const showMsgSignInEth = account && canAutoSignInEth(loginMethods)
  const isMismatchEthAddress =
    showMsgSignInEth && wallet_address && wallet_address?.toLowerCase() !== account?.toLowerCase()

  const connectingWallet = useRef(false)

  const signInWithEth = useCallback(async () => {
    try {
      const siweConfig = authFormConfig?.oauth_client?.metadata?.siwe_config
      if (isMismatchEthAddress || !siweConfig || connectingWallet.current || !provider || !account || !chainId) {
        return
      }
      setFlowStatus(v => ({ ...v, processingSignIn: true }))
      const { challenge, issued_at } = authFormConfig
      connectingWallet.current = true
      const message = createSignMessage({
        address: account,
        chainId,
        nonce: challenge,
        issuedAt: issued_at,
        ...siweConfig,
      })

      const signature = await provider.getSigner().signMessage(message)
      const resp = await KyberOauth2.oauthUi.loginEthereum({
        address: account,
        signature: formatSignature(signature),
        csrf: getCsrfToken(authFormConfig),
        chainId,
      })

      if (resp) {
        connectingWallet.current = false
        setFlowStatus(v => ({ ...v, processingSignIn: false }))
      }
    } catch (error: any) {
      if (!didUserReject(error)) {
        setError(getIamErrorMsg(error))
      }
      console.error('signInWithEthereum err', error)
      connectingWallet.current = false
      setFlowStatus(v => ({ ...v, processingSignIn: false }))
    }
  }, [account, provider, authFormConfig, chainId, isMismatchEthAddress])

  useEffect(() => {
    const getFlowLogin = async () => {
      try {
        KyberOauth2.initialize({ mode: ENV_KEY })
        const loginFlow = await KyberOauth2.oauthUi.getFlowLogin()
        if (!loginFlow) return
        setAuthFormConfig(loginFlow)

        const { client_id } = loginFlow.oauth_client
        KyberOauth2.initialize({ clientId: client_id, mode: ENV_KEY })

        setFlowStatus(v => ({
          ...v,
          flowReady: true,
          autoLoginMethod: extractAutoLoginMethod(loginFlow),
          csrf: getCsrfToken(loginFlow),
        }))
      } catch (error: any) {
        const { error_description } = queryStringToObject(window.location.search)
        setError(error_description || getIamErrorMsg(error))
      }
    }
    getFlowLogin()
  }, [])

  useEffect(() => {
    // user click to others page of kyberswap => reset config
    return () => initializeOauthKyberSwap()
  }, [])

  const appName = authFormConfig?.oauth_client?.client_name || authFormConfig?.oauth_client?.client_id

  const renderEthMsg = () =>
    isMismatchEthAddress ? (
      <TextDesc>
        Your address is mismatched. The expected address is {getShortenAddress(wallet_address)}, but the address
        provided is {getShortenAddress(account)}. Please change your wallet address accordingly.
      </TextDesc>
    ) : (
      account && (
        <TextDesc>
          To get started, please sign-in to verify your ownership of this wallet address {getShortenAddress(account)}
        </TextDesc>
      )
    )

  return (
    <Container>
      <Content>
        <KyberLogo />
        {error ? (
          <TextDesc>{error}</TextDesc>
        ) : flowStatus.autoLoginMethod === LoginMethod.GOOGLE ? (
          <TextDesc style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Loader size="20px" /> Checking data ...
          </TextDesc>
        ) : showMsgSignInEth ? (
          renderEthMsg()
        ) : (
          appName && <TextDesc>Please sign in to continue with {appName}</TextDesc>
        )}
        <AuthForm
          formConfig={authFormConfig}
          flowStatus={flowStatus}
          signInWithEth={signInWithEth}
          disableEth={!!isMismatchEthAddress}
        />
      </Content>
    </Container>
  )
}

export default Login
