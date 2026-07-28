import { Trans, t } from '@lingui/macro'

import { ErrorWarning } from 'components/ErrorWarning'
import { MouseoverTooltip } from 'components/Tooltip'
import { NUMBERS } from 'components/WalletPopup/Transactions/helper'
import { ExternalLink } from 'theme'

export default function PendingWarning() {
  const min = NUMBERS.STALLED_MINS
  return (
    <ErrorWarning
      style={{ borderRadius: 20, padding: '10px 14px', height: NUMBERS.STALL_WARNING_HEIGHT }}
      type="error"
      title={
        <span className="text-red">
          <Trans>
            Transaction stuck?{' '}
            <MouseoverTooltip
              text={t`Stuck transaction. Your transaction has been processing for more than ${min} mins.`}
            >
              <ExternalLink href="https://support.kyberswap.com/hc/en-us/articles/13785666409881-Why-is-my-transaction-stuck-in-Pending-state-">
                See here
              </ExternalLink>
            </MouseoverTooltip>
          </Trans>
        </span>
      }
    />
  )
}
