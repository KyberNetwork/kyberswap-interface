import { LoginFlow, LoginFlowUiNode, LoginMethod } from '@kybernetwork/oauth2'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Wallet from 'components/Icons/Wallet'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useWalletModalToggle } from 'state/application/hooks'

import { BUTTON_IDS } from '../../constants/index'
import { getSupportLoginMethods, navigateToUrl } from '../../utils'
import AuthFormField from './AuthFormField'
import AuthFormFieldMessage from './AuthFormFieldMessage'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
`

interface AuthFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  formConfig: LoginFlow | undefined
  autoLogin: boolean
  processingSignEth: boolean
  signInWithEth: () => void
  disableEth: boolean
}

const Splash = () => <div style={{ flex: 1, borderTop: '1px solid #505050' }}></div>

const AuthForm: React.FC<AuthFormProps> = ({
  children,
  formConfig,
  autoLogin,
  signInWithEth,
  processingSignEth,
  disableEth,
  ...otherProps
}) => {
  const { back_uri } = useParsedQueryString<{ back_uri: string }>()

  const loginMethods = getSupportLoginMethods(formConfig)
  const showEth = loginMethods.includes(LoginMethod.ETH) && !autoLogin
  const hasGoogle = loginMethods.includes(LoginMethod.GOOGLE)
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const onClickEth = (e: React.MouseEvent) => {
    e.preventDefault()
    !account ? toggleWalletModal() : signInWithEth()
  }

  const renderBtnEth = () => (
    <ButtonPrimary
      width={'230px'}
      height={'36px'}
      className="login-btn"
      id={BUTTON_IDS.LOGIN_ETH}
      onClick={onClickEth}
      disabled={processingSignEth || disableEth}
    >
      {processingSignEth ? (
        <>
          <Loader />
          &nbsp; <Text style={{ whiteSpace: 'nowrap' }}> Signing In</Text>
        </>
      ) : (
        <>
          <Wallet />
          &nbsp; Sign-In with Wallet
        </>
      )}
    </ButtonPrimary>
  )

  if (!formConfig) return null
  const { ui } = formConfig

  const showBtnCancel = !isMobile && !hasGoogle && back_uri && !processingSignEth
  const hasBothEthAndGoogle = hasGoogle && showEth
  return (
    <Form
      encType="application/x-www-form-urlencoded"
      action={ui.action}
      method={ui.method}
      style={{ opacity: autoLogin ? 0 : 1 }}
      {...otherProps}
      className="login-form"
    >
      <AuthFormFieldMessage messages={ui.messages} />
      {showEth &&
        (showBtnCancel ? (
          <Flex style={{ justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            {showBtnCancel && (
              <ButtonOutlined
                className="cancel-login-btn"
                width={'230px'}
                onClick={() => navigateToUrl(back_uri)}
                height={'36px'}
              >
                Cancel
              </ButtonOutlined>
            )}
            {renderBtnEth()}
          </Flex>
        ) : (
          renderBtnEth()
        ))}
      {hasBothEthAndGoogle && (
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10 }} className="sub-text">
          <Splash /> or <Splash />
        </div>
      )}
      {hasGoogle &&
        ui?.nodes?.map((field: LoginFlowUiNode, index: number) => (
          <AuthFormField key={index} field={field} outline={showEth} />
        ))}
    </Form>
  )
}
export default AuthForm
