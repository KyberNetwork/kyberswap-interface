import { Trans } from '@lingui/macro'
import { Check } from 'react-feather'
import styled, { css } from 'styled-components'

import { ButtonLight } from 'components/Button'
import { Input } from 'components/Input'
import useTheme from 'hooks/useTheme'

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

const InputWrapper = styled.div<{ isInNotificationCenter: boolean }>`
  position: relative;
  ${({ isInNotificationCenter }) =>
    isInNotificationCenter &&
    css`
      max-width: 50%;
      ${({ theme }) => theme.mediaWidth.upToMedium`
        max-width: 100%;
      `}
    `};
`

export default function InputEmail({
  errorColor,
  isInNotificationCenter = false,
  value,
  onChange,
  isVerifiedEmail,
  showVerifyModal,
  disabled,
  hasError,
}: {
  errorColor?: string
  onChange: (val: string) => void
  isInNotificationCenter?: boolean
  isVerifiedEmail: boolean
  value: string
  disabled?: boolean
  hasError?: boolean
  showVerifyModal: () => void
}) {
  // todo refactor props
  const theme = useTheme()
  // todo rename isInNotificationCenter
  return (
    <InputWrapper isInNotificationCenter={isInNotificationCenter}>
      <Input
        disabled={disabled}
        $borderColor={errorColor}
        value={value}
        placeholder="example@email.com"
        onChange={e => onChange(e.target.value)}
      />
      {!isVerifiedEmail && value && (
        <ButtonVerify width={'50px'} height={'24px'} disabled={hasError || disabled} onClick={showVerifyModal}>
          <Trans>Verify</Trans>
        </ButtonVerify>
      )}
      {isVerifiedEmail && <CheckIcon color={theme.primary} />}
    </InputWrapper>
  )
}
