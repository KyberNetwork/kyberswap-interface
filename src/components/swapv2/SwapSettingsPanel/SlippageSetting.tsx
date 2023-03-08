import { Trans, t } from '@lingui/macro'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import QuestionHelper from 'components/QuestionHelper'
import SlippageControl from 'components/swapv2/SlippageControl'
import useTheme from 'hooks/useTheme'
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
  const theme = useTheme()
  const [rawSlippage] = useUserSlippageTolerance()
  const { isValid, message } = checkRangeSlippage(rawSlippage)
  const isWarning = isValid && !!message
  const isError = !isValid

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
          text={t`Transaction will revert if there is an adverse rate change that is higher than this %`}
        />
      </Flex>

      <SlippageControl />

      {!!message && (
        <Message data-warning={isWarning} data-error={isError}>
          {message}
        </Message>
      )}
    </Flex>
  )
}

export default SlippageSetting
