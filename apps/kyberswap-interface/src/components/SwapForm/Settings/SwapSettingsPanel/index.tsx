import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { type ReactNode, Suspense, lazy, useState } from 'react'
import { ChevronLeft } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import { HStack, Stack } from 'components/Stack'
import { DegenModeSetting } from 'components/SwapForm/Settings/SwapSettingsPanel/DegenModeSetting'
import { LiquiditySourcesSetting } from 'components/SwapForm/Settings/SwapSettingsPanel/LiquiditySourcesSetting'
import { RouterV3Setting } from 'components/SwapForm/Settings/SwapSettingsPanel/RouterV3Setting'
import { SendToAnotherWalletSetting } from 'components/SwapForm/Settings/SwapSettingsPanel/SendToAnotherWalletSetting'
import { useSingleChainSwapContext } from 'components/SwapForm/SingleChain/SingleChainSwapProvider'
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

const CrossChainSendToAnotherWalletSetting = lazy(
  () => import('components/SwapForm/Settings/SwapSettingsPanel/CrossChainSendToAnotherWalletSetting'),
)

const SingleChainSendToAnotherWalletSetting = ({ onApply }: { onApply: () => void }) => {
  const { recipientInputValue, applyRecipient, isWrapOrUnwrap } = useSingleChainSwapContext()
  return (
    <SendToAnotherWalletSetting
      mode="evm"
      disabled={isWrapOrUnwrap}
      recipientInputValue={recipientInputValue}
      onApply={value => {
        applyRecipient(value)
        onApply()
      }}
    />
  )
}

type DisplaySettingRowProps = {
  label: ReactNode
  tooltip: ReactNode
  isActive: boolean
  toggle: () => void
}

const DisplaySettingRow = ({ label, tooltip, isActive, toggle }: DisplaySettingRowProps) => (
  <SettingsRow>
    <SettingsLabel tooltip={tooltip}>{label}</SettingsLabel>
    <SettingsToggle isActive={isActive} toggle={toggle} />
  </SettingsRow>
)

type SwapSettingsPanelProps = {
  chainId?: ChainId
  mode: 'single-chain' | 'cross-chain' | 'limit' | 'stop-market'
  /** Independent of quote mode: unified cross-chain also supports chart/route display preferences. */
  showDisplaySettings?: boolean
  recipientSettingsReady?: boolean
  crossChainQuoteMode?: CrossChainQuoteMode
  highlightDegenMode?: boolean
  onBack: () => void
  onClickLiquiditySources: () => void
  onClickCrossChainSources: () => void
}

const SwapSettingsPanel = ({
  chainId,
  mode,
  showDisplaySettings = mode === 'single-chain',
  recipientSettingsReady = true,
  crossChainQuoteMode,
  highlightDegenMode,
  onBack,
  onClickLiquiditySources,
  onClickCrossChainSources,
}: SwapSettingsPanelProps) => {
  const { trackingHandler } = useTracking()
  const [slippage] = useUserSlippageTolerance()

  const [showConfirmation, setShowConfirmation] = useState(false)
  const isShowPricingChart = useShowPricingChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isSuccessSoundEnabled = useSuccessSoundEnabled()
  const togglePricingChart = useTogglePricingChart()
  const toggleTradeRoutes = useToggleTradeRoutes()
  const toggleSuccessSound = useToggleSuccessSound()

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
            <SlippageSetting isCrossChain={mode === 'cross-chain'} />
            {mode === 'single-chain' && <TransactionTimeLimitSetting />}
            {mode === 'single-chain' && <RouterV3Setting />}
            <DegenModeSetting
              showConfirmation={showConfirmation}
              onConfirmationChange={setShowConfirmation}
              highlight={highlightDegenMode}
            />
            {mode === 'single-chain' && <LiquiditySourcesSetting chainId={chainId} onClick={onClickLiquiditySources} />}
            {mode === 'cross-chain' && (
              <Suspense fallback={null}>
                <CrossChainSourceSetting onClick={onClickCrossChainSources} quoteMode={crossChainQuoteMode} />
              </Suspense>
            )}
          </SettingsSection>
        )}

        {showDisplaySettings && (
          <>
            {recipientSettingsReady && (mode === 'single-chain' || mode === 'cross-chain') && (
              <>
                {mode === 'single-chain' ? (
                  <SingleChainSendToAnotherWalletSetting onApply={onBack} />
                ) : (
                  <Suspense fallback={null}>
                    <CrossChainSendToAnotherWalletSetting onApply={onBack} />
                  </Suspense>
                )}
              </>
            )}
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
