import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Repeat } from 'react-feather'

import Skeleton from 'components/Skeleton'
import { HStack } from 'components/Stack'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

type MarketPriceProps = {
  price?: BaseTradeInfo
  loading?: boolean
  symbolIn?: string
  symbolOut?: string
  className?: string
}

const MarketPrice = ({ price, loading, symbolIn, symbolOut, className }: MarketPriceProps) => {
  const [showInverted, setShowInverted] = useState(false)
  const formattedPrice = price
    ? formatDisplayNumber(showInverted ? price.invertRate : price.marketRate, { significantDigits: 6 })
    : undefined

  const ready = Boolean(price?.marketRate && price?.invertRate && formattedPrice && !loading)

  if (loading) {
    return <Skeleton height={20} width={160} />
  }

  if (!ready) {
    return (
      <span className="block min-w-0 truncate text-sm italic text-warning">
        <Trans>Unable to get the market price</Trans>
      </span>
    )
  }

  return (
    <HStack
      as="button"
      type="button"
      className="min-w-0 max-w-full items-center gap-2 hover:brightness-75"
      onClick={() => setShowInverted(showInverted => !showInverted)}
    >
      <span className={cn('min-w-0 truncate text-sm font-medium text-text', className)}>
        {showInverted
          ? `1 ${symbolOut} = ${formattedPrice} ${symbolIn}`
          : `1 ${symbolIn} = ${formattedPrice} ${symbolOut}`}
      </span>
      <Repeat size={14} className="text-subText" />
    </HStack>
  )
}

export default MarketPrice
