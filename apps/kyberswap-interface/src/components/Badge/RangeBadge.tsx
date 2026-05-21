import { Trans } from '@lingui/macro'
import { AlertCircle, Info } from 'react-feather'

import Badge, { BadgeVariant } from 'components/Badge'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

export default function RangeBadge({
  removed,
  inRange,
  hideText = false,
  size = 16,
}: {
  removed: boolean | undefined
  inRange: boolean | undefined
  hideText?: boolean
  size?: number
}) {
  const theme = useTheme()
  const padClass = hideText ? 'p-1' : undefined
  return (
    <div className="flex justify-end text-xs">
      {removed ? (
        <MouseoverTooltip text={<Trans>Your position has 0 liquidity, and is not earning fees</Trans>}>
          <Badge variant={BadgeVariant.NEGATIVE} className={padClass}>
            <AlertCircle width={size} height={size} />
            {!hideText && (
              <>
                &nbsp;
                <div className="whitespace-nowrap text-xs font-medium">
                  <Trans>Closed</Trans>
                </div>
              </>
            )}
          </Badge>
        </MouseoverTooltip>
      ) : inRange ? (
        <MouseoverTooltip
          text={
            <Trans>
              The price of this pool is within your selected range. Your position is currently earning fees.
            </Trans>
          }
        >
          <Badge variant={BadgeVariant.PRIMARY} className={padClass}>
            <Info size={size} color={theme.primary} />
            {!hideText && (
              <>
                &nbsp;
                <div className="whitespace-nowrap text-xs font-medium">
                  <Trans>In range</Trans>
                </div>
              </>
            )}
          </Badge>
        </MouseoverTooltip>
      ) : (
        <MouseoverTooltip
          text={
            <Trans>
              The price of this pool is outside of your selected price range. Currently, your position is not earning
              any fees or rewards.
            </Trans>
          }
        >
          <Badge variant={BadgeVariant.WARNING} className={padClass}>
            <Info size={size} color={theme.warning} />
            {!hideText && (
              <>
                &nbsp;
                <div className="whitespace-nowrap text-xs font-medium">
                  <Trans>Out of range</Trans>
                </div>
              </>
            )}
          </Badge>
        </MouseoverTooltip>
      )}
    </div>
  )
}
