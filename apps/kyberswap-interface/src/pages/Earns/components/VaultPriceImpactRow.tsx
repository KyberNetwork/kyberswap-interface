import { t } from '@lingui/macro'

import ValueSkeleton from 'pages/Earns/components/ValueSkeleton'
import { InfoLabel, InfoRow, InfoValue } from 'pages/Earns/components/VaultDeposit/styles'
import { formatDisplayNumber } from 'utils/numbers'

/**
 * The figure behind the impact warning: how far the route moves the pools it passes through. Only
 * a quoted route carries one, so the row reads "--" until the quote lands. The API states it in
 * basis points.
 */
const VaultPriceImpactRow = ({ priceImpact, isLoading }: { priceImpact?: number; isLoading?: boolean }) => (
  <InfoRow>
    <InfoLabel
      tooltip={t`How far this trade moves the price of the pools it routes through. A large impact means thin liquidity.`}
    >{t`Price Impact`}</InfoLabel>
    <InfoValue>
      {priceImpact === undefined ? (
        isLoading ? (
          <ValueSkeleton />
        ) : (
          '--'
        )
      ) : (
        formatDisplayNumber(priceImpact / 100, { style: 'percent', fractionDigits: 2 })
      )}
    </InfoValue>
  </InfoRow>
)

export default VaultPriceImpactRow
