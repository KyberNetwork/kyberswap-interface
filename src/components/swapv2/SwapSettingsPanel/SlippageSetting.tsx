import { Trans, t } from '@lingui/macro'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { useDispatch } from 'react-redux'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import QuestionHelper from 'components/QuestionHelper'
import SlippageControl from 'components/SlippageControl'
import PinButton from 'components/swapv2/SwapSettingsPanel/PinButton'
import useTheme from 'hooks/useTheme'
import { useAppSelector } from 'state/hooks'
import { pinSlippageControl } from 'state/swap/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { checkRangeSlippage } from 'utils/slippage'

const Message = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;

  &[data-warning='true'] {
    color: ${({ theme }) => theme.warning};
  }

  &[data-error='true'] {
    color: ${({ theme }) => theme.red1};
  }
`

const SlippageSetting: React.FC = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()
  const { isValid, message } = checkRangeSlippage(rawSlippage)
  const isWarning = isValid && !!message
  const isError = !isValid

  const isSlippageControlPinned = useAppSelector(state => state.swap.isSlippageControlPinned)

  const handleClickPinSlippageControl = () => {
    dispatch(pinSlippageControl(!isSlippageControlPinned))
  }

  return (
    <Flex
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
          placement="top"
          text={t`Transaction will revert if there is an adverse rate change that is higher than this %. This control will appear in Swap form if pinned.`}
        />

        <PinButton isActive={isSlippageControlPinned} onClick={handleClickPinSlippageControl} />
      </Flex>

      <SlippageControl rawSlippage={rawSlippage} setRawSlippage={setRawSlippage} isWarning={isWarning} />

      {!!message && (
        <Message data-warning={isWarning} data-error={isError}>
          {message}
        </Message>
      )}
    </Flex>
  )
}

export default SlippageSetting
