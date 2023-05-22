import { Trans, t } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import { useSendOtpMutation, useVerifyOtpMutation } from 'services/identity'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import OTPInput from 'pages/Verify/VerifyCodeModal/OtpInput'
import { useNotify } from 'state/application/hooks'
import { useSaveUserProfile, useSessionInfo } from 'state/authen/hooks'
import { UserProfile } from 'state/authen/reducer'

export const getErrorMessage = (error: any) => {
  const mapErr: { [key: number]: string } = {
    4004: t`OTP wrong or expired. Please try again.`,
    4040: t`Referral code is invalid`,
    4090: t`This email address is already registered`,
  }
  const code = error?.data?.code
  return mapErr[code] || t`Error occur, please try again`
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: 100%;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
`

const Input = styled.input<{ hasError: boolean }>`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  width: 56px;
  height: 80px;
  font-size: 48px;
  outline: none;
  color: ${({ theme, hasError }) => (hasError ? theme.red : theme.subText)};
  border: 1px solid ${({ theme, hasError }) => (hasError ? theme.red : theme.border)};
  text-align: center;
`

const formatTime = (secs: number) => {
  const mins = (secs / 60) | 0
  const pad = (num: number) => (num < 10 ? '0' + num : num)
  return `${pad(mins)}:${pad(secs - mins * 60)}`
}

const timeExpire = 5
const defaultTime = timeExpire * TIMES_IN_SECS.ONE_MIN
export default function VerifyCodeModal({
  isOpen,
  onDismiss,
  onVerifySuccess,
  email,
  showVerifySuccess,
  verifySuccessTitle,
  verifySuccessContent,
}: {
  onVerifySuccess?: (() => Promise<any>) | (() => void)
  isOpen: boolean
  onDismiss: () => void
  email: string
  showVerifySuccess?: boolean
  verifySuccessTitle?: string
  verifySuccessContent?: ReactNode
}) {
  const theme = useTheme()
  const [otp, setOtp] = useState<string>('')
  const [verifyOtp] = useVerifyOtpMutation()
  const [sendOtp] = useSendOtpMutation()
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [error, setError] = useState(false)
  const notify = useNotify()

  const [expiredDuration, setExpireDuration] = useState(defaultTime)
  const canShowResend = expiredDuration < (timeExpire - 1) * TIMES_IN_SECS.ONE_MIN

  const interval = useRef<NodeJS.Timeout>()
  useEffect(() => {
    interval.current = setInterval(() => {
      setExpireDuration(expiredDuration - 1)
    }, 1000)
    return () => interval.current && clearInterval(interval.current)
  }, [expiredDuration])

  const showNotiSuccess = useCallback(
    (withNotify = true) => {
      setVerifySuccess(true)
      withNotify &&
        notify({
          title: t`Email Verified`,
          summary: t`Your email have been verified successfully. You can now select notification preference`,
          type: NotificationType.SUCCESS,
        })
    },
    [notify],
  )

  const sendEmail = useCallback(() => {
    email && sendOtp({ email })
    interval.current && clearInterval(interval.current)
    setExpireDuration(defaultTime)
  }, [email, sendOtp])

  const checkedRegisterStatus = useRef(false) // prevent spam
  const sendEmailWhenInit = useCallback(() => {
    if (checkedRegisterStatus.current) return
    checkedRegisterStatus.current = true
    sendEmail()
  }, [sendEmail])

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setError(false)
        setOtp('')
        setVerifySuccess(false)
      }, 1000)
      checkedRegisterStatus.current = false
    } else {
      showVerifySuccess ? showNotiSuccess(false) : sendEmailWhenInit()
    }
  }, [isOpen, showNotiSuccess, showVerifySuccess, sendEmailWhenInit])

  const setProfile = useSaveUserProfile()
  const { userInfo, isLogin } = useSessionInfo()

  const verify = async () => {
    try {
      if (!email) return
      await verifyOtp({ code: otp, email }).unwrap()
      await onVerifySuccess?.()
      setProfile({ profile: { ...userInfo, email } as UserProfile, isAnonymous: !isLogin })
      showNotiSuccess()
    } catch (error) {
      setError(true)
      notify({
        title: t`Error`,
        summary: getErrorMessage(error),
        type: NotificationType.ERROR,
      })
    }
  }

  const onChange = (value: string) => {
    setError(false)
    setOtp(value)
  }

  const header = (
    <RowBetween>
      <Text color={theme.text} fontWeight={'500'} fontSize={'20'}>
        {verifySuccess ? verifySuccessTitle : <Trans>Verify your email address</Trans>}
      </Text>
      <X color={theme.text} cursor="pointer" onClick={onDismiss} />
    </RowBetween>
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={false} maxWidth={450}>
      <Wrapper>
        {verifySuccess ? (
          <Content>
            {header}
            {verifySuccessContent}
          </Content>
        ) : (
          <Content>
            {header}
            <Label>
              <Trans>
                We have sent a verification code to{' '}
                <Text as="span" color={theme.text}>
                  {email}
                </Text>
                . Please enter the code in the field below:
              </Trans>
            </Label>

            <OTPInput
              containerStyle={{ justifyContent: 'space-between' }}
              value={otp}
              onChange={onChange}
              numInputs={6}
              renderInput={props => <Input {...props} hasError={error} placeholder="-" />}
            />

            <Label style={{ width: '100%', textAlign: 'center' }}>
              {expiredDuration > 0 && (
                <Trans>
                  Code will be expired in {formatTime(expiredDuration)}
                  {canShowResend ? '.' : ''}
                </Trans>
              )}
              &nbsp;
              {canShowResend && (
                <Trans>
                  Didn&apos;t receive code?{' '}
                  <Text as="span" color={theme.primary} style={{ cursor: 'pointer' }} onClick={sendEmail}>
                    Resend
                  </Text>
                </Trans>
              )}
            </Label>
            <ButtonPrimary height={'36px'} disabled={otp.length < 6} onClick={verify}>
              <Trans>Verify</Trans>
            </ButtonPrimary>
          </Content>
        )}
      </Wrapper>
    </Modal>
  )
}
