import { Trans } from '@lingui/macro'
import React, { useMemo } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import SlippageControl from 'components/SlippageControl'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import PinButton from 'components/swapv2/SwapSettingsPanel/PinButton'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOTALITY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { usePairCategory } from 'state/swap/hooks'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { SLIPPAGE_STATUS, SLIPPAGE_WARNING_MESSAGES, checkRangeSlippage } from 'utils/slippage'

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

type Props = {
  shouldShowPinButton?: boolean
}

const SlippageSetting: React.FC<Props> = ({ shouldShowPinButton = true }) => {
  const { rawSlippage, setRawSlippage, isSlippageControlPinned, togglePinSlippage } = useSlippageSettingByPage()

  const cat = usePairCategory()

  const options = useMemo(
    () => (cat === 'highVolatilityPair' ? DEFAULT_SLIPPAGES_HIGH_VOTALITY : DEFAULT_SLIPPAGES),
    [cat],
  )

  const slippageStatus = checkRangeSlippage(rawSlippage, cat)
  const isWarning = slippageStatus !== SLIPPAGE_STATUS.NORMAL
  const msg = SLIPPAGE_WARNING_MESSAGES[slippageStatus]?.[cat] || ''
  const theme = useTheme()

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
        <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
          <MouseoverTooltip
            text={
              <Text>
                <Trans>
                  During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                  <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage">
                    here ↗
                  </ExternalLink>
                  .
                </Trans>
              </Text>
            }
            placement="right"
          >
            <Trans>Max Slippage</Trans>
          </MouseoverTooltip>
        </TextDashed>

        {shouldShowPinButton && <PinButton isActive={isSlippageControlPinned} onClick={togglePinSlippage} />}
      </Flex>

      <SlippageControl
        rawSlippage={rawSlippage}
        setRawSlippage={setRawSlippage}
        isWarning={isWarning}
        options={options}
      />

      {isWarning && (
        <Message data-warning={true} data-error={false}>
          Your slippage {msg}
        </Message>
      )}
    </Flex>
  )
}

export default SlippageSetting
