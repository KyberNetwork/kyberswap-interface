import React, { useCallback, useContext, useRef, useState } from 'react'
import styled, { css, ThemeContext } from 'styled-components'
import { Flex, Text } from 'rebass'
import { ArrowLeft, X } from 'react-feather'
import { Trans, t } from '@lingui/macro'
import QuestionHelper from '../QuestionHelper'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { darken } from 'polished'
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
import Modal from 'components/Modal'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { ApplicationModal } from 'state/application/actions'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Tooltip from 'components/Tooltip'
import MenuFlyout from 'components/MenuFlyout'
import { isMobile } from 'react-device-detect'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork/useTopTrendingSoonTokensInCurrentNetwork'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { isEqual } from 'utils/numbers'
import { parseUnits } from '@ethersproject/units'
import { MAX_SLIPPAGE_IN_BIPS } from 'constants/index'
type Props = {
  className?: string
  onBack?: () => void
}

const StyledTitle = styled.div`
  font-size: ${isMobile ? '16px' : '16px'};
  font-weight: 500;
`

const StyledLabel = styled.div`
  font-size: ${isMobile ? '14px' : '12px'};
  color: ${({ theme }) => theme.text};
  font-weight: 400;
  line-height: 20px;
`

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
  const isShowTrendingSoonSetting = true
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

  return (
    <div className={className}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="4px">
        {onBack && (
          <Flex alignItems="center" marginRight={20}>
            <BackIconWrapper onClick={onBack}></BackIconWrapper>
            <BackText>{t`Info`}</BackText>
          </Flex>
        )}

        <div>
          {/* <SlippageTabs
            rawSlippage={userSlippageTolerance}
            setRawSlippage={setUserSlippageTolerance}
            deadline={ttl}
            setDeadline={setTtl}
          /> */}

          <RowBetween margin="14px 0">
            <RowFixed>
              <StyledLabel>
                <Trans>Advanced Mode</Trans>
              </StyledLabel>
              <QuestionHelper text={t`Enables high slippage trades. Use at your own risk`} />
            </RowFixed>
            <Toggle
              id="toggle-expert-mode-button"
              isActive={expertMode}
              toggle={
                expertMode
                  ? () => {
                      toggleExpertMode()
                      setShowConfirmation(false)
                    }
                  : () => {
                      toggle()
                      setShowConfirmation(true)
                    }
              }
              size={isMobile ? 'md' : 'sm'}
            />
          </RowBetween>
          {isShowDisplaySettings && (
            <>
              <StyledTitle style={{ borderTop: '1px solid ' + theme.border, padding: '16px 0' }}>
                <Trans>Display Settings</Trans>
              </StyledTitle>
              <AutoColumn gap="md">
                {isShowTrendingSoonSetting && (
                  <RowBetween>
                    <RowFixed>
                      <StyledLabel>Trending Soon</StyledLabel>
                      <QuestionHelper text={t`Turn on to display tokens that could be trending soon`} />
                    </RowFixed>
                    <Toggle
                      isActive={isShowTrendingSoonTokens}
                      toggle={() => {
                        toggleTopTrendingTokens()
                      }}
                      size={isMobile ? 'md' : 'sm'}
                    />
                  </RowBetween>
                )}
                <RowBetween>
                  <RowFixed>
                    <StyledLabel>Live Chart</StyledLabel>
                    <QuestionHelper text={t`Turn on to display live chart`} />
                  </RowFixed>
                  <Toggle
                    isActive={isMobile ? isShowMobileLiveChart : isShowLiveChart}
                    toggle={() => {
                      if (isMobile) {
                        if (!isShowMobileLiveChart) {
                          mixpanelHandler(MIXPANEL_TYPE.LIVE_CHART_ON_MOBILE)
                        }
                        toggleMobileLiveChart()
                      } else {
                        mixpanelHandler(MIXPANEL_TYPE.LIVE_CHART_ON_OFF, { live_chart_on_or_off: !isShowLiveChart })
                        toggleLiveChart()
                      }
                    }}
                    size={isMobile ? 'md' : 'sm'}
                  />
                </RowBetween>
                <RowBetween>
                  <RowFixed>
                    <StyledLabel>
                      <Trans>Trade Route</Trans>
                    </StyledLabel>
                    <QuestionHelper text={t`Turn on to display trade route`} />
                  </RowFixed>
                  <Toggle
                    isActive={isMobile ? isShowMobileTradeRoutes : isShowTradeRoutes}
                    toggle={() => {
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
                    }}
                    size={isMobile ? 'md' : 'sm'}
                  />
                </RowBetween>

                <RowBetween>
                  <RowFixed>
                    <StyledLabel>
                      <Trans>Token Info</Trans>
                    </StyledLabel>
                    <QuestionHelper text={t`Turn on to display token info`} />
                  </RowFixed>
                  <Toggle isActive={isShowTokenInfo} toggle={toggleTokenInfo} size={isMobile ? 'md' : 'sm'} />
                </RowBetween>
              </AutoColumn>
            </>
          )}
        </div>
      </Flex>
    </div>
  )
}

export default styled(SettingsPanel)`
  border-radius: 4px;
  width: 100%;
`
