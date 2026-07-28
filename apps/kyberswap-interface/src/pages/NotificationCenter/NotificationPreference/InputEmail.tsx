import { Trans, t } from '@lingui/macro'
import { CSSProperties } from 'react'
import { Check } from 'react-feather'

import { ButtonLight } from 'components/Button'
import Input from 'components/Input'
import Tooltip from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import VerifyCodeModal from 'pages/Verify/VerifyCodeModal'

type Props = {
  onChange: (val: string) => void
  isVerifiedEmail?: boolean
  value: string
  disabled?: boolean
  hasError?: boolean
  showVerifyModal?: () => void
  style?: CSSProperties
  inputClassName?: string
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
  inputClassName,
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
      <div className="relative" style={style}>
        <Input
          className={inputClassName}
          style={{ maxHeight: '100%' }}
          disabled={disabled}
          borderColor={hasError ? theme.red : theme.border}
          value={value}
          placeholder={placement || 'example@email.com'}
          onChange={e => onChange(e.target.value)}
        />

        {!isVerifiedEmail && value && (
          <ButtonLight
            width={'50px'}
            height={'24px'}
            disabled={hasError || disabled}
            onClick={e => {
              e.preventDefault()
              showVerifyModal?.()
            }}
            className="absolute inset-y-0 right-[13px] my-auto text-xs"
          >
            <Trans>Verify</Trans>
          </ButtonLight>
        )}
        {isVerifiedEmail && value && !hasError && (
          <Check className="absolute inset-y-0 right-[13px] my-auto text-primary" />
        )}
      </div>
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
