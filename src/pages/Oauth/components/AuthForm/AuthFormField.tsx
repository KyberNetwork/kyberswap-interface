import { LoginFlowUiNode } from '@kybernetwork/oauth2'
import React from 'react'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'

import { BUTTON_IDS } from '../../constants/index'

interface AuthFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  field: LoginFlowUiNode
  outline?: boolean
}

const AuthFormField: React.FC<AuthFormFieldProps> = ({ field, outline }) => {
  const attributes = field.attributes
  if (field.group === 'oidc') {
    const props = {
      height: '36px',
      id: BUTTON_IDS.LOGIN_GOOGLE,
      type: 'submit',
      value: attributes.value,
      name: attributes.name,
      children: <>Sign-In with Google</>,
    }
    return React.createElement(outline ? ButtonOutlined : ButtonPrimary, props)
  }
  return null
}
export default AuthFormField
