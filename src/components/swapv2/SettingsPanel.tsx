import React, { useState } from 'react'
import styled from 'styled-components'
import { Flex, Box } from 'rebass'
import { ArrowLeft } from 'react-feather'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'

import QuestionHelper from '../QuestionHelper'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import {
  useExpertModeManager,
  useShowLiveChart,
  useShowTopTrendingSoonTokens,
  useShowTradeRoutes,
  useToggleLiveChart,
  useToggleTopTrendingTokens,
  useToggleTradeRoutes,
  useUserSlippageTolerance,
  useUserTransactionTTL,
  useShowTokenInfo,
  useToggleTokenInfo,
} from 'state/user/hooks'
import useTheme from 'hooks/useTheme'
import { useModalOpen, useToggleModal, useToggleTransactionSettingsMenu } from 'state/application/hooks'
import Toggle from 'components/Toggle'
import { ApplicationModal } from 'state/application/actions'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Tooltip from 'components/Tooltip'
import { isMobile } from 'react-device-detect'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork/useTopTrendingSoonTokensInCurrentNetwork'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { isEqual } from 'utils/numbers'
import { parseUnits } from '@ethersproject/units'
import { MAX_SLIPPAGE_IN_BIPS } from 'constants/index'
import TransactionTimeLimitSetting from './SettingsPanel/TransactionTimeLimitSetting'
import SlippageSetting from './SettingsPanel/SlippageSetting'

type Props = {
  className?: string
  onBack: () => void
}

const BackIconWrapper = styled(ArrowLeft)`
  height: 20px;
  width: 20px;
  margin-right: 10px;
  cursor: pointer;
  path {
    stroke: ${({ theme }) => theme.text} !important;
  }
`

const BackText = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const SettingsPanel: React.FC<Props> = ({ className, onBack }) => {
  const theme = useTheme()
  const shouldShowTrendingSoonSetting = true
  const isShowDisplaySettings = true
  const [userSlippageTolerance, setUserSlippageTolerance] = useUserSlippageTolerance()
  const [expertMode, toggleExpertMode] = useExpertModeManager()
  const [ttl, setTtl] = useUserTransactionTTL()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const toggle = useToggleTransactionSettingsMenu()
  const { mixpanelHandler } = useMixpanel()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfo = useShowTokenInfo()

  const isShowLiveChart = useShowLiveChart()
  const isShowMobileLiveChart = useModalOpen(ApplicationModal.MOBILE_LIVE_CHART)

  const isShowMobileTradeRoutes = useModalOpen(ApplicationModal.MOBILE_TRADE_ROUTES)
  const toggleLiveChart = useToggleLiveChart()
  const toggleMobileLiveChart = useToggleModal(ApplicationModal.MOBILE_LIVE_CHART)
  const toggleMobileTradeRoutes = useToggleModal(ApplicationModal.MOBILE_TRADE_ROUTES)
  const toggleTradeRoutes = useToggleTradeRoutes()
  const toggleTokenInfo = useToggleTokenInfo()
  const isShowTrendingSoonTokens = useShowTopTrendingSoonTokens()
  const toggleTopTrendingTokens = useToggleTopTrendingTokens()

  const handleToggleAdvancedMode = () => {
    if (expertMode) {
      toggleExpertMode()
      setShowConfirmation(false)
      return
    }

    toggle()
    setShowConfirmation(true)
  }

  const handleToggleLiveChart = () => {
    if (isMobile) {
      if (!isShowMobileLiveChart) {
        mixpanelHandler(MIXPANEL_TYPE.LIVE_CHART_ON_MOBILE)
      }
      toggleMobileLiveChart()
      return
    }

    mixpanelHandler(MIXPANEL_TYPE.LIVE_CHART_ON_OFF, { live_chart_on_or_off: !isShowLiveChart })
    toggleLiveChart()
  }

  const handleToggleTradeRoute = () => {
    if (isMobile) {
      if (!isShowMobileTradeRoutes) {
        mixpanelHandler(MIXPANEL_TYPE.TRADING_ROUTE_ON_MOBILE)
      }
      toggleMobileTradeRoutes()
    } else {
      mixpanelHandler(MIXPANEL_TYPE.TRADING_ROUTE_ON_OFF, {
        trading_route_on_or_off: !isShowTradeRoutes,
      })
      toggleTradeRoutes()
    }
  }

  return (
    <Box width="100%" className={className}>
      <Flex width={'100%'} flexDirection={'column'} marginBottom="4px">
        <Flex alignItems="center" marginBottom={20}>
          <BackIconWrapper onClick={onBack}></BackIconWrapper>
          <BackText>{t`Settings`}</BackText>
        </Flex>

        <Flex
          sx={{
            marginTop: '12px',
            flexDirection: 'column',
            rowGap: '12px',
            width: '100%',
          }}
        >
          <span className="settingTitle">
            <Trans>Advanced Settings</Trans>
          </span>

          <SlippageSetting />
          <TransactionTimeLimitSetting />

          <Flex justifyContent="space-between">
            <Flex width="fit-content" alignItems="center">
              <span className="settingLabel">
                <Trans>Advanced Mode</Trans>
              </span>
              <QuestionHelper text={t`Enables high slippage trades. Use at your own risk`} />
            </Flex>
            <Toggle id="toggle-expert-mode-button" isActive={expertMode} toggle={handleToggleAdvancedMode} />
          </Flex>

          {isShowDisplaySettings && (
            <Flex
              sx={{
                flexDirection: 'column',
                rowGap: '12px',
                borderTop: `1px solid ${theme.border}`,
                padding: '16px 0',
              }}
            >
              <span className="settingTitle">
                <Trans>Display Settings</Trans>
              </span>
              <AutoColumn gap="md">
                {shouldShowTrendingSoonSetting && (
                  <RowBetween>
                    <RowFixed>
                      <span className="settingLabel">Trending Soon</span>
                      <QuestionHelper text={t`Turn on to display tokens that could be trending soon`} />
                    </RowFixed>
                    <Toggle isActive={isShowTrendingSoonTokens} toggle={toggleTopTrendingTokens} />
                  </RowBetween>
                )}
                <RowBetween>
                  <RowFixed>
                    <span className="settingLabel">Live Chart</span>
                    <QuestionHelper text={t`Turn on to display live chart`} />
                  </RowFixed>
                  <Toggle
                    isActive={isMobile ? isShowMobileLiveChart : isShowLiveChart}
                    toggle={handleToggleLiveChart}
                  />
                </RowBetween>
                <RowBetween>
                  <RowFixed>
                    <span className="settingLabel">
                      <Trans>Trade Route</Trans>
                    </span>
                    <QuestionHelper text={t`Turn on to display trade route`} />
                  </RowFixed>
                  <Toggle
                    isActive={isMobile ? isShowMobileTradeRoutes : isShowTradeRoutes}
                    toggle={handleToggleTradeRoute}
                  />
                </RowBetween>

                <RowBetween>
                  <RowFixed>
                    <span className="settingLabel">
                      <Trans>Token Info</Trans>
                    </span>
                    <QuestionHelper text={t`Turn on to display token info`} />
                  </RowFixed>
                  <Toggle isActive={isShowTokenInfo} toggle={toggleTokenInfo} />
                </RowBetween>
              </AutoColumn>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}

export default styled(SettingsPanel)`
  .settingTitle {
    font-size: 16px;
    font-weight: 500;
  }

  .settingLabel {
    font-size: ${isMobile ? '14px' : '12px'};
    color: ${({ theme }) => theme.text};
    font-weight: 400;
    line-height: 20px;
  }

  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};
    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.2)};
    }
  }
`
