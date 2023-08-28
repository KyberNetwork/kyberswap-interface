import { t } from '@lingui/macro'
import { darken, rgba } from 'polished'
import React, { ReactNode, useRef } from 'react'
import { ChevronDown, Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import { ButtonProps, Button as RebassButton } from 'rebass/styled-components'
import styled, { css } from 'styled-components'

import Loader from 'components/Loader'
import { MouseoverTooltip } from 'components/Tooltip'
import { ApprovalState } from 'hooks/useApproveCallback'

import { RowBetween } from '../Row'

const disabledBase = css`
  cursor: auto;
`
const disabledHoverBase = css`
  filter: none;
`
const Base = styled(RebassButton)<{
  color?: string
  padding?: string
  margin?: string
  width?: string
  height?: string
  borderRadius?: string
  altDisabledStyle?: boolean
  gap?: string
  $disabled?: boolean // use this for disabled button with MouseoverTooltip
}>`
  padding: ${({ padding }) => (padding ? padding : '12px')};
  width: ${({ width }) => (width ? width : '100%')};
  height: ${({ height }) => (height ? height : 'auto')};
  margin: ${({ margin }) => (margin ? margin : 'unset')};
  gap: ${({ gap }) => gap && gap};
  font-weight: 500;
  font-size: 14px;
  text-align: center;
  border-radius: ${({ borderRadius }) => (borderRadius ? borderRadius : '999px')};
  outline: none;
  border: 1px solid transparent;
  color: ${({ color }) => color || 'white'};
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  z-index: 1;

  &:hover {
    filter: brightness(0.8);
  }
  &:disabled {
    ${disabledBase}
  }
  ${({ $disabled }) => $disabled && disabledBase}

  &:hover {
    &:disabled {
      ${disabledHoverBase}
    }
    ${({ $disabled }) => $disabled && disabledHoverBase}
  }

  & > * {
    user-select: none;
  }
`

const disabledPrimary = css<{
  altDisabledStyle?: boolean
}>`
  background-color: ${({ theme, altDisabledStyle }) =>
    altDisabledStyle ? theme.primary : theme.buttonGray} !important;
  color: ${({ theme, altDisabledStyle }) => (altDisabledStyle ? 'white' : theme.border)};
  box-shadow: none !important;
  border: 1px solid transparent;
  outline: none;
  opacity: ${({ altDisabledStyle }) => (altDisabledStyle ? '0.7' : '1')};
`
export const ButtonPrimary = styled(Base)`
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.textReverse};
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.primary)};
    background-color: ${({ theme }) => darken(0.1, theme.primary)};
  }
  &:disabled {
    ${disabledPrimary}
  }
  ${({ $disabled }) => $disabled && disabledPrimary}
`

const disabledWarning = css`
  background-color: ${({ theme }) => rgba(theme.warning, 0.2)};
  cursor: auto;
  color: ${({ theme }) => theme.warning};
`
export const ButtonWarning = styled(Base)`
  background-color: ${({ theme }) => theme.warning};
  color: ${({ theme }) => theme.textReverse};
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.warning)};
    background-color: ${({ theme }) => darken(0.05, theme.warning)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.warning)};
    background-color: ${({ theme }) => darken(0.1, theme.warning)};
  }
  &:disabled {
    ${disabledWarning}
    background-color: ${({ theme }) => rgba(theme.warning, 0.2)};
    cursor: auto;
    color: ${({ theme }) => theme.warning};
  }
  ${({ $disabled }) => $disabled && disabledWarning}
`

const disabledLight = css`
  cursor: not-allowed;
  background-color: ${({ theme }) => `${theme.buttonGray}`};
  color: ${({ theme }) => theme.border};
  box-shadow: none;
  border: 1px solid transparent;
  outline: none;
`
export const ButtonLight = styled(Base)<{ color?: string; fontSize?: number }>`
  background-color: ${({ theme, color }) => `${color || theme.primary}4d`};
  min-width: unset;
  color: ${({ color, theme }) => color || theme.primary};
  font-size: ${({ fontSize }) => fontSize || 14}px;
  font-weight: 500;
  &:hover {
    background-color: ${({ theme, disabled, color }) => !disabled && darken(0.03, `${color || theme.primary}4d`)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme, disabled, color }) => !disabled && darken(0.05, `${color || theme.primary}4d`)};
    background-color: ${({ theme, disabled, color }) => !disabled && darken(0.05, `${color || theme.primary}4d`)};
  }
  :disabled {
    ${disabledLight}
  }
  ${({ $disabled }) => $disabled && disabledLight}
`

export const ButtonGray = styled(Base)`
  background-color: ${({ theme }) => theme.buttonGray};
  color: ${({ theme }) => theme.subText};
  font-size: 16px;
  font-weight: 500;
  &:focus {
    filter: brightness(0.9) !important;
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && theme.buttonGray};
    filter: brightness(0.8) !important;
  }
`

const disabledSecondary = css`
  opacity: 50%;
  cursor: auto;
`
export const ButtonSecondary = styled(Base)`
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  background-color: transparent;
  font-size: 16px;
  border-radius: 12px;
  padding: ${({ padding }) => (padding ? padding : '10px')};

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.primary};
    border: 1px solid ${({ theme }) => theme.primary};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.primary};
    border: 1px solid ${({ theme }) => theme.primary};
  }
  &:disabled {
    ${disabledSecondary}
  }
  ${({ $disabled }) => $disabled && disabledSecondary}

  a:hover {
    text-decoration: none;
  }
`

const disabledOutlined = css<{
  altDisabledStyle?: boolean
}>`
  color: ${({ theme, altDisabledStyle }) => (altDisabledStyle ? 'white' : theme.border)};
  cursor: auto;
  box-shadow: none;
  border: 1px solid ${({ theme, altDisabledStyle }) => (altDisabledStyle ? 'white' : theme.border)};
`
export const ButtonOutlined = styled(Base)<{ color?: string }>`
  border: 1px solid ${({ theme, color }) => color || theme.subText};
  background-color: transparent;
  color: ${({ theme, color }) => color || theme.subText};
  border-radius: 999px;
  font-size: 14px;
  &:focus {
    box-shadow: 0 0 0 1px ${({ theme, color }) => color || theme.subText};
  }
  &:hover {
    box-shadow: 0 0 0 1px ${({ theme, color }) => color || theme.subText};
  }
  &:active {
    box-shadow: 0 0 0 1px ${({ theme, color }) => color || theme.subText};
  }
  &:disabled {
    ${disabledOutlined}
  }
  ${({ $disabled }) => $disabled && disabledOutlined}
`

const disabledEmpty = css`
  opacity: 50%;
  cursor: not-allowed;
`
export const ButtonEmpty = styled(Base)`
  background-color: transparent;
  color: ${({ theme }) => theme.primary};
  display: flex;
  justify-content: center;
  align-items: center;

  &:disabled {
    ${disabledEmpty}
  }
  ${({ $disabled }) => $disabled && disabledEmpty}
`

const disabledConfirmed = css`
  cursor: auto;
`
const ButtonConfirmedStyle = styled(Base)`
  background-color: ${({ theme }) => rgba(theme.apr, 0.2)};
  color: ${({ theme }) => theme.green};

  &:disabled {
    ${disabledConfirmed}
  }
  ${({ $disabled }) => $disabled && disabledConfirmed}
`

const disabledError = css`
  opacity: 50%;
  cursor: auto;
  box-shadow: none;
  background-color: ${({ theme }) => theme.red};
  border: 1px solid ${({ theme }) => theme.red};
`
export const ButtonErrorStyle = styled(Base)`
  background-color: ${({ theme }) => theme.red};
  border: 1px solid ${({ theme }) => theme.red};

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.red)};
    background-color: ${({ theme }) => darken(0.05, theme.red)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.red)};
    background-color: ${({ theme }) => darken(0.1, theme.red)};
  }
  &:disabled {
    ${disabledError}
  }
  ${({ $disabled }) => $disabled && disabledError}
`

export function ButtonConfirmed({
  confirmed,
  altDisabledStyle,
  ...rest
}: { confirmed?: boolean; altDisabledStyle?: boolean } & ButtonProps) {
  if (confirmed) {
    return <ButtonConfirmedStyle {...rest} />
  } else {
    return <ButtonPrimary {...rest} altDisabledStyle={altDisabledStyle} />
  }
}

export function ButtonError({ error, warning, ...rest }: { error?: boolean; warning?: boolean } & ButtonProps) {
  if (error) {
    return <ButtonErrorStyle {...rest} />
  } else if (warning && !rest.disabled) {
    return <ButtonWarning {...rest} />
  } else {
    return <ButtonPrimary {...rest} />
  }
}

export function ButtonDropdownLight({
  disabled = false,
  children,
  ...rest
}: { disabled?: boolean; children?: React.ReactNode } & ButtonProps) {
  return (
    <ButtonOutlined {...rest} disabled={disabled}>
      <RowBetween>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </RowBetween>
    </ButtonOutlined>
  )
}

const BtnInfoWrapper = styled(ButtonConfirmed)`
  padding: 0;
  height: 44px;
  display: flex;
  align-items: center;
  width: 48%;
`
// button with info helper in side - in mobile verify to touch info icon => enlarge region for tooltip
export const ButtonWithInfoHelper = ({
  tooltipMsg,
  onClick,
  disabled,
  text,
  confirmed,
  loading,
}: {
  tooltipMsg: string
  onClick: (() => void) | undefined | (() => Promise<void>)
  disabled: boolean
  loading: boolean
  confirmed?: boolean
  text?: ReactNode
}) => {
  return (
    <BtnInfoWrapper disabled={disabled} altDisabledStyle={loading} confirmed={confirmed} onClick={onClick}>
      <MouseoverTooltip width="300px" text={tooltipMsg} disableTooltip={loading}>
        <Flex
          sx={{ alignItems: 'center', height: '44px', paddingRight: '8px', paddingLeft: '2px' }}
          onClick={e => e.stopPropagation()}
        >
          {loading ? <Loader stroke="white" /> : <Info size={20} />}
        </Flex>
      </MouseoverTooltip>
      <Text textAlign="left">{text}</Text>
    </BtnInfoWrapper>
  )
}

export const ButtonApprove = ({
  tooltipMsg,
  tokenSymbol,
  approval,
  approveCallback,
  disabled,
  forceApprove = false,
}: {
  tooltipMsg: string
  tokenSymbol: string | undefined
  approval: ApprovalState
  approveCallback: () => Promise<void>
  disabled: boolean
  forceApprove?: boolean
}) => {
  const loading = useRef(false)
  const approveWrap = () => {
    if (loading.current) return
    loading.current = true
    approveCallback()
      .catch(() => {
        // do nothing
      })
      .finally(() => {
        loading.current = false
      })
  }

  return (
    <ButtonWithInfoHelper
      loading={approval === ApprovalState.PENDING}
      tooltipMsg={tooltipMsg}
      disabled={disabled}
      onClick={approveWrap}
      confirmed={approval === ApprovalState.APPROVED && !forceApprove}
      text={approval === ApprovalState.PENDING ? t`Approving` : t`Approve ${tokenSymbol}`}
    />
  )
}
