import { Trans, t } from '@lingui/macro'
import React, { useState } from 'react'
import { ChevronLeft } from 'react-feather'

import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import { TextDashed } from 'components/Text'
import Toggle from 'components/Toggle'
import { MouseoverTooltip } from 'components/Tooltip'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { CrossChainSourceSetting } from 'components/swapv2/SwapSettingsPanel/CrossChainSourceSetting'
import DegenModeSetting from 'components/swapv2/SwapSettingsPanel/DegenModeSetting'
import LiquiditySourcesSetting from 'components/swapv2/SwapSettingsPanel/LiquiditySourcesSetting'
import SlippageSetting from 'components/swapv2/SwapSettingsPanel/SlippageSetting'
import TransactionTimeLimitSetting from 'components/swapv2/SwapSettingsPanel/TransactionTimeLimitSetting'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import {
  useShowPricingChart,
  useShowTradeRoutes,
  useSuccessSoundEnabled,
  useTogglePricingChart,
  useToggleSuccessSound,
  useToggleTradeRoutes,
  useUserSlippageTolerance,
} from 'state/user/hooks'
import { cn } from 'utils/cn'

type Props = {
  className?: string
  onBack: () => void
  onClickLiquiditySources: () => void
  onClickCrossChainSources: () => void
  isSwapPage?: boolean
  isCrossChainPage?: boolean
  displaySettings?: {
    isShowPricingChart?: boolean
    isShowTradeRoutes?: boolean
    togglePricingChart?: () => void
    toggleTradeRoutes?: () => void
  }
}

const SettingsPanel: React.FC<Props> = ({
  isSwapPage,
  isCrossChainPage,
  className,
  onBack,
  onClickLiquiditySources,
  onClickCrossChainSources,
  displaySettings,
}) => {
  const { trackingHandler } = useTracking()
  const [slippage] = useUserSlippageTolerance()

  const [showConfirmation, setShowConfirmation] = useState(false)
  const globalShowPricingChart = useShowPricingChart()
  const globalShowTradeRoutes = useShowTradeRoutes()
  const isSuccessSoundEnabled = useSuccessSoundEnabled()
  const globalTogglePricingChart = useTogglePricingChart()
  const globalToggleTradeRoutes = useToggleTradeRoutes()
  const toggleSuccessSound = useToggleSuccessSound()
  const isShowPricingChart = displaySettings?.isShowPricingChart ?? globalShowPricingChart
  const isShowTradeRoutes = displaySettings?.isShowTradeRoutes ?? globalShowTradeRoutes
  const togglePricingChart = displaySettings?.togglePricingChart ?? globalTogglePricingChart
  const toggleTradeRoutes = displaySettings?.toggleTradeRoutes ?? globalToggleTradeRoutes

  return (
    <div className={cn('w-full', className)} id={TutorialIds.TRADING_SETTING_CONTENT}>
      <div className="mb-1 flex w-full flex-col">
        <div className="flex items-center gap-1">
          <ChevronLeft
            onClick={() => {
              if (isCrossChainPage) {
                trackingHandler(TRACKING_EVENT_TYPE.CC_SETTINGS_SAVED, {
                  current_max_slippage: slippage / 100,
                })
              }
              onBack()
            }}
            className="text-subText"
            cursor={'pointer'}
            size={26}
          />
          <span className="text-xl font-medium text-text">{t`Settings`}</span>
        </div>

        <div className="mt-[22px] flex w-full flex-col gap-3">
          {(isSwapPage || isCrossChainPage) && (
            <>
              <span className="settingTitle">
                <Trans>Advanced Settings</Trans>
              </span>

              <SlippageSetting />
              {isSwapPage && <TransactionTimeLimitSetting />}
              <DegenModeSetting showConfirmation={showConfirmation} setShowConfirmation={setShowConfirmation} />
              {isSwapPage && <LiquiditySourcesSetting onClick={onClickLiquiditySources} />}
              {isCrossChainPage && <CrossChainSourceSetting onClick={onClickCrossChainSources} />}
            </>
          )}

          {isSwapPage && (
            <div className="flex flex-col gap-3 border-t border-solid border-border pt-4">
              <span className="text-base font-medium">
                <Trans>Display Settings</Trans>
              </span>
              <AutoColumn className="gap-3">
                {isSwapPage && (
                  <RowBetween>
                    <RowFixed>
                      <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                        <MouseoverTooltip text={<Trans>Turn on to display pricing chart.</Trans>} placement="right">
                          <Trans>Pricing Chart</Trans>
                        </MouseoverTooltip>
                      </TextDashed>
                    </RowFixed>
                    <Toggle isActive={isShowPricingChart} toggle={togglePricingChart} className="bg-buttonBlack" />
                  </RowBetween>
                )}
                {(isSwapPage || isCrossChainPage) && (
                  <RowBetween>
                    <RowFixed>
                      <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                        <MouseoverTooltip text={<Trans>Turn on to display trade route.</Trans>} placement="right">
                          <Trans>Trade Route</Trans>
                        </MouseoverTooltip>
                      </TextDashed>
                    </RowFixed>
                    <Toggle isActive={isShowTradeRoutes} toggle={toggleTradeRoutes} className="bg-buttonBlack" />
                  </RowBetween>
                )}
                <RowBetween>
                  <RowFixed>
                    <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                      <MouseoverTooltip text={<Trans>Turn on to play success sound.</Trans>} placement="right">
                        <Trans>Sound</Trans>
                      </MouseoverTooltip>
                    </TextDashed>
                  </RowFixed>
                  <Toggle isActive={isSuccessSoundEnabled} toggle={toggleSuccessSound} className="bg-buttonBlack" />
                </RowBetween>
              </AutoColumn>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
