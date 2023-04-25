import { Trans } from '@lingui/macro'
import { useRef, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import OTPInput from 'pages/TrueSightV2/pages/RegisterWhitelist/OtpInput'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
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
`

const Input = styled.input`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  width: 56px;
  height: 80px;
  font-size: 48px;
  outline: none;
  color: ${({ theme }) => theme.subText};
  border: 1px solid ${({ theme }) => theme.border};
  text-align: center;
`

export default function VerifyCodeModal({ isOpen }: { isOpen: boolean }) {
  const theme = useTheme()
  const [otp, setOtp] = useState<string>('')
  const toggleModal = () => {
    //
  }

  return (
    <Modal isOpen={isOpen} onDismiss={toggleModal} minHeight={false} maxWidth={450}>
      <Wrapper>
        <Content>
          <RowBetween>
            <Text color={theme.text} fontWeight={'500'} fontSize={'20'}>
              <Trans>Verify your email address</Trans>
            </Text>
            <X color={theme.text} cursor="pointer" />
          </RowBetween>
          <Label>
            <Trans>
              We have sent a verification code to{' '}
              <Text as="span" color={theme.text}>
                kamiho49@gmail.com
              </Text>
              . Please enter the code in the field below:
            </Trans>
          </Label>

          <OTPInput
            containerStyle={{
              justifyContent: 'space-between',
            }}
            value={otp}
            onChange={setOtp}
            numInputs={6}
            renderInput={props => <Input {...props} placeholder="-" />}
          />

          <Label style={{ width: '100%', textAlign: 'center' }}>
            Didn&apos;t receive code?{' '}
            <Text as="span" color={theme.primary}>
              Resend
            </Text>
          </Label>
          <ButtonPrimary height={'36px'} disabled={otp.length < 6}>
            <Trans>Verify</Trans>
          </ButtonPrimary>
        </Content>
      </Wrapper>
    </Modal>
  )
}
