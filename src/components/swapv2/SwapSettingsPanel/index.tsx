import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import Toggle from 'components/Toggle'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import useTheme from 'hooks/useTheme'
import { useShowTradeRoutes, useToggleTradeRoutes } from 'state/user/hooks'

import DegenModeSetting from './DegenModeSetting'
import GasPriceTrackerSetting from './GasPriceTrackerSetting'
import LiquiditySourcesSetting from './LiquiditySourcesSetting'
import SlippageSetting from './SlippageSetting'
import TransactionTimeLimitSetting from './TransactionTimeLimitSetting'

type Props = {
  className?: string
  onBack: () => void
  onClickGasPriceTracker: () => void
  onClickLiquiditySources: () => void
  isSwapPage?: boolean
  isCrossChainPage?: boolean
}

const BackText = styled.span`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const SettingsPanel: React.FC<Props> = ({
  isSwapPage,
  isCrossChainPage,
  className,
  onBack,
  onClickLiquiditySources,
  onClickGasPriceTracker,
}) => {
  const theme = useTheme()

  const [showConfirmation, setShowConfirmation] = useState(false)
  const isShowTradeRoutes = useShowTradeRoutes()
  const toggleTradeRoutes = useToggleTradeRoutes()

  return (
    <Box width="100%" className={className} id={TutorialIds.TRADING_SETTING_CONTENT}>
      <Flex width={'100%'} flexDirection={'column'} marginBottom="4px">
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <ChevronLeft onClick={onBack} color={theme.subText} cursor={'pointer'} size={26} />
          <BackText>{t`Settings`}</BackText>
        </Flex>

        <Flex
          sx={{
            marginTop: '22px',
            flexDirection: 'column',
            rowGap: '12px',
            width: '100%',
          }}
        >
          {(isSwapPage || isCrossChainPage) && (
            <>
              <span className="settingTitle">
                <Trans>Advanced Settings</Trans>
              </span>

              <SlippageSetting />
              {isSwapPage && <TransactionTimeLimitSetting />}
              <DegenModeSetting showConfirmation={showConfirmation} setShowConfirmation={setShowConfirmation} />
              {isSwapPage && (
                <>
                  <GasPriceTrackerSetting onClick={onClickGasPriceTracker} />
                  <LiquiditySourcesSetting onClick={onClickLiquiditySources} />
                </>
              )}
            </>
          )}

          <Flex
            sx={{
              flexDirection: 'column',
              rowGap: '12px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <Text
              as="span"
              sx={{
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              <Trans>Display Settings</Trans>
            </Text>
            <AutoColumn gap="md">
              {(isSwapPage || isCrossChainPage) && (
                <RowBetween>
                  <RowFixed>
                    <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
                      <MouseoverTooltip text={<Trans>Turn on to display trade route.</Trans>} placement="right">
                        <Trans>Trade Route</Trans>
                      </MouseoverTooltip>
                    </TextDashed>
                  </RowFixed>
                  <Toggle isActive={isShowTradeRoutes} toggle={toggleTradeRoutes} />
                </RowBetween>
              )}
            </AutoColumn>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  )
}

export default styled(SettingsPanel)`
  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};
    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.2)};
    }
  }
`
