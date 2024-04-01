import KyberOauth2, { LoginMethod } from '@kyberswap/oauth2'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useValidateEmail } from 'pages/NotificationCenter/NotificationPreference'
import InputEmailWithVerification from 'pages/NotificationCenter/NotificationPreference/InputEmail'
import useAutoSignIn from 'pages/Oauth/AuthForm/useAutoSignIn'
import { FlowStatus, getIamErrorMsg } from 'pages/Oauth/Login'
import { isEmailValid, queryStringToObject } from 'utils/string'

const Wrapper = styled(Column)`
  width: 100%;
  justify-content: center;
  gap: 16px;
`

const EmailLoginForm = ({ flowStatus }: { flowStatus: FlowStatus }) => {
  const { email } = useParsedQueryString<{ email: string }>()
  const { inputEmail, errorInput, onChangeEmail } = useValidateEmail(isEmailValid(email) ? email || '' : '')

  const [isShowVerify, setIsShowVerify] = useState(false)
  const onDismissVerifyModal = () => {
    setIsShowVerify(false)
  }

  const onVerifyEmail = (e?: React.MouseEvent) => {
    e?.preventDefault?.()
    if (errorInput || isShowVerify || !inputEmail) return
    setIsShowVerify(true)
  }

  useAutoSignIn({ method: LoginMethod.EMAIL, onClick: onVerifyEmail, flowStatus })

  const onVerifyCode = async (data: { code: string; email: string }) => {
    const resp = await KyberOauth2.oauthUi.loginEmail(data)
    console.debug('oauth resp login email', resp)
  }

  const onSendCode = async ({ email }: { email: string }) => {
    return KyberOauth2.oauthUi.sendVerifyCode({
      email,
      flow: queryStringToObject(window.location.search).flow + '',
      csrf: flowStatus.csrf,
    })
  }

  return (
    <Wrapper>
      <InputEmailWithVerification
        hasError={!!errorInput}
        isVerifiedEmail
        value={inputEmail}
        placement={t`Email Address`}
        onChange={onChangeEmail}
        style={{ width: 340, height: 36 }}
        onDismissVerifyModal={onDismissVerifyModal}
        isShowVerify={isShowVerify}
        sendCodeFn={onSendCode}
        verifyCodeFn={onVerifyCode}
        getErrorMsgFn={getIamErrorMsg}
      />
      <ButtonPrimary height={'36px'} onClick={onVerifyEmail}>
        <Trans>Sign-In with Email</Trans>
      </ButtonPrimary>
    </Wrapper>
  )
}

export default EmailLoginForm
