import React from 'react'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import CustomSlippageInput from 'components/swapv2/SlippageControl/CustomSlippageInput'
import { DEFAULT_SLIPPAGES } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { checkRangeSlippage } from 'utils/slippage'

const shouldWarnSlippage = (slp: number) => {
  const { isValid, message } = checkRangeSlippage(slp)
  return isValid && !!message
}

export const slippageOptionCSS = css`
  height: 100%;
  padding: 0;
  border-radius: 20px;
  border: 1px solid transparent;

  background-color: ${({ theme }) => theme.tabBackgound};
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

const DefaultSlippageOption = styled.button`
  ${slippageOptionCSS};
  flex: 0 0 18%;

  @media only screen and (max-width: 375px) {
    font-size: 10px;
    flex: 0 0 15%;
  }
`

const SlippageControl: React.FC = () => {
  const theme = useTheme()

  // rawSlippage = 10
  // slippage = 10 / 10_000 = 0.001 = 0.1%
  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()

  const { mixpanelHandler } = useMixpanel()

  return (
    <Flex
      sx={{
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '100%',
        height: '28px',
        borderRadius: '20px',
        background: theme.tabBackgound,
        padding: '2px',
      }}
    >
      {DEFAULT_SLIPPAGES.map(slp => (
        <DefaultSlippageOption
          key={slp}
          onClick={() => {
            setRawSlippage(slp)
            mixpanelHandler(MIXPANEL_TYPE.SLIPPAGE_CHANGED, { new_slippage: slp / 100 })
          }}
          data-active={rawSlippage === slp}
          data-warning={rawSlippage === slp && shouldWarnSlippage(slp)}
        >
          {slp / 100}%
        </DefaultSlippageOption>
      ))}

      <CustomSlippageInput />
    </Flex>
  )
}

export default SlippageControl
