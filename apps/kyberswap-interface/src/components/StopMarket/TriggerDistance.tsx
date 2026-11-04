import { Trans } from '@lingui/macro'
import { cva } from 'class-variance-authority'

import { removeTrailingZero } from 'components/LimitOrder/utils'
import { formatDistanceMagnitude, getTriggerDirection } from 'components/StopMarket/utils'

/**
 * The colour of the distance percentage. Only a trigger below the oracle price can be placed, so only that
 * side is coloured; one above it stays neutral beside the warning that blocks it.
 */
export const triggerDistanceText = cva('transition-colors duration-200', {
  variants: {
    direction: {
      below: 'text-red',
      above: 'text-subText',
      none: 'text-subText',
    },
  },
})

type Props = {
  percent?: number
  className?: string
  dataTestId?: string
}

/**
 * Shows how far the trigger sits from the oracle price, as a distance only. The trigger field can show the
 * price inverted while the distance is measured in the order's own direction, so words like "above" or an
 * arrow would contradict the figure on screen. With no distance to show (no trigger yet, or one right at
 * the oracle) it names the price the distance is measured from.
 */
export const TriggerDistance = ({ percent, className, dataTestId }: Props) => {
  const direction = getTriggerDirection(percent)
  return (
    <span className={className} data-testid={dataTestId}>
      {direction !== 'none' && percent !== undefined && (
        <span className={triggerDistanceText({ direction })}>
          {removeTrailingZero(formatDistanceMagnitude(percent, 2))}%{' '}
        </span>
      )}
      <span className="text-subText">
        {direction === 'none' ? <Trans>Current Oracle price</Trans> : <Trans>from current Oracle price</Trans>}
      </span>
    </span>
  )
}
