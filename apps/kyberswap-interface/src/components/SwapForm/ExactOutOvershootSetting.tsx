import { Trans } from '@lingui/macro'

import InfoHelper from 'components/InfoHelper'
import { cn } from 'utils/cn'

export const MIN_EXACT_OUT_OVERSHOOT_BPS = 1
export const MAX_EXACT_OUT_OVERSHOOT_BPS = 100
export const DEFAULT_EXACT_OUT_OVERSHOOT_BPS = '100'

/** The typed value as bps the aggregator accepts, or undefined when it is empty or out of range. */
export const parseExactOutOvershootBps = (value: string): number | undefined => {
  if (!/^\d+$/.test(value)) return undefined
  const bps = Number(value)
  return bps >= MIN_EXACT_OUT_OVERSHOOT_BPS && bps <= MAX_EXACT_OUT_OVERSHOOT_BPS ? bps : undefined
}

type Props = {
  value: string
  onChange: (value: string) => void
}

const ExactOutOvershootSetting = ({ value, onChange }: Props) => {
  const isInvalid = value !== '' && parseExactOutOvershootBps(value) === undefined

  return (
    <div className="flex items-center justify-between text-xs text-subText">
      <span className="flex items-center">
        <Trans>Max Output Overshoot</Trans>
        <InfoHelper
          size={14}
          text={
            <Trans>
              How far above the typed output amount the quote may land, in basis points (1 - 100). Leave empty to use
              the aggregator default.
            </Trans>
          }
        />
      </span>
      <div
        className={cn(
          'flex items-center gap-1 rounded-full border border-border bg-buttonBlack px-2 py-1',
          isInvalid && 'border-red',
        )}
      >
        <input
          className="w-10 border-none bg-transparent text-right text-xs text-text outline-none"
          inputMode="numeric"
          placeholder="—"
          value={value}
          onChange={e => {
            const next = e.target.value
            if (/^\d{0,3}$/.test(next)) onChange(next)
          }}
        />
        <span>bps</span>
      </div>
    </div>
  )
}

export default ExactOutOvershootSetting
