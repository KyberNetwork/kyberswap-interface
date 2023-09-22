import { LoginFlow, LoginFlowUiNode, LoginMethod } from '@kybernetwork/oauth2'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import ButtonEth from 'pages/Oauth/AuthForm/ButtonEth'
import { FlowStatus } from 'pages/Oauth/Login'

import { getSupportLoginMethods, navigateToUrl } from '../utils'
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
  processingSignEth: boolean
  signInWithEth: () => void
  disableEth: boolean
  flowStatus: FlowStatus
}

const Splash = () => <div style={{ flex: 1, borderTop: '1px solid #505050' }}></div>

const AuthForm: React.FC<AuthFormProps> = ({
  formConfig,
  signInWithEth,
  flowStatus,
  processingSignEth,
  disableEth,
}) => {
  const { back_uri } = useParsedQueryString<{ back_uri: string }>()
  const theme = useTheme()
  const { autoLoginMethod } = flowStatus

  const loginMethods = getSupportLoginMethods(formConfig)
  const showEth = loginMethods.includes(LoginMethod.ETH) && autoLoginMethod !== LoginMethod.GOOGLE
  const hasGoogle = loginMethods.includes(LoginMethod.GOOGLE)

  if (!formConfig) return null
  const { ui } = formConfig

  const showBtnCancel = !isMobile && !hasGoogle && back_uri && !processingSignEth
  const hasBothEthAndGoogle = hasGoogle && showEth
  return (
    <Form
      encType="application/x-www-form-urlencoded"
      action={ui.action}
      method={ui.method}
      style={{ opacity: autoLoginMethod === LoginMethod.GOOGLE ? 0 : 1 }}
    >
      <AuthFormFieldMessage messages={ui.messages} />
      {showEth && (
        <Flex style={{ justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          {showBtnCancel && (
            <ButtonOutlined
              width={'230px'}
              onClick={e => {
                e.preventDefault()
                navigateToUrl(back_uri)
              }}
              height={'36px'}
            >
              Cancel
            </ButtonOutlined>
          )}
          <ButtonEth
            onClick={signInWithEth}
            disabled={processingSignEth || disableEth}
            loading={processingSignEth}
            flowStatus={flowStatus}
          />
        </Flex>
      )}
      {hasBothEthAndGoogle && (
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, color: theme.subText }}>
          <Splash /> or <Splash />
        </div>
      )}
      {hasGoogle &&
        ui?.nodes?.map((field: LoginFlowUiNode, index: number) => (
          <AuthFormField key={index} field={field} outline={showEth} flowStatus={flowStatus} />
        ))}
    </Form>
  )
}
export default AuthForm
