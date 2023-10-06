import { Trans, t } from '@lingui/macro'
import { Check } from 'react-feather'
import styled, { CSSProperties } from 'styled-components'

import { ButtonLight } from 'components/Button'
import Input from 'components/Input'
import Tooltip from 'components/Tooltip'
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

const InputWrapper = styled.div`
  position: relative;
`

export default function InputEmail({
  errorColor,
  value,
  onChange,
  isVerifiedEmail,
  showVerifyModal,
  disabled,
  hasError,
  color,
  style,
}: {
  errorColor?: string
  onChange: (val: string) => void
  isVerifiedEmail: boolean
  value: string
  disabled?: boolean
  hasError?: boolean
  showVerifyModal: () => void
  color?: string
  style?: CSSProperties
}) {
  const theme = useTheme()
  return (
    <Tooltip
      text={t`Invalid email address`}
      style={{ zIndex: 1 }}
      show={!!hasError}
      placement="top"
      width="fit-content"
    >
      <InputWrapper style={style}>
        <Input
          color={color}
          disabled={disabled}
          borderColor={errorColor}
          value={value}
          placeholder="example@email.com"
          onChange={e => onChange(e.target.value)}
        />

        {!isVerifiedEmail && value && (
          <ButtonVerify width={'50px'} height={'24px'} disabled={hasError || disabled} onClick={showVerifyModal}>
            <Trans>Verify</Trans>
          </ButtonVerify>
        )}
        {isVerifiedEmail && value && <CheckIcon color={theme.primary} />}
      </InputWrapper>
    </Tooltip>
  )
}
