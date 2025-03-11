import { t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Tooltip from 'components/Tooltip'
import { DEFAULT_TIPS, MAX_FEE_IN_BIPS } from 'constants/index'
import { formatSlippage } from 'utils/slippage'

const parseTipInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)

const getFeeText = (fee: number) => {
  const isCustom = !DEFAULT_TIPS.includes(fee)
  if (!isCustom) {
    return ''
  }
  return formatSlippage(fee, false)
}

const feeOptionCSS = css`
  height: 100%;
  padding: 0;
  border-radius: 20px;
  border: 1px solid transparent;

  background-color: ${({ theme }) => theme.tabBackground};
  color: ${({ theme }) => theme.subText};
  text-align: center;

  font-size: 12px;
  font-weight: 400;
  line-height: 16px;

  outline: none;
  cursor: pointer;

  :hover {
    border-color: ${({ theme }) => theme.bg4};
  }
  :focus {
    border-color: ${({ theme }) => theme.bg4};
  }

  &[data-active='true'] {
    background-color: ${({ theme }) => theme.tabActive};
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.primary};

    font-weight: 500;
  }
`

const CustomFeeOption = styled.div`
  ${feeOptionCSS};

  flex: 0 0 24%;

  display: inline-flex;
  align-items: center;
  padding: 0 4px;
  column-gap: 2px;
  flex: 1;

  transition: all 150ms linear;

  &[data-active='true'] {
    color: ${({ theme }) => theme.text};
    font-weight: 500;
  }
`

const CustomInput = styled.input`
  width: 100%;
  height: 100%;
  border: 0px;
  border-radius: inherit;

  color: inherit;
  background: transparent;
  outline: none;
  text-align: right;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  &::placeholder {
    font-size: 12px;
  }
  @media only screen and (max-width: 375px) {
    font-size: 10px;
  }
`

export type Props = {
  fee: number
  onFeeChange: (value: number) => void
}

const CustomFeeInput = ({ fee, onFeeChange }: Props) => {
  const [text, setText] = useState(getFeeText(fee))
  const [tooltip, setTooltip] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isCustomOptionActive = !DEFAULT_TIPS.includes(fee)

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTooltip('')
    const value = e.target.value

    if (value === '') {
      setText(value)
      onFeeChange(50)
      return
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/
    if (!value.match(numberRegex)) {
      e.preventDefault()
      return
    }

    const parsedValue = parseTipInput(value)
    if (Number.isNaN(parsedValue)) {
      e.preventDefault()
      return
    }

    const maxCustomFee = MAX_FEE_IN_BIPS
    if (parsedValue > maxCustomFee) {
      const format = formatSlippage(maxCustomFee)
      setTooltip(t`Max is ${format}`)
      e.preventDefault()
      return
    }

    setText(value)
    onFeeChange(parsedValue)
  }

  const handleCommitChange = () => {
    setTooltip('')
    setText(getFeeText(fee))
  }

  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setText(getFeeText(fee))
    }
  }, [fee])

  return (
    <Tooltip text={tooltip} show={!!tooltip} placement="bottom" width="fit-content">
      <CustomFeeOption data-active={isCustomOptionActive}>
        <CustomInput
          ref={inputRef}
          placeholder={t`Custom`}
          value={text}
          onChange={handleChangeInput}
          onBlur={handleCommitChange}
        />
        <Text as="span" sx={{ flex: '0 0 12px' }}>
          %
        </Text>
      </CustomFeeOption>
    </Tooltip>
  )
}

export default CustomFeeInput
