import React, { useMemo } from 'react'
import styled, { css } from 'styled-components'

import CustomSlippageInput from 'components/SlippageControl/CustomSlippageInput'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOTALITY } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { usePairCategory } from 'state/swap/hooks'

import { Props as CustomSlippageInputProps } from './CustomSlippageInput'

const SlippageSettingElement = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  height: 28px;
  border-radius: 20px;
  background: ${({ theme }) => theme.tabBackground};
  padding: 2px;
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

export const DefaultSlippageOption = styled.button`
  ${slippageOptionCSS};
  flex: 1;

  @media only screen and (max-width: 375px) {
    font-size: 10px;
    flex: 0 0 15%;
  }
`

type Props = CustomSlippageInputProps
// rawSlippage = 10
// slippage = 10 / 10_000 = 0.001 = 0.1%
const SlippageControl: React.FC<Props> = props => {
  const { rawSlippage, setRawSlippage, isWarning, isHighlight } = props
  const { mixpanelHandler } = useMixpanel()
  const cat = usePairCategory()
  const options = useMemo(
    () =>
      props.options?.length
        ? props.options
        : cat === 'highVolatilityPair'
        ? DEFAULT_SLIPPAGES_HIGH_VOTALITY
        : DEFAULT_SLIPPAGES,
    [cat, props.options],
  )

  return (
    <SlippageSettingElement>
      {options.map(slp => (
        <DefaultSlippageOption
          key={slp}
          onClick={() => {
            setRawSlippage(slp)
            mixpanelHandler(MIXPANEL_TYPE.SLIPPAGE_CHANGED, { new_slippage: slp / 100 })
          }}
          data-active={rawSlippage === slp}
          data-warning={rawSlippage === slp && isWarning}
        >
          {slp / 100}%
        </DefaultSlippageOption>
      ))}

      <CustomSlippageInput data-highlight={isHighlight} {...props} options={options} />
    </SlippageSettingElement>
  )
}

export default SlippageControl
