import { LoginFlowUiNode } from '@kybernetwork/oauth2'
import React from 'react'

interface AuthFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  field: LoginFlowUiNode
  outline?: boolean
}

const AuthFormField: React.FC<AuthFormFieldProps> = ({ field }) => {
  const attributes = field.attributes
  if (field.group === 'oidc') return null
  return <input type={attributes.type} value={attributes.value} name={attributes.name} />
}
export default AuthFormField
