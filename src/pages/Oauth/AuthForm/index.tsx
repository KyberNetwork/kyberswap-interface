import { LoginFlow, LoginFlowUiNode, LoginMethod } from '@kybernetwork/oauth2'
import axios from 'axios'
import React, { Fragment, useMemo } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import AuthFormField from 'pages/Oauth/AuthForm/AuthFormField'
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
  const loginMethods = getSupportLoginMethods(formConfig)

  const hasEth = loginMethods.includes(LoginMethod.ETH)
  const hasGoogle = loginMethods.includes(LoginMethod.GOOGLE)
  const hasEmail = loginMethods.includes(LoginMethod.EMAIL)

  const nodes = useMemo(() => {
    const nodes = []
    if (hasEmail) nodes.push(<EmailLoginForm flowStatus={flowStatus} />)
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
    if (hasGoogle) nodes.push(<ButtonGoogle flowStatus={flowStatus} primary={!hasEmail && !hasEth} />)
    return nodes
  }, [disableEth, flowStatus, hasEmail, hasEth, hasGoogle, processingSignIn, signInWithEth])

  if (!formConfig) return null
  const { ui } = formConfig
  const test = async () => {
    try {
      const data = new FormData()
      const data2 = {
        email: 'danh.nguyen@kyber.network',
      }
      let csrf = ''
      ui?.nodes.forEach(el => {
        if (el.attributes.name === 'password' || el.attributes.name === 'identifier' || el.attributes.name === 'method')
          return
        if (el.attributes.name === 'csrf_token') {
          csrf = el.attributes.value
        }
        // data.append(el.attributes.name, el.attributes.value)
        // data2[el.attributes.name as any] = el.attributes.value
      })
      const resp = await axios.post(
        // 'https://identity-api.dev.kyberengineering.io/self-service/login/email/codes?flow=' +
        // queryStringToObject(window.location.search).flow,
        ui.action.replace('/login', '/login/email/codes'),
        data2,
        {
          withCredentials: true,
          headers: {
            'X-CSRF-Token': csrf,
          },
        },
      )
      console.log(123, resp)
    } catch (error) {
      console.log(123, error)
    }
  }
  return (
    <Form encType="application/x-www-form-urlencoded" action={ui.action} method={ui.method}>
      <div onClick={test}>test</div>
      <AuthFormFieldMessage messages={ui.messages} />
      {ui?.nodes?.map((field: LoginFlowUiNode, index: number) => (
        <AuthFormField key={index} field={field} />
      ))}
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
