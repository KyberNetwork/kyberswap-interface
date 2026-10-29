import { Trans } from '@lingui/macro'
import { cva } from 'class-variance-authority'

import { removeTrailingZero } from 'components/LimitOrder/utils'
import { formatDistanceMagnitude, getTriggerDirection } from 'components/StopMarket/utils'

/** The colour applied to the direction marker and distance percentage. */
export const triggerDistanceText = cva('transition-colors duration-200', {
  variants: {
    direction: {
      below: 'text-red',
      above: 'text-primary',
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
 * Shows the trigger's distance from the oracle price. Only the direction marker and percentage are coloured;
 * the descriptive words stay in the surrounding text colour. With no distance to show (no trigger yet, or
 * one right at the oracle) it names the price the distance is measured from.
 */
export const TriggerDistance = ({ percent, className, dataTestId }: Props) => {
  const direction = getTriggerDirection(percent)
  return (
    <span className={className} data-testid={dataTestId}>
      {direction !== 'none' && percent !== undefined && (
        <span className={triggerDistanceText({ direction })}>
          {direction === 'below' ? '↓' : '↑'} {removeTrailingZero(formatDistanceMagnitude(percent, 2))}%{' '}
        </span>
      )}
      <span className="text-subText">
        {direction === 'below' ? (
          <Trans>below current Oracle price</Trans>
        ) : direction === 'above' ? (
          <Trans>above current Oracle price</Trans>
        ) : (
          <Trans>Current Oracle price</Trans>
        )}
      </span>
    </span>
  )
}
