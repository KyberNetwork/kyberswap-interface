import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import MenuFlyout from 'components/MenuFlyout'
import Toggle from 'components/Toggle'
import Tooltip, { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import SlippageSetting from 'components/swapv2/SwapSettingsPanel/SlippageSetting'
import TransactionTimeLimitSetting from 'components/swapv2/SwapSettingsPanel/TransactionTimeLimitSetting'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleTransactionSettingsMenu } from 'state/application/hooks'
import { useAggregatorForZapSetting, useDegenModeManager } from 'state/user/hooks'

const TX_SETTINGS_FLYOUT_CLASS =
  'ks-tx-settings-flyout !min-w-[322px] !right-[-10px] !top-[3.25rem] max-lg:!bottom-auto'

type Props = {
  isElastic?: boolean
  hoverBg?: string
}

export default function TransactionSettings({ isElastic, hoverBg }: Props) {
  const [isDegenMode, toggleDegenMode] = useDegenModeManager()
  const [isUseAggregatorForZap, toggleAggregatorForZap] = useAggregatorForZapSetting()
  const toggle = useToggleTransactionSettingsMenu()
  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)
  const open = useModalOpen(ApplicationModal.TRANSACTION_SETTINGS)

  const [searchParams, setSearchParams] = useSearchParams()

  const showSetting = searchParams.get('showSetting')
  useEffect(() => {
    if (showSetting === 'true') {
      toggle()
    }
    // only toggle one
    // eslint-disable-next-line
  }, [showSetting])

  const [isShowTooltip, setIsShowTooltip] = useState<boolean>(false)
  const showTooltip = useCallback(() => setIsShowTooltip(true), [setIsShowTooltip])
  const hideTooltip = useCallback(() => setIsShowTooltip(false), [setIsShowTooltip])

  const handleToggleAdvancedMode = () => {
    if (isDegenMode /* is already ON */) {
      toggleDegenMode()
      setShowConfirmation(false)
      return
    }

    toggle()
    if (showSetting === 'true') {
      searchParams.delete('showSetting')
      setSearchParams(searchParams, { replace: true })
    }

    setShowConfirmation(true)
  }
  return (
    <>
      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
      {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451 */}
      <div className="relative flex items-center justify-center border-none text-left">
        <MenuFlyout
          trigger={
            <Tooltip
              width="fit-content"
              placement="top"
              text={t`Degen mode is on. Be cautious!`}
              show={isDegenMode && isShowTooltip}
            >
              <div onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                <StyledActionButtonSwapForm
                  hoverBg={hoverBg}
                  active={open}
                  onClick={toggle}
                  id="open-settings-dialog-button"
                  aria-label="Transaction Settings"
                >
                  <TransactionSettingsIcon className={isDegenMode ? 'text-warning' : 'text-subText'} />
                </StyledActionButtonSwapForm>
              </div>
            </Tooltip>
          }
          className={TX_SETTINGS_FLYOUT_CLASS}
          isOpen={open}
          toggle={() => {
            toggle()
            if (showSetting === 'true') {
              searchParams.delete('showSetting')
              setSearchParams(searchParams, { replace: true })
            }
          }}
          title={t`Advanced Settings`}
          mobileStyle={{ paddingBottom: '40px' }}
          hasArrow
        >
          <div className="mt-2 flex flex-col gap-3">
            <SlippageSetting shouldShowPinButton={false} />
            <TransactionTimeLimitSetting />

            <div className="flex justify-between">
              <div className="flex w-fit items-center">
                <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                  <MouseoverTooltip
                    text={t`You can make trades with high price impact and without any confirmation prompts. Enable at your own risk`}
                    placement="right"
                  >
                    <Trans>Degen Mode</Trans>
                  </MouseoverTooltip>
                </TextDashed>
              </div>
              <Toggle
                id="toggle-expert-mode-button"
                isActive={isDegenMode}
                toggle={handleToggleAdvancedMode}
                highlight={showSetting === 'true'}
                className="bg-buttonBlack"
              />
            </div>

            {isElastic && (
              <div className="flex justify-between">
                <div className="flex w-fit items-center">
                  <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                    <MouseoverTooltip
                      text={t`Zap will include DEX aggregator to find the best price.`}
                      placement="right"
                    >
                      <Trans>Use Aggregator for Zaps</Trans>
                    </MouseoverTooltip>
                  </TextDashed>
                </div>
                <Toggle
                  id="toggle-aggregator-for-zap"
                  isActive={isUseAggregatorForZap}
                  toggle={toggleAggregatorForZap}
                  className="bg-buttonBlack"
                />
              </div>
            )}
          </div>
        </MenuFlyout>
      </div>
    </>
  )
}
