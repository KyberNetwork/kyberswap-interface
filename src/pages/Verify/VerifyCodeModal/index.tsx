import { Trans, t } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { isAndroid, isIOS, isMobile } from 'react-device-detect'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useSendOtpMutation, useVerifyOtpMutation } from 'services/identity'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import OTPInput from 'pages/Verify/VerifyCodeModal/OtpInput'
import { useNotify } from 'state/application/hooks'
import { useRefreshProfile } from 'state/profile/hooks'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  width: 100%;
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
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 28px;
    width: 46px;
    height: 60px;
  `}
`

const formatTime = (secs: number) => {
  const mins = (secs / 60) | 0
  const pad = (num: number) => (num < 10 ? '0' + num : num)
  return `${pad(mins)}:${pad(secs - mins * 60)}`
}

const timeExpire = 5
const defaultTime = timeExpire * TIMES_IN_SECS.ONE_MIN
enum ErrorType {
  VALIDATE_ERROR = 'VALIDATE_ERROR',
  SEND_EMAIL_ERROR = 'SEND_EMAIL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}
export default function VerifyCodeModal({
  isOpen,
  onDismiss,
  onVerifySuccess,
  email,
  showVerifySuccess,
  verifySuccessTitle,
  verifySuccessContent,
  sendCodeFn,
  verifyCodeFn,
  getErrorMsgFn,
  refreshProfile = true,
}: {
  onVerifySuccess?: (() => Promise<any>) | (() => void)
  isOpen: boolean
  onDismiss: () => void
  email: string
  showVerifySuccess?: boolean
  verifySuccessTitle?: string
  verifySuccessContent?: ReactNode
  sendCodeFn?: (data: { email: string }) => Promise<any>
  verifyCodeFn?: (data: { email: string; code: string }) => Promise<void>
  getErrorMsgFn?: (err: any) => string
  refreshProfile?: boolean
}) {
  const theme = useTheme()
  const [otp, setOtp] = useState<string>('')
  const [verifyOtp] = useVerifyOtpMutation()
  const [sendOtp] = useSendOtpMutation()
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [error, setError] = useState<ErrorType>()
  const notify = useNotify()
  const [isTypingIos, setIsTypingIos] = useState(false)
  const isTypingAndroid = useMedia(`(max-height: 450px)`)

  const [expiredDuration, setExpireDuration] = useState(0)

  const isSendMailError = error === ErrorType.SEND_EMAIL_ERROR
  const isVerifyMailError = error === ErrorType.VALIDATE_ERROR
  const isRateLimitError = error === ErrorType.RATE_LIMIT

  const canShowResend =
    !isSendMailError && !isRateLimitError && expiredDuration < (timeExpire - 1) * TIMES_IN_SECS.ONE_MIN

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
          summary: t`Your email has been verified successfully! You can now customize your preferences.`,
          type: NotificationType.SUCCESS,
        })
    },
    [notify],
  )

  const sendEmail = useCallback(async () => {
    interval.current && clearInterval(interval.current)
    if (!email) return
    try {
      const promise = sendCodeFn ? sendCodeFn({ email }) : sendOtp({ email }).unwrap()
      await promise
      setExpireDuration(defaultTime)
      setError(undefined)
    } catch (error) {
      setExpireDuration(0)
      setError(!error?.status ? ErrorType.RATE_LIMIT : ErrorType.SEND_EMAIL_ERROR)
    }
  }, [email, sendOtp, sendCodeFn])

  const checkedRegisterStatus = useRef(false) // prevent spam
  const sendEmailWhenInit = useCallback(() => {
    if (checkedRegisterStatus.current) return
    checkedRegisterStatus.current = true
    sendEmail()
  }, [sendEmail])

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setError(undefined)
        setOtp('')
        setVerifySuccess(false)
      }, 300)
      checkedRegisterStatus.current = false
    } else {
      showVerifySuccess ? showNotiSuccess(false) : sendEmailWhenInit()
    }
  }, [isOpen, showNotiSuccess, showVerifySuccess, sendEmailWhenInit])

  const refreshProfileInfo = useRefreshProfile()

  const [verifying, setIsVerifying] = useState(false)
  const verify = async () => {
    if (!email || verifying) return
    try {
      setIsVerifying(true)
      const promise = verifyCodeFn ? verifyCodeFn({ code: otp, email }) : verifyOtp({ code: otp, email }).unwrap()
      await promise
      await (onVerifySuccess ? onVerifySuccess() : onDismiss())
      if (refreshProfile) {
        await refreshProfileInfo()
        showNotiSuccess()
      }
    } catch (error) {
      setError(ErrorType.VALIDATE_ERROR)
      notify({
        title: t`Error`,
        summary: getErrorMsgFn?.(error),
        type: NotificationType.ERROR,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const onChangeOTP = (value: string) => {
    isVerifyMailError && setError(undefined)
    setOtp(value)
  }

  const header = (
    <RowBetween>
      <Text color={theme.text} fontWeight={'500'} fontSize={'20'}>
        {verifySuccess ? verifySuccessTitle : <Trans>Verify your email address.</Trans>}
      </Text>
      <X color={theme.text} cursor="pointer" onClick={onDismiss} />
    </RowBetween>
  )

  const showExpiredTime = !isSendMailError && !isRateLimitError && expiredDuration > 0

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      minHeight={false}
      maxWidth={450}
      maxHeight={isTypingIos && isIOS ? window.innerHeight + 'px' : undefined}
      height={
        !isMobile
          ? undefined
          : isAndroid && isTypingAndroid
          ? '100%'
          : isTypingIos && isIOS
          ? window.innerHeight + 'px'
          : undefined
      }
    >
      <Wrapper>
        {verifySuccess ? (
          <Content>
            {header}
            {verifySuccessContent}
          </Content>
        ) : (
          <Content>
            {header}
            <Label style={{ color: isSendMailError || isRateLimitError ? theme.red : theme.subText }}>
              {isRateLimitError ? (
                <Trans>You reached limit quota. Please try after a few minutes.</Trans>
              ) : isSendMailError ? (
                <Trans>
                  Failed to send a verification code to{' '}
                  <Text as="span" color={theme.text}>
                    {email}
                  </Text>
                  . Please click Resend to try again
                </Trans>
              ) : (
                <Trans>
                  We have sent a verification code to{' '}
                  <Text as="span" color={theme.text}>
                    {email}
                  </Text>
                  . Please enter the code in the field below:
                </Trans>
              )}
            </Label>

            <OTPInput
              containerStyle={{ justifyContent: 'space-between' }}
              value={otp}
              onChange={onChangeOTP}
              numInputs={6}
              renderInput={props => (
                <Input
                  {...props}
                  hasError={isVerifyMailError}
                  placeholder="-"
                  type="number"
                  onFocus={() => {
                    isIOS && setIsTypingIos(true)
                    setTimeout(() => {
                      window.scrollTo({ top: 0 })
                    }, 100)
                  }}
                  onBlur={() => isIOS && setIsTypingIos(false)}
                />
              )}
            />

            {(showExpiredTime || canShowResend) && (
              <Label style={{ width: '100%', textAlign: 'center' }}>
                {showExpiredTime && (
                  <Trans>
                    Code will expire in {formatTime(expiredDuration)}
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
            )}
            {isSendMailError ? (
              <ButtonPrimary height={'36px'} onClick={sendEmail}>
                <Trans>Resend</Trans>
              </ButtonPrimary>
            ) : (
              <ButtonPrimary
                height={'36px'}
                disabled={otp.length < 6 || isRateLimitError || verifying}
                onClick={verify}
              >
                {verifying ? (
                  <Dots>
                    <Trans>Verifying</Trans>
                  </Dots>
                ) : (
                  <Trans>Verify</Trans>
                )}
              </ButtonPrimary>
            )}
          </Content>
        )}
      </Wrapper>
    </Modal>
  )
}
