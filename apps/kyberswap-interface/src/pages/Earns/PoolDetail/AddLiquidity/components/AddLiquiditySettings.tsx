import { Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'

import { ReactComponent as SettingIcon } from 'assets/svg/earn/ic_add_liquidity_setting.svg'
import { HStack, Stack } from 'components/Stack'
import Toggle from 'components/Toggle'
import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { useDegenModeManager } from 'state/user/hooks'
import { cn } from 'utils/cn'

type AddLiquiditySettingsProps = {
  isOpen?: boolean
  onOpenChange?: React.Dispatch<React.SetStateAction<boolean>>
  highlightDegenMode?: boolean
}

const AddLiquiditySettings = ({
  isOpen: controlledOpen,
  onOpenChange,
  highlightDegenMode = false,
}: AddLiquiditySettingsProps) => {
  const theme = useTheme()
  const [isDegenMode, toggleDegenMode] = useDegenModeManager()

  const [internalOpen, setInternalOpen] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const isOpen = controlledOpen ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  useEffect(() => {
    if (controlledOpen !== undefined) return
    if (!highlightDegenMode) return
    setInternalOpen(true)
  }, [controlledOpen, highlightDegenMode])

  const handleToggleDegenMode = () => {
    if (isDegenMode) {
      toggleDegenMode()
      return
    }

    setShowConfirmation(true)
  }

  useOnClickOutside(wrapperRef, isOpen ? () => setIsOpen(false) : undefined)

  return (
    <>
      <Stack ref={wrapperRef} className="relative flex-[0_0_auto]">
        <button
          id="earn-add-liquidity-setting"
          type="button"
          aria-label="Advanced settings"
          aria-expanded={isOpen}
          data-active={isOpen}
          onClick={() => setIsOpen(prev => !prev)}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-solid border-border bg-buttonGray hover:bg-tabActive data-[active=true]:bg-tabActive"
        >
          <SettingIcon width={18} height={18} color={isDegenMode ? theme.warning : theme.subText} />
        </button>

        {isOpen && (
          <Stack
            className={cn(
              'gap-2',
              'absolute right-[-8px] top-[calc(100%+12px)] z-20 w-[320px] rounded-xl border border-solid border-border bg-tableHeader p-4',
              "before:absolute before:right-4 before:top-[-8px] before:size-3 before:rotate-45 before:border-l before:border-t before:border-solid before:border-border before:bg-tableHeader before:content-['']",
            )}
          >
            <span className="font-medium text-text">Advanced Settings</span>
            <Stack className="gap-1">
              <HStack
                className={cn(
                  'items-center justify-between',
                  '-mx-1.5 rounded-full border border-solid p-1 pl-1.5 transition-[background,padding,margin] duration-200 ease-linear',
                  highlightDegenMode ? 'border-warning/[0.24] bg-warning-10' : 'border-transparent bg-transparent',
                )}
              >
                <span className="text-sm font-medium text-warning">
                  <Trans>Degen Mode</Trans>
                </span>
                <Toggle
                  isActive={isDegenMode}
                  toggle={handleToggleDegenMode}
                  className="bg-buttonBlack data-[active=true]:bg-primary-12"
                />
              </HStack>
              <span className="text-xs italic text-subText">
                <Trans>
                  Turn this on to make trades with very high price impact or to set very high slippage tolerance. This
                  can result in bad rates and loss of funds. Be cautious.
                </Trans>
              </span>
            </Stack>
          </Stack>
        )}
      </Stack>

      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
    </>
  )
}

export default AddLiquiditySettings
