import { LoginFlow, LoginMethod } from '@kyberswap/oauth2'
import React, { Fragment, useMemo } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import ButtonEth from 'pages/Oauth/AuthForm/ButtonEth'
import ButtonGoogle from 'pages/Oauth/AuthForm/ButtonGoogle'
import EmailLoginForm from 'pages/Oauth/AuthForm/EmailLoginForm'
import { FlowStatus } from 'pages/Oauth/Login'

import { getSupportLoginMethods } from '../helpers'
import AuthFormFieldMessage from './AuthFormMessage'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 340px;
  max-width: 90vw;
`

interface AuthFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  formConfig: LoginFlow | undefined
  signInWithEth: () => void
  disableEth: boolean
  flowStatus: FlowStatus
}

const Splash = () => <div style={{ flex: 1, borderTop: '1px solid #505050' }}></div>

export const OrDivider = () => {
  const theme = useTheme()
  return (
    <Flex style={{ width: '100%', alignItems: 'center', gap: 10, color: theme.subText }}>
      <Splash /> or <Splash />
    </Flex>
  )
}

const AuthForm: React.FC<AuthFormProps> = ({ formConfig, signInWithEth, flowStatus, disableEth }) => {
  const { processingSignIn } = flowStatus

  const nodes = useMemo(() => {
    const loginMethods = getSupportLoginMethods(formConfig)
    const hasEth = loginMethods.includes(LoginMethod.ETH)
    const hasGoogle = loginMethods.includes(LoginMethod.GOOGLE)
    const hasEmail = loginMethods.includes(LoginMethod.EMAIL)

    const nodes = []
    if (hasEth)
      nodes.push(
        <ButtonEth
          onClick={signInWithEth}
          disabled={disableEth}
          loading={processingSignIn}
          flowStatus={flowStatus}
          primary={!hasEmail}
        />,
      )
    if (hasEmail) nodes.push(<EmailLoginForm flowStatus={flowStatus} />)
    if (hasGoogle) nodes.push(<ButtonGoogle flowStatus={flowStatus} primary={!hasEmail && !hasEth} />)
    return nodes
  }, [disableEth, flowStatus, formConfig, processingSignIn, signInWithEth])

  if (!formConfig) return null
  const { ui } = formConfig

  return (
    <Form encType="application/x-www-form-urlencoded" action={ui.action} method={ui.method}>
      <AuthFormFieldMessage messages={ui.messages} />
      {nodes.map((el, i) => (
        <Fragment key={i}>
          {el}
          {i !== nodes.length - 1 && <OrDivider />}
        </Fragment>
      ))}
    </Form>
  )
}
export default AuthForm
