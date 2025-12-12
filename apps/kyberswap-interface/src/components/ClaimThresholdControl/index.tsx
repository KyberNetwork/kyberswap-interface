import { rgba } from 'polished'
import React, { useEffect } from 'react'
import styled, { css } from 'styled-components'

import CustomClaimThresholdInput from './CustomClaimThresholdInput'

const Container = styled.div`
  display: flex;
  align-items: stretch;
  height: 36px;
  border-radius: 20px;
  border: ${({ theme }) => `1px solid ${theme.border}`};
`

const optionButtonCSS = css`
  height: 100%;
  padding: 0 12px;
  border-radius: 20px;
  border-color: transparent;

  background-color: transparent;
  color: ${({ theme }) => theme.subText};
  text-align: center;

  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  cursor: pointer;
  outline: none;

  &:hover {
    background-color: ${({ theme }) => rgba(theme.tabActive, 0.8)};
  }

  &[data-active='true'] {
    background-color: ${({ theme }) => theme.tabActive};
    color: ${({ theme }) => theme.text};
    font-weight: 500;
  }
`

const OptionButton = styled.button`
  ${optionButtonCSS};
  flex: 1;
`

const DEFAULT_CLAIM_THRESHOLD_OPTIONS = [0, 5, 10, 50]

type Props = {
  value?: number
  onChange?: (value: number) => void
  options?: number[]
}

const ClaimThresholdControl: React.FC<Props> = ({ value, onChange, options = DEFAULT_CLAIM_THRESHOLD_OPTIONS }) => {
  const [isCustom, setIsCustom] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(0)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value ?? null : internalValue

  useEffect(() => {
    setIsCustom(false)
  }, [options])

  const handleValueChange = (next: number) => {
    setInternalValue(next)
    onChange?.(next)
  }

  return (
    <Container>
      {options.map(option => (
        <OptionButton
          type="button"
          key={option}
          onClick={() => {
            handleValueChange(option)
            setIsCustom(false)
          }}
          data-active={option === currentValue && !isCustom}
        >
          ${option}
        </OptionButton>
      ))}
      <CustomClaimThresholdInput
        value={currentValue}
        onChange={nextValue => {
          handleValueChange(nextValue || 0)
          setIsCustom(nextValue !== null)
        }}
        isCustom={isCustom}
        maxDecimalDigits={4}
        maxIntegerDigits={4}
      />
    </Container>
  )
}

export default ClaimThresholdControl
