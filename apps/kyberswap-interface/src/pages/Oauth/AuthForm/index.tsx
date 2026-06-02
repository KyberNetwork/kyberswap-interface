import { LoginFlow, LoginMethod } from '@kyberswap/oauth2'
import React, { Fragment, useMemo } from 'react'

import AuthFormFieldMessage from 'pages/Oauth/AuthForm/AuthFormMessage'
import ButtonEth from 'pages/Oauth/AuthForm/ButtonEth'
import ButtonGoogle from 'pages/Oauth/AuthForm/ButtonGoogle'
import EmailLoginForm from 'pages/Oauth/AuthForm/EmailLoginForm'
import { FlowStatus } from 'pages/Oauth/Login'
import { getSupportLoginMethods } from 'pages/Oauth/helpers'

interface AuthFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  formConfig: LoginFlow | undefined
  signInWithEth: () => void
  disableEth: boolean
  flowStatus: FlowStatus
}

const Splash = () => <div className="flex-1 border-t border-solid border-border" />

export const OrDivider = () => (
  <div className="flex w-full items-center gap-2.5 text-subText">
    <Splash /> or <Splash />
  </div>
)

const AuthForm: React.FC<AuthFormProps> = ({ formConfig, signInWithEth, flowStatus, disableEth }) => {
  const { processingSignIn } = flowStatus

  const nodes = useMemo(() => {
    const loginMethods = getSupportLoginMethods(formConfig)
    const hasEth = loginMethods.includes(LoginMethod.ETH)
    const hasGoogle = loginMethods.includes(LoginMethod.GOOGLE)
    const hasEmail = loginMethods.includes(LoginMethod.EMAIL)

    const nodes: React.ReactNode[] = []
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
    <form
      encType="application/x-www-form-urlencoded"
      action={ui.action}
      method={ui.method}
      className="flex w-[340px] max-w-[90vw] flex-col items-center gap-3.5"
    >
      <AuthFormFieldMessage messages={ui.messages} />
      {nodes.map((el, i) => (
        <Fragment key={i}>
          {el}
          {i !== nodes.length - 1 && <OrDivider />}
        </Fragment>
      ))}
    </form>
  )
}
export default AuthForm
