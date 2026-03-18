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
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;

  &[data-active='true'] {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
  }

  :hover {
    background: ${({ theme }) => theme.tabActive};
  }
`

const Wrapper = styled.div`
  position: relative;
  flex: 0 0 auto;
`

const TooltipPanel = styled(Stack)`
  position: absolute;
  z-index: 20;
  top: calc(100% + 12px);
  right: -4px;
  width: 320px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: ${({ theme }) => theme.tableHeader};
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.32);
  filter: drop-shadow(0px 8px 18px rgba(0, 0, 0, 0.28));

  :before {
    content: '';
    position: absolute;
    top: -7px;
    right: 14px;
    width: 14px;
    height: 14px;
    transform: rotate(45deg);
    background: ${({ theme }) => theme.tableHeader};
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-left: 1px solid rgba(255, 255, 255, 0.08);
  }

  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};

    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.18)};
    }
  }
`

const PanelTitle = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
`

const SettingLabel = styled(Text)`
  margin: 0;
  border-bottom: 1px dotted ${({ theme }) => rgba(theme.subText, 0.4)};
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 400;
  width: fit-content;
`

const SettingDescription = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  line-height: 1.5;
`

const DegenModeRow = styled(HStack)<{ $highlight?: boolean }>`
  margin: ${({ $highlight }) => ($highlight ? '0 -8px' : '0')};
  padding: ${({ $highlight }) => ($highlight ? '4px 8px' : '4px 0')};
  border-radius: 12px;
  background: ${({ theme, $highlight }) => ($highlight ? rgba(theme.warning, 0.12) : 'transparent')};
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
      <Wrapper ref={wrapperRef}>
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
            <PanelTitle>Advanced Settings</PanelTitle>
            <DegenModeRow align="center" gap={12} justify="space-between" $highlight={highlightDegenMode}>
              <SettingLabel>
                <Trans>Degen Mode</Trans>
              </SettingLabel>
              <Toggle isActive={isDegenMode} toggle={handleToggleDegenMode} />
            </DegenModeRow>
            <SettingDescription>
              <Trans>
                Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can
                result in bad rates and loss of funds. Be cautious.
              </Trans>
            </SettingDescription>
          </TooltipPanel>
        )}
      </Wrapper>

      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
    </>
  )
}
