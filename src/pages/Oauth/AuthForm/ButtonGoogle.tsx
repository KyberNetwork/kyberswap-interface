import { LoginMethod } from '@kybernetwork/oauth2'
import { Trans } from '@lingui/macro'
import React, { useCallback, useRef } from 'react'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import useAutoSignIn from 'pages/Oauth/AuthForm/useAutoSignIn'
import { FlowStatus } from 'pages/Oauth/Login'

interface Props {
  outline: boolean
  flowStatus: FlowStatus
}

const ButtonGoogle: React.FC<Props> = ({ outline, flowStatus }) => {
  const ref = useRef<HTMLButtonElement>(null)
  const { autoLoginMethod } = flowStatus
  const isAutoLogin = autoLoginMethod === LoginMethod.GOOGLE

  const onClick = useCallback(() => {
    ref.current?.click?.()
  }, [])

  useAutoSignIn({ onClick, flowStatus, method: LoginMethod.GOOGLE })

  const props = {
    height: '36px',
    id: 'btnLoginGoogle',
    type: 'submit',
    value: 'google',
    name: 'provider',
    ref,
    children: <Trans>Sign-In with Google</Trans>,
    style: isAutoLogin ? { opacity: 0 } : undefined,
  }
  return React.createElement(outline ? ButtonOutlined : ButtonPrimary, props)
}
export default ButtonGoogle
