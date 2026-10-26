import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import InfoHelper from 'components/InfoHelper'
import { cn } from 'utils/cn'

export type Level = 'better' | 'worse' | 'worst' | undefined

export interface Props {
  $level: Level
  outputAmount: CurrencyAmount<Currency>
}

const UpdatedBadge = ({ $level, outputAmount }: Props) => {
  const output = `${outputAmount.toExact()} ${outputAmount.currency.symbol}`

  if (!$level) {
    return null
  }

  return (
    <div
      data-level={$level}
      className={cn(
        'flex items-center gap-1 rounded-[36px] px-2 py-1 text-xs font-normal leading-none',
        $level === 'worst' && 'bg-red-10 text-red',
        $level === 'worse' && 'bg-warning-10 text-warning',
        $level === 'better' && 'bg-primary-10 text-primary',
      )}
    >
      {$level === 'better' && (
        <InfoHelper
          placement="top"
          size={14}
          className="text-primary"
          text={
            <span className="text-xs">
              <Trans>We got you a higher amount. The initial output amount was {output}</Trans>
            </span>
          }
        />
      )}
      <Trans>Updated</Trans>
    </div>
  )
}

export default UpdatedBadge
