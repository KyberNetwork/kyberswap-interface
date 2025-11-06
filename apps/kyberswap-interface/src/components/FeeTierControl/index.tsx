import { rgba } from 'polished'
import React from 'react'
import styled, { css } from 'styled-components'

import CustomFeeTierInput from './CustomFeeTierInput'

const Container = styled.div`
  display: flex;
  align-items: stretch;
  border-radius: 20px;
  border: ${({ theme }) => `1px solid ${theme.border}`};
  width: 100%;
  height: 36px;
`

const optionButtonCSS = css`
  height: 100%;
  padding: 0 12px;
  border-radius: 20px;
  border-color: transparent;

  background-color: transparent;
  color: ${({ theme }) => theme.subText};
  text-align: center;

  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  cursor: pointer;
  outline: none;

  &:hover {
    background-color: ${({ theme }) => rgba(theme.background, 0.6)};
  }

  &[data-active='true'] {
    background-color: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    font-weight: 500;
  }

  &:disabled,
  &[data-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const OptionButton = styled.button`
  ${optionButtonCSS};
  flex: 1;
`

const DEFAULT_FEE_OPTIONS = [0.1, 0.3, 0.5, 1]

type Props = {
  value: number
  onChange: (value: number) => void
  options?: number[]
  disabled?: boolean
  className?: string
}

const FeeTierControl: React.FC<Props> = ({ value, onChange, options = DEFAULT_FEE_OPTIONS, disabled, className }) => {
  const [isCustom, setIsCustom] = React.useState(false)

  return (
    <Container className={className}>
      {options.map(option => (
        <OptionButton
          type="button"
          key={option}
          onClick={() => {
            onChange(option)
            setIsCustom(false)
          }}
          data-active={option === value && !isCustom}
          data-disabled={disabled}
          disabled={disabled}
        >
          {option}%
        </OptionButton>
      ))}
      <CustomFeeTierInput
        value={value}
        onChange={value => {
          onChange(value)
          setIsCustom(true)
        }}
        isCustom={isCustom}
      />
    </Container>
  )
}

export default FeeTierControl
