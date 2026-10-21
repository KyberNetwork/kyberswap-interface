import { Trans } from '@lingui/macro'
import { cva } from 'class-variance-authority'

import { formatDistanceMagnitude, getTriggerDirection } from 'components/StopMarket/utils'
import { cn } from 'utils/cn'

/** The colour a trigger's distance from the oracle price takes: red below it, green above, muted at it. */
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
  /** Keeps the words after the figure in the muted colour, the way a review row reads. */
  muteWords?: boolean
  className?: string
  dataTestId?: string
}

/**
 * Where the trigger sits against the oracle price — "↓ 20.4% below current oracle price" — coloured by its
 * direction, the same on the form and in the reviews. With no distance to show (no trigger yet, or one
 * right at the oracle) it names the price the distance is measured from.
 */
export const TriggerDistance = ({ percent, muteWords, className, dataTestId }: Props) => {
  const direction = getTriggerDirection(percent)
  return (
    <span className={cn(triggerDistanceText({ direction }), className)} data-testid={dataTestId}>
      {direction !== 'none' && percent !== undefined && (
        <>
          {direction === 'below' ? '↓' : '↑'} {formatDistanceMagnitude(percent)}%{' '}
        </>
      )}
      <span className={cn(muteWords && 'text-subText')}>
        {direction === 'below' ? (
          <Trans>below current oracle price</Trans>
        ) : direction === 'above' ? (
          <Trans>above current oracle price</Trans>
        ) : (
          <Trans>current oracle price</Trans>
        )}
      </span>
    </span>
  )
}
