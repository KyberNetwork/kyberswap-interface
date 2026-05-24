import { Trans } from '@lingui/macro'
import { CSSProperties, ReactNode, useState } from 'react'
import { Repeat } from 'react-feather'

import Dots from 'components/Dots'
import { removeTrailingZero } from 'components/swapv2/LimitOrder/helpers'
import { StyledBalanceMaxMini } from 'components/swapv2/styleds'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import { cn } from 'utils/cn'

interface TradePriceProps {
  price: BaseTradeInfo | undefined
  style: CSSProperties
  label?: string
  color?: string
  className?: string
  symbolIn: string | undefined
  symbolOut: string | undefined
  loading: boolean
  icon?: ReactNode
}

export default function TradePrice({
  price,
  style = {},
  label,
  color,
  className,
  symbolIn,
  symbolOut,
  loading,
  icon,
}: TradePriceProps) {
  const [showInverted, setShowInverted] = useState<boolean>(false)
  let formattedPrice
  try {
    if (price) {
      formattedPrice = showInverted
        ? removeTrailingZero(price?.invertRate.toPrecision(6))
        : removeTrailingZero(price?.marketRate.toPrecision(6))
    }
  } catch (error) {}

  const show = Boolean(price?.marketRate && price?.invertRate && formattedPrice && !loading)
  const value = showInverted
    ? `1 ${symbolOut} = ${formattedPrice} ${symbolIn}`
    : `1 ${symbolIn} = ${formattedPrice} ${symbolOut}`

  return (
    <span
      className={cn(
        'flex h-[22px] items-center text-xs font-medium leading-[14px] text-subText',
        show ? 'cursor-pointer' : 'cursor-default',
        className,
      )}
      style={style}
      onClick={() => setShowInverted(!showInverted)}
    >
      {show ? (
        <>
          {label && <>{label}&nbsp;</>}
          <span style={{ color }}>{value}</span>
          <StyledBalanceMaxMini hover={!icon}>{icon || <Repeat size={12} />}</StyledBalanceMaxMini>
        </>
      ) : loading ? (
        <Dots>
          <Trans>Calculating</Trans>
        </Dots>
      ) : (
        <span className="text-warning">
          <Trans>Unable to get the market price</Trans>
        </span>
      )}
    </span>
  )
}
