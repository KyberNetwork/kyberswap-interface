import { Trans, t } from '@lingui/macro'
import React, { ReactNode, Suspense, lazy, useState } from 'react'
import { ChevronLeft } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import { HStack, Stack } from 'components/Stack'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import DegenModeSetting from 'components/swapv2/SwapSettingsPanel/DegenModeSetting'
import LiquiditySourcesSetting from 'components/swapv2/SwapSettingsPanel/LiquiditySourcesSetting'
import SlippageSetting from 'components/swapv2/SwapSettingsPanel/SlippageSetting'
import TransactionTimeLimitSetting from 'components/swapv2/SwapSettingsPanel/TransactionTimeLimitSetting'
import {
  SettingsDivider,
  SettingsLabel,
  SettingsRow,
  SettingsSection,
  SettingsToggle,
} from 'components/swapv2/SwapSettingsPanel/components'
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

// CrossChainSourceSetting calls CrossChainSwapFactory.getAllAdapters(), which pulls the full cross-chain
// adapter stack (~569KB of LiFi / NEAR / Solana / Bitcoin SDK code). It renders only on cross-chain pages,
// so load it lazily to keep that stack out of the eager /swap and /limit settings-panel chunk.
const CrossChainSourceSetting = lazy(() =>
  import('components/swapv2/SwapSettingsPanel/CrossChainSourceSetting').then(m => ({
    default: m.CrossChainSourceSetting,
  })),
)

type Props = {
  onBack: () => void
  onClickLiquiditySources: () => void
  onClickCrossChainSources: () => void
  isSwapPage?: boolean
  isCrossChainPage?: boolean
  highlightDegenMode?: boolean
  displaySettings?: {
    isShowPricingChart?: boolean
    isShowTradeRoutes?: boolean
    togglePricingChart?: () => void
    toggleTradeRoutes?: () => void
  }
}

const DisplaySettingRow = ({
  label,
  tooltip,
  isActive,
  toggle,
}: {
  label: ReactNode
  tooltip: ReactNode
  isActive: boolean
  toggle: () => void
}) => (
  <SettingsRow>
    <SettingsLabel tooltip={tooltip}>{label}</SettingsLabel>
    <SettingsToggle isActive={isActive} toggle={toggle} />
  </SettingsRow>
)

const SettingsPanel: React.FC<Props> = ({
  isSwapPage,
  isCrossChainPage,
  highlightDegenMode,
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
    <Stack className="w-full gap-4" id={TutorialIds.TRADING_SETTING_CONTENT}>
      <HStack className="items-center gap-1">
        <IconButton
          aria-label={t`Back`}
          onClick={() => {
            if (isCrossChainPage) {
              trackingHandler(TRACKING_EVENT_TYPE.CC_SETTINGS_SAVED, {
                current_max_slippage: slippage / 100,
              })
            }
            onBack()
          }}
        >
          <ChevronLeft size={26} className="text-subText" />
        </IconButton>
        <span className="text-xl font-medium text-text">{t`Settings`}</span>
      </HStack>

      <Stack className="w-full gap-4">
        {(isSwapPage || isCrossChainPage) && (
          <SettingsSection title={<Trans>Advanced Settings</Trans>}>
            <SlippageSetting />
            {isSwapPage && <TransactionTimeLimitSetting />}
            <DegenModeSetting
              showConfirmation={showConfirmation}
              setShowConfirmation={setShowConfirmation}
              highlight={highlightDegenMode}
            />
            {isSwapPage && <LiquiditySourcesSetting onClick={onClickLiquiditySources} />}
            {isCrossChainPage && (
              <Suspense fallback={null}>
                <CrossChainSourceSetting onClick={onClickCrossChainSources} />
              </Suspense>
            )}
          </SettingsSection>
        )}

        {isSwapPage && (
          <>
            <SettingsDivider />
            <SettingsSection title={<Trans>Display Settings</Trans>}>
              <DisplaySettingRow
                label={<Trans>Pricing Chart</Trans>}
                tooltip={<Trans>Turn on to display pricing chart.</Trans>}
                isActive={isShowPricingChart}
                toggle={togglePricingChart}
              />
              <DisplaySettingRow
                label={<Trans>Trade Route</Trans>}
                tooltip={<Trans>Turn on to display trade route.</Trans>}
                isActive={isShowTradeRoutes}
                toggle={toggleTradeRoutes}
              />
              <DisplaySettingRow
                label={<Trans>Sound</Trans>}
                tooltip={<Trans>Turn on to play success sound.</Trans>}
                isActive={isSuccessSoundEnabled}
                toggle={toggleSuccessSound}
              />
            </SettingsSection>
          </>
        )}
      </Stack>
    </Stack>
  )
}

export default SettingsPanel
