import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import { useSendOtpMutation, useVerifyOtpMutation } from 'services/identity'
import { useRequestWhiteListMutation } from 'services/kyberAISubscription'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import OTPInput from 'pages/TrueSightV2/pages/RegisterWhitelist/VerifyCodeModal/OtpInput'
import { getErrorMessage } from 'pages/TrueSightV2/utils'
import { useNotify } from 'state/application/hooks'
import { useSaveUserProfile, useSessionInfo } from 'state/authen/hooks'
import { UserProfile } from 'state/authen/reducer'

import WaitListForm from '../WaitListForm'

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

export default function VerifyCodeModal({
  isOpen,
  onDismiss,
  email,
  referredByCode,
  showSuccess,
}: {
  isOpen: boolean
  onDismiss: () => void
  email: string
  referredByCode: string
  showSuccess?: boolean
}) {
  const theme = useTheme()
  const [otp, setOtp] = useState<string>('')
  const [verifyOtp] = useVerifyOtpMutation()
  const [sendOtp] = useSendOtpMutation()
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [error, setError] = useState(false)
  const [requestWaitList] = useRequestWhiteListMutation()
  const notify = useNotify()
  const { userInfo } = useSessionInfo()

  const showNotiSuccess = useCallback(() => {
    setVerifySuccess(true)
    notify({
      title: t`Email Verified`,
      summary: t`Your email have been verified successfully. You can now select notification preference`,
      type: NotificationType.SUCCESS,
    })
  }, [notify])

  const sendEmail = useCallback(() => email && sendOtp({ email }), [email, sendOtp])

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
      showSuccess ? showNotiSuccess() : sendEmailWhenInit()
    }
  }, [isOpen, showNotiSuccess, showSuccess, sendEmailWhenInit])

  const setProfile = useSaveUserProfile()

  const verify = async () => {
    try {
      if (!email) return
      await verifyOtp({ code: otp, email }).unwrap()
      await requestWaitList({ referredByCode }).unwrap()
      setProfile({ ...userInfo, email } as UserProfile)
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
        {verifySuccess ? <Trans>Successful Registered</Trans> : <Trans>Verify your email address</Trans>}
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
            <WaitListForm
              style={{ maxWidth: '100%' }}
              desc={
                <Text fontSize={14} color={theme.text} lineHeight={'16px'} style={{ lineHeight: '18px' }}>
                  <Trans>
                    Thank you for registering your interest in the KyberAI Beta Program. Follow us on our social
                    channels to get regular updates on KyberAI
                  </Trans>
                </Text>
              }
            />
            <ButtonPrimary height={'36px'} onClick={onDismiss}>
              <Trans>Awesome</Trans>
            </ButtonPrimary>
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
              Didn&apos;t receive code?{' '}
              <Text as="span" color={theme.primary} style={{ cursor: 'pointer' }} onClick={sendEmail}>
                Resend
              </Text>
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
