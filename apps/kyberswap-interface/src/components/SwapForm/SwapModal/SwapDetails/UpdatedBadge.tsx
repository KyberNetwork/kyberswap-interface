import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import InfoHelper from 'components/InfoHelper'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'

export type Level = 'better' | 'worse' | 'worst' | undefined

export interface Props {
  $level: Level
  outputAmount: CurrencyAmount<Currency>
}

const LEVEL_CLASS: Record<NonNullable<Level>, string> = {
  worst: 'bg-red-10 text-red',
  worse: 'bg-warning-10 text-warning',
  better: 'bg-primary-10 text-primary',
}

export default function UpdatedBadge({ $level, outputAmount }: Props) {
  const theme = useTheme()
  const output = `${outputAmount.toSignificant(RESERVE_USD_DECIMALS)} ${outputAmount.currency.symbol}`

  if (!$level) {
    return null
  }

  return (
    <div
      data-level={$level}
      className={cn(
        'flex items-center gap-1 rounded-[36px] px-2 py-1 text-xs font-normal leading-none',
        LEVEL_CLASS[$level],
      )}
    >
      {$level === 'better' && (
        <InfoHelper
          placement="top"
          size={14}
          color={theme.primary}
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
