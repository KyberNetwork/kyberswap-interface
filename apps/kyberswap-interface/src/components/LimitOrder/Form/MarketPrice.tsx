import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Repeat } from 'react-feather'

import { removeTrailingZero } from 'components/LimitOrder/utils'
import Skeleton from 'components/Skeleton'
import { HStack } from 'components/Stack'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'

type MarketPriceProps = {
  price?: BaseTradeInfo
  loading?: boolean
  symbolIn?: string
  symbolOut?: string
}

const MarketPrice = ({ price, loading, symbolIn, symbolOut }: MarketPriceProps) => {
  const [showInverted, setShowInverted] = useState(false)
  let formattedPrice

  try {
    if (price) {
      formattedPrice = showInverted
        ? removeTrailingZero(price.invertRate.toPrecision(6))
        : removeTrailingZero(price.marketRate.toPrecision(6))
    }
  } catch (error) {}

  const ready = Boolean(price?.marketRate && price?.invertRate && formattedPrice && !loading)

  if (loading) {
    return <Skeleton height={18} width={160} />
  }

  if (!ready) {
    return (
      <span className="text-sm font-medium text-warning">
        <Trans>Unable to get the market price</Trans>
      </span>
    )
  }

  return (
    <HStack
      as="button"
      type="button"
      className="items-center gap-2 hover:brightness-75"
      onClick={() => setShowInverted(showInverted => !showInverted)}
    >
      <span className="text-sm font-medium">
        {showInverted
          ? `1 ${symbolOut} = ${formattedPrice} ${symbolIn}`
          : `1 ${symbolIn} = ${formattedPrice} ${symbolOut}`}
      </span>
      <Repeat size={14} className="text-subText" />
    </HStack>
  )
}

export default MarketPrice
