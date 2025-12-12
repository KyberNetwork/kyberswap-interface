import { rgba } from 'polished'
import React, { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'

const optionCSS = css`
  height: 100%;
  padding: 0 8px;
  border-radius: 20px;
  border-color: transparent;

  color: ${({ theme }) => theme.subText};
  text-align: center;

  font-size: 14px;
  font-weight: 400;
  line-height: 16px;

  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${({ theme }) => rgba(theme.tabActive, 0.8)};
  }

  &[data-active='true'] {
    background-color: ${({ theme }) => theme.tabActive};
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.primary};
    font-weight: 500;
  }
`

const CustomOption = styled.div`
  ${optionCSS};
  flex: 1;
  column-gap: 4px;
  cursor: text;
`

const CustomInput = styled.input`
  width: 60px;
  min-width: 0;
  height: 100%;
  border: 0;
  padding: 4px 0px;
  background: transparent;
  color: inherit;
  outline: none;
  text-align: center;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  &::placeholder {
    color: inherit;
    opacity: 0.6;
  }
`

export const formatThresholdValue = (value?: number) => {
  const number = (value ?? 0)
    .toString()
    .replace(/\.0+$/, '')
    .replace(/(\.\d*[1-9])0+$/, '$1')
  return '$' + number
}

type Props = {
  value: number | null
  onChange: (value: number | null) => void
  isCustom?: boolean
  placeholder?: string
  maxIntegerDigits?: number
  maxDecimalDigits?: number
}

const CustomClaimThresholdInput: React.FC<Props> = ({
  value,
  onChange,
  isCustom,
  placeholder = 'Custom',
  maxIntegerDigits = 6,
  maxDecimalDigits = 2,
}) => {
  const [text, setText] = useState('')

  const numberRegex = useMemo(() => {
    const decimalPattern = maxDecimalDigits > 0 ? `(\\.\\d{0,${maxDecimalDigits}})?` : ''
    return new RegExp(`^(\\d{0,${maxIntegerDigits}})${decimalPattern}$`)
  }, [maxDecimalDigits, maxIntegerDigits])

  useEffect(() => {
    if (!isCustom || value === null) {
      setText('')
      return
    }
    setText(formatThresholdValue(value))
  }, [isCustom, maxDecimalDigits, value])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.replace(/^\$/, '')

    if (next === '') {
      setText('')
      onChange(null)
      return
    }

    if (!numberRegex.test(next)) return

    setText(`$${next}`)
    onChange(+next)
  }

  return (
    <CustomOption data-active={isCustom}>
      <CustomInput
        type="text"
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        inputMode="decimal"
        step={1}
      />
    </CustomOption>
  )
}

export default CustomClaimThresholdInput
