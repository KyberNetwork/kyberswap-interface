import { useState } from 'react'
import { Repeat } from 'react-feather'

import Skeleton from 'components/Skeleton'
import { HStack } from 'components/Stack'
import { removeTrailingZero } from 'components/swapv2/LimitOrder/helpers'
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

  return ready ? (
    <HStack
      as="button"
      type="button"
      className="items-center gap-1 hover:brightness-[0.85]"
      onClick={() => setShowInverted(showInverted => !showInverted)}
    >
      <span className="text-sm">
        {showInverted
          ? `1 ${symbolOut} = ${formattedPrice} ${symbolIn}`
          : `1 ${symbolIn} = ${formattedPrice} ${symbolOut}`}
      </span>
      <Repeat size={12} />
    </HStack>
  ) : (
    <Skeleton height={16} width={160} variant="darkSubtle" />
  )
}

export default MarketPrice
