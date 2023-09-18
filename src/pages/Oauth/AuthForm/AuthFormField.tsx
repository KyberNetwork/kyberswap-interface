import { LoginFlowUiNode, LoginMethod } from '@kybernetwork/oauth2'
import React, { useCallback, useRef } from 'react'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { useAutoSignIn } from 'pages/Oauth/AuthForm'
import { FlowStatus } from 'pages/Oauth/Login'

interface AuthFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  field: LoginFlowUiNode
  outline: boolean
  flowStatus: FlowStatus
}

const AuthFormField: React.FC<AuthFormFieldProps> = ({ field, outline, flowStatus }) => {
  const attributes = field.attributes
  const ref = useRef<HTMLButtonElement>(null)
  const isGoogleBtn = field.group === 'oidc'

  const onClick = useCallback(() => {
    if (!isGoogleBtn) return
    ref.current?.click?.()
  }, [isGoogleBtn])

  useAutoSignIn({ onClick, flowStatus, method: LoginMethod.GOOGLE })

  if (isGoogleBtn) {
    const props = {
      height: '36px',
      id: 'btnLoginGoogle',
      type: 'submit',
      value: attributes.value,
      name: attributes.name,
      ref,
      children: <>Sign-In with Google</>,
    }
    return React.createElement(outline ? ButtonOutlined : ButtonPrimary, props)
  }
  return null // need to update when support more sign in method
}
export default AuthFormField
