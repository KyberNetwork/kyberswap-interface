import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import { DEFAULT_TIPS } from 'constants/index'
import useTheme from 'hooks/useTheme'

import CustomFeeInput from './CustomFeeInput'

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

const DefaultFeeOption = styled.button`
  ${feeOptionCSS};
  flex: 0 0 18%;

  @media only screen and (max-width: 375px) {
    font-size: 10px;
    flex: 0 0 15%;
  }
`

const FeeControlGroup = () => {
  const theme = useTheme()
  const { feeAmount, enableTip } = useGetFeeConfig() ?? {}
  const [searchParams, setSearchParams] = useSearchParams()

  const [feeValue, setFee] = useState(Math.round(Number.parseFloat(feeAmount ?? '0')) || 0)

  useEffect(() => {
    if (enableTip) {
      searchParams.set('feeAmount', feeValue.toString())
      setSearchParams(searchParams)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableTip, feeValue])

  if (!enableTip) {
    return null
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        width: '100%',
        padding: '0 8px',
      }}
    >
      <Text color={theme.subText} fontSize={12} fontWeight={500}>
        Tip :
      </Text>
      <Text color={theme.text3} fontSize={12} fontWeight={500}>
        No hidden fees - Your optional tips support DEX Screener!
      </Text>

      <Flex
        sx={{
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '100%',
          height: '28px',
          borderRadius: '20px',
          background: theme.tabBackground,
          padding: '2px',
          marginTop: '8px',
        }}
      >
        {DEFAULT_TIPS.map(tip => (
          <DefaultFeeOption
            key={tip}
            onClick={() => {
              setFee(tip)
            }}
            data-active={tip === feeValue}
          >
            {tip ? `${tip / 100}%` : 'No tip'}
          </DefaultFeeOption>
        ))}
        <CustomFeeInput fee={feeValue} onFeeChange={setFee} />
      </Flex>
    </Flex>
  )
}

export default FeeControlGroup
