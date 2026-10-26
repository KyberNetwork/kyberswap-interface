import { Trans, t } from '@lingui/macro'
import { type ReactNode, Suspense, lazy, useState } from 'react'
import { ChevronLeft } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import { HStack, Stack } from 'components/Stack'
import { DegenModeSetting } from 'components/SwapForm/Settings/SwapSettingsPanel/DegenModeSetting'
import { GasDropFeatureSetting } from 'components/SwapForm/Settings/SwapSettingsPanel/GasDropFeatureSetting'
import { LiquiditySourcesSetting } from 'components/SwapForm/Settings/SwapSettingsPanel/LiquiditySourcesSetting'
import { SlippageSetting } from 'components/TransactionSettings/SlippageSetting'
import { TransactionTimeLimitSetting } from 'components/TransactionSettings/TransactionTimeLimitSetting'
import {
  SettingsDivider,
  SettingsLabel,
  SettingsRow,
  SettingsSection,
  SettingsToggle,
} from 'components/TransactionSettings/components'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { KYBERCROSS } from 'constants/env'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import type { CrossChainQuoteMode } from 'state/crossChainSwap'
import {
  useShowPricingChart,
  useShowTradeRoutes,
  useSuccessSoundEnabled,
  useTogglePricingChart,
  useToggleSuccessSound,
  useToggleTradeRoutes,
  useUserSlippageTolerance,
} from 'state/user/hooks'

// CrossChainSourceSetting calls CrossChainSwapFactory.getAllAdapters(), which drags the whole cross-chain
// adapter stack (LiFi / NEAR / Solana / Bitcoin SDKs) into whatever chunk imports it. It renders only on
// the cross-chain page, so keep it lazy: opening Settings on /swap would otherwise download that stack for
// a row it never shows.
const CrossChainSourceSetting = lazy(
  () => import('components/SwapForm/Settings/SwapSettingsPanel/CrossChainSourceSetting'),
)

type DisplaySettingRowProps = {
  label: ReactNode
  tooltip: ReactNode
  isActive: boolean
  toggle: () => void
}

export const DisplaySettingRow = ({ label, tooltip, isActive, toggle }: DisplaySettingRowProps) => (
  <SettingsRow>
    <SettingsLabel tooltip={tooltip}>{label}</SettingsLabel>
    <SettingsToggle isActive={isActive} toggle={toggle} />
  </SettingsRow>
)

type SwapSettingsPanelProps = {
  mode: 'single-chain' | 'cross-chain' | 'limit' | 'stop-market'
  /** Independent of quote mode: unified cross-chain also supports chart/route display preferences. */
  showDisplaySettings?: boolean
  crossChainQuoteMode?: CrossChainQuoteMode
  highlightDegenMode?: boolean
  displaySettings?: {
    isShowPricingChart?: boolean
    isShowTradeRoutes?: boolean
    togglePricingChart?: () => void
    toggleTradeRoutes?: () => void
  }
  onBack: () => void
  onClickLiquiditySources: () => void
  onClickCrossChainSources: () => void
}

const SwapSettingsPanel = ({
  mode,
  showDisplaySettings = mode === 'single-chain',
  crossChainQuoteMode,
  highlightDegenMode,
  onBack,
  onClickLiquiditySources,
  onClickCrossChainSources,
  displaySettings,
}: SwapSettingsPanelProps) => {
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

  const handleBack = () => {
    if (mode === 'cross-chain') {
      trackingHandler(TRACKING_EVENT_TYPE.CC_SETTINGS_SAVED, {
        current_max_slippage: slippage / 100,
      })
    }
    onBack()
  }

  return (
    <Stack className="w-full gap-4" id={TutorialIds.TRADING_SETTING_CONTENT}>
      <HStack className="items-center gap-1">
        <IconButton aria-label="Back" onClick={handleBack}>
          <ChevronLeft size={26} className="text-subText" />
        </IconButton>
        <span className="text-xl font-medium text-text">{t`Settings`}</span>
      </HStack>

      <Stack className="w-full gap-4">
        {(mode === 'single-chain' || mode === 'cross-chain') && (
          <SettingsSection title={<Trans>Advanced Settings</Trans>}>
            <SlippageSetting />
            {mode === 'single-chain' && <TransactionTimeLimitSetting />}
            <DegenModeSetting
              showConfirmation={showConfirmation}
              onConfirmationChange={setShowConfirmation}
              highlight={highlightDegenMode}
            />
            {mode === 'single-chain' && <LiquiditySourcesSetting onClick={onClickLiquiditySources} />}
            {mode === 'cross-chain' && crossChainQuoteMode !== 'stream' && KYBERCROSS && <GasDropFeatureSetting />}
            {mode === 'cross-chain' && (
              <Suspense fallback={null}>
                <CrossChainSourceSetting onClick={onClickCrossChainSources} quoteMode={crossChainQuoteMode} />
              </Suspense>
            )}
          </SettingsSection>
        )}

        {showDisplaySettings && (
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

        {(mode === 'limit' || mode === 'stop-market') && (
          <>
            {mode === 'stop-market' && (
              <>
                <SettingsSection title={<Trans>Advanced Settings</Trans>}>
                  <DegenModeSetting
                    showConfirmation={showConfirmation}
                    onConfirmationChange={setShowConfirmation}
                    highlight={highlightDegenMode}
                  />
                </SettingsSection>
                <SettingsDivider />
              </>
            )}
            <SettingsSection title={<Trans>Display Settings</Trans>}>
              <DisplaySettingRow
                label={<Trans>Pricing Chart</Trans>}
                tooltip={<Trans>Turn on to display pricing chart.</Trans>}
                isActive={isShowPricingChart}
                toggle={togglePricingChart}
              />
            </SettingsSection>
          </>
        )}
      </Stack>
    </Stack>
  )
}

export default SwapSettingsPanel
