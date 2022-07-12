import React, { useState, useEffect, useRef } from 'react'
import { t, Trans } from '@lingui/macro'
import styled from 'styled-components'
import { isMobile } from 'react-device-detect'
import { Flex, Button, Text, Box } from 'rebass'

import QuestionHelper from 'components/QuestionHelper'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { MAX_SLIPPAGE_IN_BIPS } from 'constants/index'
import useTheme from 'hooks/useTheme'

const DefaultSlippages = [10, 50, 100]

const parseSlippageInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)

// isValid = true means it's OK to process with the number with an extra parse
// isValid = true with message means warning
// isValid = false with/without message means error
const validateSlippageInput = (str: string): { isValid: boolean; message?: string } => {
  if (str === '') {
    return {
      isValid: true,
    }
  }

  const numberRegex = /^\s*([0-9]+)(\.\d+)?\s*$/
  if (!str.match(numberRegex)) {
    return {
      isValid: false,
      message: t`Enter a valid slippage percentage`,
    }
  }

  const rawSlippage = parseSlippageInput(str)
  if (Number.isNaN(rawSlippage)) {
    return {
      isValid: false,
      message: t`Enter a valid slippage percentage`,
    }
  }

  if (rawSlippage < 0) {
    return {
      isValid: false,
      message: t`Enter a valid slippage percentage`,
    }
  } else if (rawSlippage < 50) {
    return {
      isValid: true,
      message: t`Your transaction may fail`,
    }
  } else if (rawSlippage > MAX_SLIPPAGE_IN_BIPS) {
    return {
      isValid: false,
      message: t`Enter a smaller slippage percentage`,
    }
  } else if (rawSlippage > 500) {
    return {
      isValid: true,
      message: t`Your transaction may be frontrun`,
    }
  }

  return {
    isValid: true,
  }
}

type Props = {
  className?: string
}

const SlippageSetting: React.FC<Props> = ({ className }) => {
  const theme = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)

  // rawSlippage = 10
  // slippage = 10 / 10_000 = 0.001 = 0.1%
  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()
  const [slippageInput, setSlippageInput] = useState('')

  const { isValid, message } = validateSlippageInput(slippageInput)

  const isWarning = isValid && !!message
  const isError = !isValid

  const handleCommitChange = () => {
    if (!isValid || slippageInput === '') {
      return
    }

    const newRawSlippage = parseSlippageInput(slippageInput)
    if (Number.isNaN(newRawSlippage)) {
      return
    }

    setRawSlippage(newRawSlippage)

    // cannot 100% rely on the useEffect below as:
    // input = 3.2 => newRawSlippage = 320
    // input = 3.200003 => newRawSlippage = 320
    // in that case, the useEffect is not trigged, need to do this manually
    if (!DefaultSlippages.includes(newRawSlippage)) {
      setSlippageInput((newRawSlippage / 100).toFixed(2))
    } else {
      setSlippageInput('')
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitChange()
      inputRef.current?.blur()
    }
  }

  // this is to update the slippageInput when rawSlippage changes
  useEffect(() => {
    if (!DefaultSlippages.includes(rawSlippage)) {
      setSlippageInput((rawSlippage / 100).toFixed(2))
    } else {
      setSlippageInput('')
    }
  }, [rawSlippage])

  return (
    <Flex
      className={className}
      sx={{
        flexDirection: 'column',
        rowGap: '8px',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
        }}
      >
        <Text
          sx={{
            fontSize: isMobile ? '14px' : '12px',
            color: theme.text,
            fontWeight: 400,
            lineHeight: '16px',
          }}
        >
          <Trans>Max Slippage</Trans>
        </Text>
        <QuestionHelper
          text={t`Transaction will revert if there is an adverse rate change that is higher than this %`}
        />
      </Flex>

      <Flex
        sx={{
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '100%',
          height: '28px',
          borderRadius: '20px',
          background: theme.buttonBlack,
          padding: '2px',
        }}
      >
        {DefaultSlippages.map(slp => (
          <Button
            key={slp}
            className="slippageOption"
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(slp)
            }}
            data-active={rawSlippage === slp}
          >
            {slp / 100}%
          </Button>
        ))}

        <Box
          className="slippageOption inputOption"
          data-active={!DefaultSlippages.includes(rawSlippage)}
          data-warning={isWarning}
          data-error={isError}
        >
          {isWarning && (
            <span className="emojiContainer">
              <span role="img" aria-label="warning">
                ⚠️
              </span>
            </span>
          )}
          <input
            ref={inputRef}
            placeholder={(rawSlippage / 100).toFixed(2)}
            value={slippageInput}
            onChange={e => setSlippageInput(e.target.value)}
            onBlur={handleCommitChange}
            onKeyUp={handleKeyUp}
          />
          <span className="percent">%</span>
        </Box>
      </Flex>

      {!!message && (
        <Box data-warning={isWarning} data-error={isError} className="message">
          {message}
        </Box>
      )}
    </Flex>
  )
}

export default styled(SlippageSetting)`
  .slippageOption {
    flex: 0 0 24%;
    height: 100%;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 20px;

    background-color: ${({ theme }) => theme.buttonBlack};
    color: ${({ theme }) => theme.subText};
    text-align: center;

    font-size: 12px;
    font-weight: 400;
    line-height: 16px;

    outline: none;
    cursor: pointer;

    :hover {
      border: 1px solid ${({ theme }) => theme.bg4};
    }
    :focus {
      border: 1px solid ${({ theme }) => theme.primary};
    }

    &[data-active='true'] {
      background-color: ${({ theme }) => theme.background};
      color: ${({ theme }) => theme.text};

      font-weight: 500;
    }
  }

  .inputOption {
    display: inline-flex;
    align-items: center;
    padding: 0 4px;
    column-gap: 2px;

    .emojiContainer {
      flex: 0 0 12px;
      ${({ theme }) => theme.mediaWidth.upToSmall`
        display: none;
      `}
    }

    input {
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
    }

    .percent {
      flex: 0 0 12px;
    }
  }

  .inputOption {
    &[data-active='true'] {
      color: ${({ theme }) => theme.text};
      font-weight: 500;
    }

    &[data-warning='true'] {
      border: 1px solid;
      border-color: ${({ theme }) => theme.warning};
      .emojiContainer {
        color: ${({ theme }) => theme.warning};
      }
    }

    &[data-error='true'] {
      border: 1px solid;
      border-color: ${({ theme }) => theme.red1};
    }
  }

  .message {
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;

    &[data-warning='true'] {
      color: ${({ theme }) => theme.warning};
    }

    &[data-error='true'] {
      color: ${({ theme }) => theme.red1};
    }
  }
`
