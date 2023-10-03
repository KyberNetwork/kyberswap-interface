import { LoginFlow, LoginMethod } from '@kybernetwork/oauth2'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { Flex } from 'rebass'
import styled from 'styled-components'

import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import ButtonEth from 'pages/Oauth/AuthForm/ButtonEth'
import ButtonGoogle from 'pages/Oauth/AuthForm/ButtonGoogle'
import { FlowStatus } from 'pages/Oauth/Login'

import { getSupportLoginMethods, navigateToUrl } from '../helpers'
import AuthFormFieldMessage from './AuthFormMessage'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
`

interface AuthFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  formConfig: LoginFlow | undefined
  signInWithEth: () => void
  disableEth: boolean
  flowStatus: FlowStatus
}

const Splash = () => <div style={{ flex: 1, borderTop: '1px solid #505050' }}></div>

const AuthForm: React.FC<AuthFormProps> = ({ formConfig, signInWithEth, flowStatus, disableEth }) => {
  const { back_uri } = useParsedQueryString<{ back_uri: string }>()
  const theme = useTheme()
  if (!formConfig) return null

  const { autoLoginMethod, processingSignIn } = flowStatus
  const { ui } = formConfig
  const loginMethods = getSupportLoginMethods(formConfig)

  const showEth = loginMethods.includes(LoginMethod.ETH) && autoLoginMethod !== LoginMethod.GOOGLE
  const hasGoogle = loginMethods.includes(LoginMethod.GOOGLE)
  const showBtnCancel = !isMobile && !hasGoogle && back_uri && !processingSignIn
  const hasBothEthAndGoogle = hasGoogle && showEth
  return (
    <Form encType="application/x-www-form-urlencoded" action={ui.action} method={ui.method}>
      <AuthFormFieldMessage messages={ui.messages} />
      {showEth && (
        <ButtonEth
          onClickCancel={() => navigateToUrl(back_uri)}
          showBtnCancel={!!showBtnCancel}
          onClick={signInWithEth}
          disabled={processingSignIn || disableEth}
          loading={processingSignIn}
          flowStatus={flowStatus}
        />
      )}
      {hasBothEthAndGoogle && (
        <Flex style={{ width: '100%', alignItems: 'center', gap: 10, color: theme.subText }}>
          <Splash /> or <Splash />
        </Flex>
      )}
      {hasGoogle && <ButtonGoogle flowStatus={flowStatus} outline={showEth} />}
    </Form>
  )
}
export default AuthForm
