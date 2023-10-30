import { Trans, t } from '@lingui/macro'
import { Check } from 'react-feather'
import styled, { CSSProperties } from 'styled-components'

import { ButtonLight } from 'components/Button'
import Input from 'components/Input'
import Tooltip from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import VerifyCodeModal from 'pages/Verify/VerifyCodeModal'

const CheckIcon = styled(Check)`
  position: absolute;
  right: 13px;
  top: 0;
  bottom: 0;
  margin: auto;
`
const ButtonVerify = styled(ButtonLight)`
  position: absolute;
  right: 13px;
  top: 0;
  bottom: 0;
  margin: auto;
  font-size: 12px;
`

const InputWrapper = styled.div`
  position: relative;
`
type Props = {
  onChange: (val: string) => void
  isVerifiedEmail?: boolean
  value: string
  disabled?: boolean
  hasError?: boolean
  showVerifyModal?: () => void
  style?: CSSProperties
  placement?: string
}
export function InputEmail({
  value,
  onChange,
  isVerifiedEmail,
  showVerifyModal,
  disabled,
  hasError,
  style,
  placement,
}: Props) {
  const theme = useTheme()
  return (
    <Tooltip
      text={t`Invalid email address`}
      style={{ zIndex: 1 }}
      show={!!hasError}
      placement="top"
      width="fit-content"
      containerStyle={style}
    >
      <InputWrapper style={style}>
        <Input
          color={style?.color}
          style={{ maxHeight: '100%' }}
          disabled={disabled}
          borderColor={hasError ? theme.red : theme.border}
          value={value}
          placeholder={placement || 'example@email.com'}
          onChange={e => onChange(e.target.value)}
        />

        {!isVerifiedEmail && value && (
          <ButtonVerify
            width={'50px'}
            height={'24px'}
            disabled={hasError || disabled}
            onClick={e => {
              e.preventDefault()
              showVerifyModal?.()
            }}
          >
            <Trans>Verify</Trans>
          </ButtonVerify>
        )}
        {isVerifiedEmail && value && !hasError && <CheckIcon color={theme.primary} />}
      </InputWrapper>
    </Tooltip>
  )
}

export default function InputEmailWithVerification(
  props: Props & {
    isShowVerify: boolean
    onDismissVerifyModal: () => void
    sendCodeFn?: (data: { email: string }) => Promise<any>
    verifyCodeFn?: (data: { email: string; code: string }) => Promise<void>
    getErrorMsgFn?: (err: any) => string
  },
) {
  const { value, isShowVerify, onDismissVerifyModal, sendCodeFn, verifyCodeFn, getErrorMsgFn } = props
  return (
    <>
      <InputEmail {...props} />
      <VerifyCodeModal
        isOpen={isShowVerify}
        onDismiss={onDismissVerifyModal}
        email={value}
        sendCodeFn={sendCodeFn}
        verifyCodeFn={verifyCodeFn}
        getErrorMsgFn={getErrorMsgFn}
      />
    </>
  )
}
