import { t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import Tooltip from 'components/Tooltip'
import { MAX_DEGEN_SLIPPAGE_IN_BIPS, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useDefaultSlippageByPair } from 'state/swap/hooks'
import { useDegenModeManager } from 'state/user/hooks'
import { formatSlippage } from 'utils/slippage'

const parseSlippageInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)
const getSlippageText = (rawSlippage: number, options: number[]) => {
  const isCustom = !options.includes(rawSlippage)
  if (!isCustom) {
    return ''
  }

  return formatSlippage(rawSlippage, false)
}

const EmojiContainer = styled.span`
  flex: 0 0 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
        display: none;
  `}
`

const slippageOptionCSS = css`
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

  &[data-warning='true'] {
    border-color: ${({ theme }) => theme.warning};
  }
`

const CustomSlippageOption = styled.div`
  ${slippageOptionCSS};

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

  &[data-warning='true'] {
    border-color: ${({ theme }) => theme.warning};

    ${EmojiContainer} {
      color: ${({ theme }) => theme.warning};
    }
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
  rawSlippage: number
  setRawSlippage: (value: number) => void
  isWarning: boolean
  isHighlight?: boolean
  options: number[]
}
const CustomSlippageInput: React.FC<Props> = ({ options, rawSlippage, setRawSlippage, isWarning }) => {
  const [tooltip, setTooltip] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { mixpanelHandler } = useMixpanel()
  const [isDegenMode] = useDegenModeManager()

  const defaultRawSlippage = useDefaultSlippageByPair()

  // rawSlippage = 10
  // slippage shown to user: = 10 / 10_000 = 0.001 = 0.1%
  const [rawText, setRawText] = useState(getSlippageText(rawSlippage, options))

  const isCustomOptionActive = !options.includes(rawSlippage)

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTooltip('')
    const value = e.target.value

    if (value === '') {
      setRawText(value)
      setRawSlippage(defaultRawSlippage)
      return
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/
    if (!value.match(numberRegex)) {
      e.preventDefault()
      return
    }

    const parsedValue = parseSlippageInput(value)
    if (Number.isNaN(parsedValue)) {
      e.preventDefault()
      return
    }

    const maxSlippage = isDegenMode ? MAX_DEGEN_SLIPPAGE_IN_BIPS : MAX_NORMAL_SLIPPAGE_IN_BIPS
    if (parsedValue > maxSlippage) {
      const format = formatSlippage(maxSlippage)
      setTooltip(t`Max is ${format}`)
      e.preventDefault()
      return
    }

    setRawText(value)
    setRawSlippage(parsedValue)
  }

  const handleCommitChange = () => {
    setTooltip('')
    setRawText(getSlippageText(rawSlippage, options))
    mixpanelHandler(MIXPANEL_TYPE.SLIPPAGE_CHANGED, { new_slippage: Number(formatSlippage(rawSlippage, false)) })
  }

  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setRawText(getSlippageText(rawSlippage, options))
      setTooltip('')
    }
  }, [rawSlippage, options])

  return (
    <Flex sx={{ flex: 1 }}>
      <Tooltip text={tooltip} show={!!tooltip} placement="bottom" width="fit-content">
        <CustomSlippageOption data-active={isCustomOptionActive} data-warning={isCustomOptionActive && isWarning}>
          {isCustomOptionActive && isWarning && (
            <EmojiContainer>
              <span role="img" aria-label="warning">
                ⚠️
              </span>
            </EmojiContainer>
          )}
          <CustomInput
            ref={inputRef}
            placeholder={t`Custom`}
            value={rawText}
            onChange={handleChangeInput}
            onBlur={handleCommitChange}
          />
          <Text
            as="span"
            sx={{
              flex: '0 0 12px',
            }}
          >
            %
          </Text>
        </CustomSlippageOption>
      </Tooltip>
    </Flex>
  )
}

export default CustomSlippageInput
