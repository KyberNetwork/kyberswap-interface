import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as SettingIcon } from 'assets/svg/earn/ic_add_liquidity_setting.svg'
import { HStack, Stack } from 'components/Stack'
import Toggle from 'components/Toggle'
import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { useDegenModeManager } from 'state/user/hooks'

const TriggerButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.buttonGray};
  cursor: pointer;

  &[data-active='true'] {
    background: ${({ theme }) => theme.tabActive};
  }

  :hover {
    background: ${({ theme }) => theme.tabActive};
  }
`

const TooltipPanel = styled(Stack)`
  position: absolute;
  z-index: 20;
  top: calc(100% + 12px);
  right: -8px;
  width: 320px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.tableHeader};

  :before {
    content: '';
    position: absolute;
    top: -8px;
    right: 16px;
    width: 12px;
    height: 12px;
    transform: rotate(45deg);
    background: ${({ theme }) => theme.tableHeader};
    border-top: 1px solid ${({ theme }) => theme.border};
    border-left: 1px solid ${({ theme }) => theme.border};
  }

  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};

    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.12)};
    }
  }
`

const DegenModeRow = styled(HStack)<{ $highlight?: boolean }>`
  margin: 0px -6px;
  padding: 4px 4px 4px 6px;
  border-radius: 999px;
  background: ${({ theme, $highlight }) => ($highlight ? rgba(theme.warning, 0.12) : 'transparent')};
  border: 1px solid ${({ theme, $highlight }) => ($highlight ? rgba(theme.warning, 0.24) : 'transparent')};
  transition: background 0.2s ease, padding 0.2s ease, margin 0.2s ease;
`

interface AddLiquiditySettingsProps {
  isOpen?: boolean
  onOpenChange?: React.Dispatch<React.SetStateAction<boolean>>
  highlightDegenMode?: boolean
}

export default function AddLiquiditySettings({
  isOpen: controlledOpen,
  onOpenChange,
  highlightDegenMode = false,
}: AddLiquiditySettingsProps) {
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
      <Stack ref={wrapperRef} flex="0 0 auto" position="relative">
        <TriggerButton
          id="earn-add-liquidity-setting"
          type="button"
          aria-label="Advanced settings"
          aria-expanded={isOpen}
          data-active={isOpen}
          onClick={() => setIsOpen(prev => !prev)}
        >
          <SettingIcon width={18} height={18} color={isDegenMode ? theme.warning : theme.subText} />
        </TriggerButton>

        {isOpen && (
          <TooltipPanel gap={8}>
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              Advanced Settings
            </Text>
            <DegenModeRow align="center" gap={12} justify="space-between" $highlight={highlightDegenMode}>
              <Text color={theme.subText} fontSize={14} width="fit-content">
                <Trans>Degen Mode</Trans>
              </Text>
              <Toggle isActive={isDegenMode} toggle={handleToggleDegenMode} />
            </DegenModeRow>
            <Text color={theme.subText} fontSize={12}>
              <Trans>
                Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can
                result in bad rates and loss of funds. Be cautious.
              </Trans>
            </Text>
          </TooltipPanel>
        )}
      </Stack>

      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
    </>
  )
}
