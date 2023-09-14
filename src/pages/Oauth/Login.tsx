import KyberOauth2, { LoginFlow, LoginMethod } from '@kybernetwork/oauth2'
import { useCallback, useEffect, useRef, useState } from 'react'

import Loader from 'components/Loader'
import { didUserReject } from 'constants/connectors/utils'
import { ENV_KEY } from 'constants/env'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { Col, Container, KyberLogo, TextDesc } from 'pages/Oauth/styled'
import getShortenAddress from 'utils/getShortenAddress'
import { queryStringToObject } from 'utils/string'
import { formatSignature } from 'utils/transaction'

import AuthForm from './components/AuthForm'
import { BUTTON_IDS } from './constants/index'
import { createSignMessage, getSupportLoginMethods } from './utils'

const getErrorMsg = (error: any) => {
  const data = error?.response?.data
  const isExpired = data?.error?.id === 'self_service_flow_expired'
  if (isExpired)
    return (
      <span>
        Time to sign-in is Expired, please{' '}
        <a href={queryStringToObject(window.location.search)?.back_uri + ''}>go back</a> and try again.
      </span>
    )
  return data?.ui?.messages?.[0]?.text || data?.error?.reason || data?.error?.message || error?.message || error + ''
}

function Login() {
  const { account: address, chainId } = useActiveWeb3React()
  const { library: provider } = useWeb3React()

  const [processingSignEth, setProcessingSign] = useState(false)
  const [authFormConfig, setAuthFormConfig] = useState<LoginFlow>()
  const [error, setError] = useState('')
  const [autoLogin, setAutoLogin] = useState(false) // not waiting for click btn

  const { wallet_address } = useParsedQueryString<{ wallet_address: string }>()

  const loginMethods = getSupportLoginMethods(authFormConfig)
  const isSignInEth = loginMethods.includes(LoginMethod.ETH)
  const isMismatchEthAddress =
    !loginMethods.includes(LoginMethod.GOOGLE) &&
    isSignInEth &&
    wallet_address &&
    address &&
    wallet_address?.toLowerCase() !== address?.toLowerCase()

  const connectingWallet = useRef(false)

  const signInWithEth = useCallback(async () => {
    try {
      const siweConfig = authFormConfig?.oauth_client?.metadata?.siwe_config
      if (isMismatchEthAddress || !siweConfig || connectingWallet.current || !provider || !address || !chainId) {
        return
      }
      setProcessingSign(true)
      const { ui, challenge, issued_at } = authFormConfig
      connectingWallet.current = true
      const csrf = ui.nodes.find(e => e.attributes.name === 'csrf_token')?.attributes?.value ?? ''
      const message = createSignMessage({
        address,
        chainId,
        nonce: challenge,
        issuedAt: issued_at,
        ...siweConfig,
      })

      const signature = await provider.getSigner().signMessage(message)
      const resp = await KyberOauth2.oauthUi.loginEthereum({
        address,
        signature: formatSignature(signature),
        csrf,
        chainId,
      })

      if (resp) {
        connectingWallet.current = false
        setProcessingSign(false)
      }
    } catch (error: any) {
      if (!didUserReject(error)) {
        setError(getErrorMsg(error))
      }
      console.error('signInWithEthereum err', error)
      connectingWallet.current = false
      setProcessingSign(false)
    }
  }, [address, provider, authFormConfig, chainId, isMismatchEthAddress])

  useEffect(() => {
    const getFlowLogin = async () => {
      try {
        KyberOauth2.initialize({ mode: ENV_KEY })
        const loginFlow = await KyberOauth2.oauthUi.getFlowLogin()
        if (!loginFlow) return
        setAuthFormConfig(loginFlow)

        const { client_id } = loginFlow.oauth_client
        const loginMethods = getSupportLoginMethods(loginFlow)

        let autoLogin = false
        const isIncludeGoogle = loginMethods.includes(LoginMethod.GOOGLE)
        if (loginMethods.length === 1) {
          if (loginMethods.includes(LoginMethod.ANONYMOUS)) {
            throw new Error('Not found login method for this app')
          }
          if (isIncludeGoogle) {
            autoLogin = true
          }
        }
        // todo
        if (loginMethods.includes(LoginMethod.ETH) && !isIncludeGoogle) {
          setTimeout(() => document.getElementById(BUTTON_IDS.LOGIN_ETH)?.click(), 200)
        }
        setAutoLogin(autoLogin)
        KyberOauth2.initialize({ clientId: client_id, mode: ENV_KEY })

        if (autoLogin) setTimeout(() => document.getElementById(BUTTON_IDS.LOGIN_GOOGLE)?.click(), 200)
      } catch (error: any) {
        const { error_description } = queryStringToObject(window.location.search)
        setError(error_description || getErrorMsg(error))
      }
    }
    getFlowLogin()
  }, [])

  const appName = authFormConfig?.oauth_client?.client_name || authFormConfig?.oauth_client?.client_id

  const renderEthMsg = () =>
    isMismatchEthAddress ? (
      <TextDesc>
        Your address is mismatched. The expected address is {getShortenAddress(wallet_address)}, but the address
        provided is {getShortenAddress(address)}. Please change your wallet address accordingly.
      </TextDesc>
    ) : (
      address && (
        <TextDesc>
          To get started, please sign-in to verify your ownership of this wallet address {getShortenAddress(address)}
        </TextDesc>
      )
    )

  return (
    <Container>
      <Col>
        <KyberLogo />
        {error ? (
          <TextDesc>{error}</TextDesc>
        ) : autoLogin ? (
          <TextDesc style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Loader /> Checking data ...
          </TextDesc>
        ) : isSignInEth && address ? (
          renderEthMsg()
        ) : (
          appName && <TextDesc>Please sign in to continue with {appName}</TextDesc>
        )}
        <AuthForm
          formConfig={authFormConfig}
          autoLogin={autoLogin}
          signInWithEth={signInWithEth}
          processingSignEth={processingSignEth}
          disableEth={!!isMismatchEthAddress}
        />
      </Col>
    </Container>
  )
}

export default Login
