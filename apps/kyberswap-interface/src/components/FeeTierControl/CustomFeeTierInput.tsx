import { rgba } from 'polished'
import React, { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'

const optionCSS = css`
  height: 100%;
  padding: 0 8px;
  border-radius: 20px;
  border-color: transparent;

  color: ${({ theme }) => theme.subText};
  text-align: center;

  font-size: 12px;
  font-weight: 400;
  line-height: 16px;

  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${({ theme }) => rgba(theme.background, 0.6)};
  }

  &[data-active='true'] {
    background-color: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.primary};
    font-weight: 500;
  }

  &[data-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CustomOption = styled.div`
  ${optionCSS};
  flex: 1;
  column-gap: 4px;
  cursor: text;
`

const CustomInput = styled.input`
  width: 54px;
  height: 100%;
  border: 0;
  padding: 4px 0px 4px 4px;
  background: transparent;
  color: inherit;
  outline: none;
  text-align: right;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  &::placeholder {
    color: inherit;
    opacity: 0.6;
  }
`

const formatPercentValue = (value: number) => {
  if (!Number.isFinite(value)) return ''
  const fixed = Number(value.toFixed(4))
  const text = fixed.toString()
  return text.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
}

type Props = {
  value: number | null
  onChange: (value: number) => void
  isCustom?: boolean
  disabled?: boolean
}

const CustomFeeTierInput: React.FC<Props> = ({ value, onChange, isCustom, disabled }) => {
  const [text, setText] = useState('')

  useEffect(() => {
    if (!isCustom || value === null) {
      setText('')
      return
    }
    setText(formatPercentValue(value))
  }, [isCustom, value])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const next = event.target.value

    if (next === '') {
      setText(next)
      return
    }

    const numberRegex = /^(\d{0,3})(\.\d{0,5})?$/
    if (!numberRegex.test(next)) return

    const parsed = Number(next)
    if (Number.isNaN(parsed)) return

    setText(next)
    onChange(parsed)
  }

  return (
    <CustomOption data-active={isCustom} data-disabled={disabled}>
      <CustomInput
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Custom"
        inputMode="decimal"
        disabled={disabled}
      />
      %
    </CustomOption>
  )
}

export default CustomFeeTierInput
