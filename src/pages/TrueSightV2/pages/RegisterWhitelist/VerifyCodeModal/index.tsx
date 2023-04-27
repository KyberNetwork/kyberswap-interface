import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import { useSendOtpMutation, useVerifyOtpMutation } from 'services/identity'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import OTPInput from 'pages/TrueSightV2/pages/RegisterWhitelist/VerifyCodeModal/OtpInput'
import { ParticipantStatus } from 'pages/TrueSightV2/types'
import { useNotify } from 'state/application/hooks'
import { useGetParticipantInfo } from 'state/user/hooks'

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
}: {
  isOpen: boolean
  onDismiss: () => void
  email: string
}) {
  const theme = useTheme()
  const [otp, setOtp] = useState<string>('')
  const [verifyOtp] = useVerifyOtpMutation()
  const [sendOtp] = useSendOtpMutation()
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [error, setError] = useState(false)
  const participantInfo = useGetParticipantInfo()
  const notify = useNotify()

  const showNotiSuccess = useCallback(() => {
    setVerifySuccess(true)
    notify({
      title: t`Email Verified`,
      summary: t`Your email have been verified successfully. You can now select notification preference`,
      type: NotificationType.SUCCESS,
    })
  }, [notify])

  const sendCodeToEmail = useCallback(() => {
    email && sendOtp({ email })
  }, [sendOtp, email])

  const checkRegisterStatus = useCallback(() => {
    if (participantInfo?.status === ParticipantStatus.WAITLISTED) showNotiSuccess()
    else sendCodeToEmail()
  }, [participantInfo, sendCodeToEmail, showNotiSuccess])

  useEffect(() => {
    if (!isOpen) {
      setError(false)
      setOtp('')
      setVerifySuccess(false)
    } else {
      checkRegisterStatus()
    }
  }, [isOpen, checkRegisterStatus])

  const verify = async () => {
    try {
      if (!email) return
      await verifyOtp({ code: otp, email })
      showNotiSuccess()
    } catch (error) {
      setError(true)
      notify({
        title: t`Error`,
        summary: t`OTP wrong or expired. Please try again.`,
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
              <Text as="span" color={theme.primary} style={{ cursor: 'pointer' }} onClick={sendCodeToEmail}>
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
