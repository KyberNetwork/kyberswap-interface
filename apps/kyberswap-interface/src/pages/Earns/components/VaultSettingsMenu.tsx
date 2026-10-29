import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'

import IconButton from 'components/Button/IconButton'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import MenuFlyout from 'components/MenuFlyout'
import { MouseoverTooltip } from 'components/Tooltip'
import VaultDegenModeRow from 'pages/Earns/components/VaultDegenModeRow'
import { useVaultDegenPrompt } from 'pages/Earns/components/VaultDegenPrompt'
import { useDegenModeManager } from 'state/user/hooks'

/**
 * The form's advanced settings, behind a gear as the zap flows keep theirs. An action that will not
 * sign without Degen Mode opens this panel and marks the row, rather than leaving the person to find
 * the setting themselves.
 */
const VaultSettingsMenu = () => {
  const { highlight } = useVaultDegenPrompt()
  const [isDegenMode] = useDegenModeManager()
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    if (highlight) setOpen(true)
  }, [highlight])

  return (
    <MenuFlyout
      isOpen={isOpen}
      toggle={() => setOpen(open => !open)}
      title={t`Advanced Setting`}
      className="absolute right-0 top-10 z-[2] min-w-[280px] rounded-xl border border-solid border-white-08 bg-tableHeader p-4"
      trigger={
        <MouseoverTooltip
          text={isDegenMode ? t`Degen mode is on. Be cautious!` : t`Settings`}
          placement="top"
          width="fit-content"
        >
          <IconButton variant="action" active={isOpen} aria-label={t`Settings`}>
            <TransactionSettingsIcon className={isDegenMode ? 'text-warning' : 'text-subText'} />
          </IconButton>
        </MouseoverTooltip>
      }
    >
      <VaultDegenModeRow highlight={highlight} />
    </MenuFlyout>
  )
}

export default VaultSettingsMenu
