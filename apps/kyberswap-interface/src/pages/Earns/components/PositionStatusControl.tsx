import { rgba } from 'polished'
import React, { useState } from 'react'
import styled, { css } from 'styled-components'

import { PositionStatus as EarnPositionStatus } from 'pages/Earns/types'

export type PositionStatus = EarnPositionStatus | 'all'

export type PositionStatusOption = {
  label: string
  value: PositionStatus
}

const Container = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  height: 36px;
`

const optionButtonCSS = css`
  height: 100%;
  padding-inline: 22px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};

  background-color: transparent;
  color: ${({ theme }) => theme.subText};
  text-align: center;

  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  cursor: pointer;
  outline: none;

  &:hover {
    background-color: ${({ theme }) => theme.tabActive};
  }

  &[data-active='true'] {
    background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
    color: ${({ theme }) => theme.text};
    font-weight: 500;
    border-color: ${({ theme }) => rgba(theme.primary, 0.5)};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-inline: 12px;
    font-size: 12px;
  `}
`

const OptionButton = styled.button`
  ${optionButtonCSS};
`

export const POSITION_STATUS_OPTIONS: PositionStatusOption[] = [
  { label: 'All', value: 'all' },
  { label: 'In Range', value: EarnPositionStatus.IN_RANGE },
  { label: 'Out of Range', value: EarnPositionStatus.OUT_RANGE },
  { label: 'Closed', value: EarnPositionStatus.CLOSED },
]

type Props = {
  value?: PositionStatus
  onChange?: (value: PositionStatus) => void
  options?: PositionStatusOption[]
}

const PositionStatusControl: React.FC<Props> = ({ value, onChange, options = POSITION_STATUS_OPTIONS }) => {
  const [internalValue, setInternalValue] = useState<PositionStatus>(options[0].value)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value ?? options[0].value : internalValue

  const handleChange = (next: PositionStatus) => {
    setInternalValue(next)
    onChange?.(next)
  }

  return (
    <Container>
      {options.map(option => (
        <OptionButton
          type="button"
          key={option.value}
          onClick={() => handleChange(option.value)}
          data-active={option.value === currentValue}
        >
          {option.label}
        </OptionButton>
      ))}
    </Container>
  )
}

export default PositionStatusControl
