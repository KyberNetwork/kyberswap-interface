import { t } from '@lingui/macro'
import { VaultQueueLimits } from 'services/vault'

import { formatTerm } from 'pages/Earns/hooks/useCountdown'
import { VaultNativeWithdrawal } from 'pages/Earns/utils/vault'

/**
 * Wording for the vault's own exit, shared by the form and its review step. Both of the vault's
 * exits are worded here; a native path with no usable exit has nothing to say about timing.
 */
type NativeKind = VaultNativeWithdrawal['kind'] | undefined

/** What the native route does, under the tab that selects it. */
export const getNativeRouteNote = (kind: NativeKind) =>
  kind === 'redeem'
    ? t`Redeems instantly at the vault's rate.`
    : kind === 'queue'
    ? t`Expected time: Starts ~3 days; may extend (3–10 days) depending on strategies.`
    : undefined

/** How the payout reaches the wallet, as the closing note of the form. */
export const getNativePayoutNote = (kind: NativeKind) =>
  kind === 'redeem'
    ? t`Tokens are sent to your wallet in the same transaction.`
    : kind === 'queue'
    ? t`When completed, tokens are automatically sent to your wallet, no need to claim.`
    : undefined

export const getProcessingTimeTooltip = (kind: NativeKind) =>
  kind === 'redeem'
    ? t`The vault pays out in the same transaction as the redemption, so there is nothing to wait for once it confirms.`
    : t`How long the withdrawal usually takes. A solver fills the request out of the queue, so the vault does not pay out on a fixed schedule.`

export const getProcessingTime = (kind: NativeKind, queueLimits?: VaultQueueLimits) =>
  kind === 'redeem' ? t`Instant` : queueLimits ? formatTerm(queueLimits.minimumSecondsToDeadline) : '--'
